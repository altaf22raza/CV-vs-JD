import nodemailer from 'nodemailer';

export type EmailProviderName = 'resend' | 'sendgrid' | 'smtp';

export class EmailDeliveryNotConfiguredError extends Error {
  readonly statusCode = 503;
  readonly code = 'EMAIL_DELIVERY_NOT_CONFIGURED';

  constructor(
    message = 'Email verification is temporarily unavailable because no email delivery provider is configured. Please sign in with Google or try again later.'
  ) {
    super(message);
    this.name = 'EmailDeliveryNotConfiguredError';
  }
}

export class EmailDeliveryFailedError extends Error {
  readonly statusCode = 502;
  readonly code = 'EMAIL_DELIVERY_FAILED';

  constructor(message = 'Failed to deliver verification email. Please verify your email address and try again.') {
    super(message);
    this.name = 'EmailDeliveryFailedError';
  }
}

function getSenderAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    ''
  );
}

export function getConfiguredEmailProvider(): EmailProviderName | null {
  const from = getSenderAddress();

  if (process.env.RESEND_API_KEY?.trim() && from) {
    return 'resend';
  }
  if (process.env.SENDGRID_API_KEY?.trim() && from) {
    return 'sendgrid';
  }
  if (process.env.SMTP_HOST?.trim() && from) {
    return 'smtp';
  }
  return null;
}

export function isEmailDeliveryConfigured(): boolean {
  return getConfiguredEmailProvider() !== null;
}

function maskEmailForLogs(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function buildOtpEmailContent(code: string, expiresInMinutes: number) {
  const subject = 'Your CV vs JD Verification Code';
  const text = [
    'CV vs JD — Email Verification',
    '',
    `Your 6-digit verification code is: ${code}`,
    '',
    `This code expires in ${expiresInMinutes} minutes and can only be used once.`,
    'If you did not request this code, you can safely ignore this email.',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background-color:#F7F9FC;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#182230;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid #E5EAF0;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:#173B65;padding:20px 24px;color:#FFFFFF;font-size:16px;font-weight:700;">
          CV vs JD — Sign-In Verification
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">
            Use the one-time verification code below to complete your sign-in:
          </p>
          <div style="margin:20px 0;padding:16px;background:#F7F9FC;border:1px solid #E5EAF0;border-radius:10px;text-align:center;">
            <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:28px;font-weight:700;letter-spacing:8px;color:#173B65;">
              ${code}
            </span>
          </div>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#475569;">
            This code expires in <strong>${expiresInMinutes} minutes</strong> and can only be used once.
          </p>
          <p style="margin:0;font-size:12px;line-height:1.5;color:#64748B;">
            If you did not request this code, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

async function sendViaResend(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new EmailDeliveryNotConfiguredError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        text: params.text,
        html: params.html,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[EMAIL] Resend error ${res.status}:`, detail.slice(0, 200));
      throw new EmailDeliveryFailedError('Verification email delivery failed via provider.');
    }
  } finally {
    clearTimeout(timer);
  }
}

async function sendViaSendGrid(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) throw new EmailDeliveryNotConfiguredError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: params.from },
        subject: params.subject,
        content: [
          { type: 'text/plain', value: params.text },
          { type: 'text/html', value: params.html },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[EMAIL] SendGrid error ${res.status}:`, detail.slice(0, 200));
      throw new EmailDeliveryFailedError('Verification email delivery failed via provider.');
    }
  } finally {
    clearTimeout(timer);
  }
}

async function sendViaSmtp(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) throw new EmailDeliveryNotConfiguredError();

  const port = Number(process.env.SMTP_PORT || 587);
  const secureEnv = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureEnv ? secureEnv === 'true' : port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const allowInsecureTls = process.env.SMTP_IGNORE_TLS_VERIFY === 'true';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    ...(user && pass ? { auth: { user, pass } } : {}),
    ...(allowInsecureTls ? { tls: { rejectUnauthorized: false } } : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 12_000,
  });

  try {
    await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
  } catch (err) {
    console.error(
      '[EMAIL] SMTP delivery failed:',
      err instanceof Error ? err.message : 'Unknown SMTP error'
    );
    throw new EmailDeliveryFailedError('Could not deliver verification email via SMTP server.');
  }
}

/**
 * Dispatches an OTP verification email through a configured real email delivery provider.
 * Fails closed (throws EmailDeliveryNotConfiguredError) if no provider is configured.
 */
export async function sendOtpEmail(params: {
  to: string;
  code: string;
  expiresInMinutes: number;
}): Promise<{ provider: EmailProviderName }> {
  const provider = getConfiguredEmailProvider();
  const from = getSenderAddress();

  if (!provider || !from) {
    throw new EmailDeliveryNotConfiguredError();
  }

  const content = buildOtpEmailContent(params.code, params.expiresInMinutes);
  const mailPayload = {
    to: params.to,
    from,
    ...content,
  };

  if (provider === 'resend') {
    await sendViaResend(mailPayload);
  } else if (provider === 'sendgrid') {
    await sendViaSendGrid(mailPayload);
  } else {
    await sendViaSmtp(mailPayload);
  }

  console.log(`[EMAIL] Sent OTP verification email via ${provider} to ${maskEmailForLogs(params.to)}`);
  return { provider };
}

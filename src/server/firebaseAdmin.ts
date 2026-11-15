import fs from 'node:fs';
import path from 'node:path';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const ADMIN_APP_NAME = 'cvvsjd-firebase-admin';

interface AppletConfigInfo {
  projectId?: string;
  firestoreDatabaseId?: string;
}

let cachedAppletConfig: AppletConfigInfo | null = null;

export function getFirebaseAppletConfig(): AppletConfigInfo {
  if (cachedAppletConfig) return cachedAppletConfig;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    const raw = fs.readFileSync(configPath, 'utf8');
    cachedAppletConfig = JSON.parse(raw) as AppletConfigInfo;
    return cachedAppletConfig;
  } catch {
    return {};
  }
}

function parseServiceAccountFromEnv(): ServiceAccount | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!rawJson) return null;

  const parsed = JSON.parse(rawJson) as ServiceAccount & { private_key?: string };
  if (typeof parsed.private_key === 'string' && parsed.private_key.includes('\\n')) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
}

export function hasExplicitServiceAccountEnv(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  );
}

export function getFirebaseAdminApp(): App {
  const existing = getApps().find((a) => a.name === ADMIN_APP_NAME);
  if (existing) return existing;

  const cfg = getFirebaseAppletConfig();
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || cfg.projectId;
  const serviceAccount = parseServiceAccountFromEnv();

  if (serviceAccount) {
    const saProjectId =
      (serviceAccount as { project_id?: string }).project_id || serviceAccount.projectId;
    return initializeApp(
      {
        credential: cert(serviceAccount),
        projectId: projectId || saProjectId,
      },
      ADMIN_APP_NAME
    );
  }

  return initializeApp(
    {
      credential: applicationDefault(),
      ...(projectId ? { projectId } : {}),
    },
    ADMIN_APP_NAME
  );
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore(): Firestore {
  const cfg = getFirebaseAppletConfig();
  const databaseId =
    process.env.FIRESTORE_DATABASE_ID?.trim() || cfg.firestoreDatabaseId || '(default)';
  return getFirestore(getFirebaseAdminApp(), databaseId);
}

import { StructuredResume } from '../types/resume';

// Helper to escape LaTeX special characters in user text
export function escapeLatex(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

// Convert StructuredResume into valid LaTeX string matching the exact requested template
export function generateLatexFromStructured(data: StructuredResume): string {
  const experiencesLatex = data.experience.map(exp => {
    const bulletsLatex = exp.bullets.map(b => `\\item ${b}`).join('\n\n');
    return `\\entry{${exp.role}}{${exp.company}}{${exp.startDate}--${exp.endDate}}{
\\begin{itemize}
${bulletsLatex}
\\end{itemize}
}`;
  }).join('\n\\vspace{3pt}\n');

  const educationLatex = data.education.map(edu => {
    const detailPart = edu.details ? ` $\\vert$ ${edu.details}` : '';
    return `\\entry{${edu.degree}}{${edu.institution}}{${edu.duration}${detailPart}}{}`;
  }).join('\n\\vspace{1pt}\n');

  const projectsLatex = data.projects.map(proj => {
    const linkPart = proj.linkUrl ? `{\\href{${proj.linkUrl}}{${proj.linkText || 'Link'}}}` : `{${proj.linkText || ''}}`;
    const bulletsLatex = proj.bullets.map(b => `\\item ${b}`).join('\n');
    return `\\entry{${proj.title}}
${linkPart}{${proj.subtitle}}{
\\begin{itemize}
${bulletsLatex}
\\end{itemize}
}`;
  }).join('\n\\vspace{2pt}\n');

  const skillsLatex = data.skills.map(s => {
    return `\\item \\textbf{${s.category}:} ${s.items.join(', ')}`;
  }).join('\n');

  const certsLatex = data.certifications.map(c => {
    return `\\textbf{${c.category}:} ${c.items.join(' \\ $\\vert$ \\ ')}`;
  }).join('\\\\\n');

  // Contact line items
  const contactParts: string[] = [];
  if (data.contact.location) contactParts.push(data.contact.location);
  if (data.contact.phone) contactParts.push(`\\href{tel:${data.contact.phone.replace(/\s+/g, '')}}{${data.contact.phone}}`);
  if (data.contact.email) contactParts.push(`\\href{mailto:${data.contact.email}}{${data.contact.email}}`);
  if (data.contact.linkedin) {
    const cleanLinkedin = data.contact.linkedin.replace(/^https?:\/\/(www\.)?/, '');
    contactParts.push(`\\href{${data.contact.linkedin}}{${cleanLinkedin}}`);
  }
  if (data.contact.github) {
    const cleanGithub = data.contact.github.replace(/^https?:\/\/(www\.)?/, '');
    contactParts.push(`\\href{${data.contact.github}}{${cleanGithub}}`);
  }
  const contactLine = contactParts.join(' \\ $\\vert$\\ ');

  return `\\documentclass[10pt,a4paper]{article}
\\usepackage[left=0.5in,right=0.5in,top=0.30in,bottom=0.30in]{geometry}
\\usepackage{titlesec,enumitem,xcolor,hyperref}
\\usepackage[T1]{fontenc}
\\usepackage{tabularx}
\\definecolor{text}{HTML}{222222}
\\definecolor{accent}{HTML}{1F2A44}
\\hypersetup{colorlinks=true,urlcolor=accent,linkcolor=accent}
\\usepackage[scaled=0.95]{helvet}
\\renewcommand{\\familydefault}{\\sfdefault}
\\titleformat{\\section}{\\normalsize\\bfseries\\color{accent}}{}{0em}{}[\\vspace{-4pt}\\color{accent}\\rule{\\linewidth}{0.8pt}]
\\titlespacing*{\\section}{0pt}{4pt}{2pt}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\setlist[itemize]{leftmargin=10pt,itemsep=0pt,topsep=1pt,parsep=0pt,partopsep=0pt}
\\newcommand{\\entry}[4]{%
    \\noindent
    \\begin{tabularx}{\\linewidth}{@{}Xr@{}}
        \\textbf{#1} \\textit{#2} & {\\color{text}#3}\\\\
    \\end{tabularx}\\par
    \\vspace{-2pt}
    #4
    \\vspace{1pt}
}
\\pagestyle{empty}
\\linespread{0.98}
\\begin{document}
\\begin{center}
{\\Large\\bfseries\\color{accent} ${data.name}}\\\\[2pt]
{\\normalsize\\bfseries\\color{text}
${data.targetRoleHeadline}
}\\\\[3pt]
{\\small\\color{text}
${contactLine}
}
\\end{center}
{\\color{accent}\\rule{\\linewidth}{0.8pt}}
\\section*{Professional Summary}
${data.summary}
\\section*{Professional Experience}
${experiencesLatex}
\\section*{Education}
${educationLatex}
\\section*{Projects}
${projectsLatex}
\\section*{Skills}
\\begin{itemize}
${skillsLatex}
\\end{itemize}
\\section*{Certifications}
${certsLatex}

\\end{document}`;
}

// Parses raw text or basic LaTeX to extract structured sections
export function parseResumeText(rawText: string): Partial<StructuredResume> {
  const result: Partial<StructuredResume> = {};
  
  // Try extracting name from LaTeX center block or top line
  const nameMatch = rawText.match(/{\\Large\\bfseries\\color{accent}\s*([^}]+)}/) ||
                    rawText.match(/^([A-Z\s]{4,30})/m);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  // Summary
  const summaryMatch = rawText.match(/\\section\*{Professional Summary}\s*([\s\S]*?)(?=\\section\*)/i) ||
                       rawText.match(/Professional Summary[:\s]*([\s\S]*?)(?=(Experience|Education|Skills|Projects))/i);
  if (summaryMatch) {
    result.summary = summaryMatch[1].replace(/\\vspace\{[^}]+\}/g, '').trim();
  }

  return result;
}

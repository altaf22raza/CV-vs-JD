import { StructuredResume } from '../types/resume';

export const DEFAULT_LATEX_TEMPLATE = `\\documentclass[10pt,a4paper]{article}
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
{\\Large\\bfseries\\color{accent} ALEX MORGAN}\\\\[2pt]
{\\normalsize\\bfseries\\color{text}
Product Manager | Cloud & Data Platforms | 0$\\rightarrow$1 SaaS Execution
}\\\\[3pt]
{\\small\\color{text}
San Francisco, CA \\ $\\vert$\\ \\href{tel:+15550192834}{(555) 019-2834} \\ $\\vert$\\ \\href{mailto:alex.morgan@example.com}{alex.morgan@example.com} \\ $\\vert$\\ \\href{https://linkedin.com/in/alexmorgan}{linkedin.com/in/alexmorgan} \\ $\\vert$\\ \\href{https://github.com/alexmorgan}{github.com/alexmorgan}
}
\\end{center}
{\\color{accent}\\rule{\\linewidth}{0.8pt}}
\\section*{Professional Summary}
Product-focused professional with 3+ years of experience leading 0-to-1 cloud and data products from discovery through launch and scale. Proven track record conducting 60+ customer interviews, prioritizing roadmaps using RICE scoring, and collaborating closely with engineering and UX teams across Agile sprints. Strong technical background in SQL, Python, and cloud data architectures, delivering automated analytics workflows that reduced operational friction by 35\\% and grew adoption to 15,000+ monthly active users.
\\section*{Professional Experience}
\\entry{Product Manager}{Nexus Cloud Technologies}{2022--Present}{
\\begin{itemize}
\\item Defined product vision and multi-quarter roadmap for a B2B cloud monitoring and analytics platform, scaling adoption from zero to 15,000+ MAU across 120 enterprise accounts.
\\item Conducted 60+ customer discovery interviews with engineering managers and DevOps leads to identify high-friction bottlenecks, resulting in 3 core automated dashboard modules.
\\item Authored 50+ PRDs and prioritized user stories in Jira with engineering and design leads across 12 bi-weekly Agile sprints, maintaining a 94\\% on-time milestone delivery rate.
\\item Designed self-service onboarding flows that reduced customer time-to-value from 14 days to 48 hours, accelerating free-to-paid conversion by 28\\%.
\\item Established key product telemetry metrics using SQL and Mixpanel to measure daily feature usage, retention cohorts, and drop-off rates for executive leadership reviews.
\\end{itemize}
}
\\vspace{3pt}
\\entry{Associate Product Manager}{DataSphere Inc.}{2020--2022}{
\\begin{itemize}
\\item Owned end-to-end delivery of automated reporting pipelines and data export integrations, saving customer operations teams over 20 hours per week in manual spreadsheet work.
\\item Collaborated with cross-functional sales, customer success, and engineering stakeholders to maintain a unified product backlog aligned with business ARR goals.
\\item Led weekly sprint planning, backlog refinement, and retrospectives while ensuring clear acceptance criteria and QA testing procedures.
\\end{itemize}
}
\\section*{Education}
\\entry{M.S. in Information Systems & Analytics}{University of California, Berkeley}{2018--2020 $\\vert$ GPA: 3.85/4.00}{}
\\vspace{1pt}
\\entry{B.S. in Computer Science}{University of Michigan, Ann Arbor}{2014--2018 $\\vert$ GPA: 3.80/4.00}{}
\\section*{Projects}
\\entry{Customer Churn Prediction & Retention Analytics}
{\\href{https://github.com/alexmorgan/churn-analytics}{GitHub}}{Cloud Analytics Project | 2023}{
\\begin{itemize}
\\item Built an automated customer health scoring model utilizing historical product event logs and telemetry to identify at-risk enterprise accounts 30 days before renewal.
\\item Implemented interactive data visualizations in Streamlit and Tableau to provide customer success managers with actionable intervention playbooks.
\\end{itemize}
}
\\section*{Skills}
\\begin{itemize}
\\item \\textbf{Product Management:} Product Strategy, Roadmap Planning, PRD Authoring, User Research, Customer Interviews, RICE Prioritization, Agile/Scrum, Sprint Planning, Backlog Grooming, Feature Scoping, Stakeholder Management
\\item \\textbf{Analytics & Data:} Product Telemetry, Funnel Analysis, Cohort Retention, A/B Testing, SQL, Python, Mixpanel, Amplitude, Google Analytics, Tableau, Metabase
\\item \\textbf{Technical & Cloud:} REST APIs, Cloud Architectures, PostgreSQL, Snowflake, AWS Fundamentals, Git, GitHub, Jira, Confluence, Figma
\\item \\textbf{Product Domains:} B2B SaaS, Cloud Infrastructure, Data & Analytics Tools, Enterprise Workflow Automation
\\end{itemize}
\\section*{Certifications}
\\textbf{Product:} Certified Scrum Product Owner (CSPO) --- Scrum Alliance \\ $\\vert$ \\ Product Strategy & Metrics --- Pragmatic Institute\\\\
\\textbf{Cloud & Data:} AWS Certified Cloud Practitioner --- Amazon Web Services \\ $\\vert$ \\ Complete SQL Bootcamp --- Udemy

\\end{document}`;

export const DEFAULT_STRUCTURED_RESUME: StructuredResume = {
  name: "Alex Morgan",
  targetRoleHeadline: "Product Manager | Cloud & Data Platforms | 0→1 SaaS Execution",
  templateId: "template-pm",
  contact: {
    location: "San Francisco, CA",
    phone: "(555) 019-2834",
    email: "alex.morgan@example.com",
    linkedin: "https://linkedin.com/in/alexmorgan",
    github: "https://github.com/alexmorgan",
  },
  summary: "Product-focused professional with 3+ years of experience leading 0-to-1 cloud and data products from discovery through launch and scale. Proven track record conducting 60+ customer interviews, prioritizing roadmaps using RICE scoring, and collaborating closely with engineering and UX teams across Agile sprints. Strong technical background in SQL, Python, and cloud data architectures, delivering automated analytics workflows that reduced operational friction by 35% and grew adoption to 15,000+ monthly active users.",
  experience: [
    {
      id: "exp-1",
      role: "Product Manager",
      company: "Nexus Cloud Technologies",
      startDate: "2022",
      endDate: "Present",
      bullets: [
        "Defined product vision and multi-quarter roadmap for a B2B cloud monitoring and analytics platform, scaling adoption from zero to 15,000+ MAU across 120 enterprise accounts.",
        "Conducted 60+ customer discovery interviews with engineering managers and DevOps leads to identify high-friction bottlenecks, resulting in 3 core automated dashboard modules.",
        "Authored 50+ PRDs and prioritized user stories in Jira with engineering and design leads across 12 bi-weekly Agile sprints, maintaining a 94% on-time milestone delivery rate.",
        "Designed self-service onboarding flows that reduced customer time-to-value from 14 days to 48 hours, accelerating free-to-paid conversion by 28%.",
        "Established key product telemetry metrics using SQL and Mixpanel to measure daily feature usage, retention cohorts, and drop-off rates for executive leadership reviews."
      ]
    },
    {
      id: "exp-2",
      role: "Associate Product Manager",
      company: "DataSphere Inc.",
      startDate: "2020",
      endDate: "2022",
      bullets: [
        "Owned end-to-end delivery of automated reporting pipelines and data export integrations, saving customer operations teams over 20 hours per week in manual spreadsheet work.",
        "Collaborated with cross-functional sales, customer success, and engineering stakeholders to maintain a unified product backlog aligned with business ARR goals.",
        "Led weekly sprint planning, backlog refinement, and retrospectives while ensuring clear acceptance criteria and QA testing procedures."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      degree: "M.S. in Information Systems & Analytics",
      institution: "University of California, Berkeley",
      duration: "2018--2020",
      details: "GPA: 3.85/4.00"
    },
    {
      id: "edu-2",
      degree: "B.S. in Computer Science",
      institution: "University of Michigan, Ann Arbor",
      duration: "2014--2018",
      details: "GPA: 3.80/4.00"
    }
  ],
  projects: [
    {
      id: "proj-1",
      title: "Customer Churn Prediction & Retention Analytics",
      linkText: "GitHub",
      linkUrl: "https://github.com/alexmorgan/churn-analytics",
      subtitle: "Cloud Analytics Project | 2023",
      bullets: [
        "Built an automated customer health scoring model utilizing historical product event logs and telemetry to identify at-risk enterprise accounts 30 days before renewal.",
        "Implemented interactive data visualizations in Streamlit and Tableau to provide customer success managers with actionable intervention playbooks."
      ]
    }
  ],
  skills: [
    {
      id: "skill-1",
      category: "Product Management",
      items: [
        "Product Strategy", "Roadmap Planning", "PRD Authoring", "User Research",
        "Customer Interviews", "RICE Prioritization", "Agile/Scrum", "Sprint Planning",
        "Backlog Grooming", "Feature Scoping", "Stakeholder Management"
      ]
    },
    {
      id: "skill-2",
      category: "Analytics & Data",
      items: [
        "Product Telemetry", "Funnel Analysis", "Cohort Retention", "A/B Testing",
        "SQL", "Python", "Mixpanel", "Amplitude", "Tableau", "Metabase"
      ]
    },
    {
      id: "skill-3",
      category: "Technical & Cloud",
      items: [
        "REST APIs", "Cloud Architectures", "PostgreSQL", "Snowflake", "AWS Fundamentals",
        "Git", "GitHub", "Jira", "Confluence", "Figma"
      ]
    },
    {
      id: "skill-4",
      category: "Product Domains",
      items: [
        "B2B SaaS", "Cloud Infrastructure", "Data & Analytics Tools", "Workflow Automation"
      ]
    }
  ],
  certifications: [
    {
      id: "cert-1",
      category: "Product",
      items: [
        "Certified Scrum Product Owner (CSPO) --- Scrum Alliance",
        "Product Strategy & Metrics --- Pragmatic Institute"
      ]
    },
    {
      id: "cert-2",
      category: "Cloud & Data",
      items: [
        "AWS Certified Cloud Practitioner --- Amazon Web Services",
        "Complete SQL Bootcamp --- Udemy"
      ]
    }
  ]
};

export const SAMPLE_JOB_DESCRIPTIONS = [
  {
    id: "jd-1",
    role: "Associate Product Manager (AI & Data)",
    company: "Razorpay",
    industry: "FinTech / SaaS",
    text: `About the Role:
Razorpay is looking for an Associate Product Manager to join our AI & Data Platform team. You will drive 0-to-1 and scaling initiatives for intelligent automated workflows, merchant insights, and risk intelligence products.

Key Responsibilities:
- Partner closely with engineering, data science, and design to define product roadmap, user stories, and acceptance criteria.
- Conduct continuous user research and quantitative data analysis (SQL, Python) to uncover high-impact friction points.
- Translate complex machine learning models into intuitive user experiences for B2B merchants.
- Lead Agile sprint ceremonies, backlog grooming, and post-launch metric tracking.
- Collaborate with cross-functional business stakeholders to align product strategy with revenue goals.

Requirements:
- 1-2 years of experience in product management or software engineering with a product orientation.
- Strong technical grounding in AI/ML, Data Analytics, Python, and SQL.
- Demonstrated experience in user research, discovery, PRD authoring, and Agile sprints.
- Strong product sense with an ability to distill complex analytical insights into customer-centric features.
- Bachelor's or Master's degree in Computer Science, Data Analytics, or related technical field.`
  },
  {
    id: "jd-2",
    role: "AI Product Manager",
    company: "Swiggy",
    industry: "Consumer Tech / Logistics",
    text: `Role: AI Product Manager - Platform Intelligence
Location: Bangalore, India

What You'll Do:
- Own the vision, strategy, and execution of AI-driven recommendation and automated operational tools.
- Work closely with Deep Learning, LLM, and Data Science researchers to productize predictive models.
- Conduct in-depth qualitative interviews and quantitative experiments to optimize user journeys.
- Craft crisp user stories, functional specs, and KPIs for multi-stakeholder interfaces.
- Drive rapid 0-to-1 execution in fast-paced sprint cycles.

Requirements:
- Prior Product Management experience shipping SaaS or consumer software products.
- Deep hands-on fluency in AI/ML concepts (Transformers, Deep Learning, Predictive Modeling, Time-Series).
- Proficiency with SQL, Python, Jira, and Figma.
- Outstanding analytical mindset, proven problem-solving, and cross-functional leadership.`
  },
  {
    id: "jd-3",
    role: "Technical Product Manager",
    company: "Microsoft",
    industry: "Cloud & Enterprise AI",
    text: `Overview:
We are seeking a Technical Product Manager to join our Enterprise Cloud & Data Solutions team. In this role, you will bridge the gap between engineering, customer stakeholders, and executive leadership to build scalable, AI-powered developer and data products.

Responsibilities:
- Define product vision, write technical specifications, and manage the product backlog for cloud data systems.
- Engage with enterprise customers to understand architectural pain points and translate them into actionable requirements.
- Collaborate with engineering leads on API design, data pipelines, and machine learning infrastructure.
- Monitor product health through telemetry, customer satisfaction metrics, and data dashboards (Power BI / SQL).

Qualifications:
- Bachelor's or Master's degree in Computer Science or Data Analytics.
- Experience delivering enterprise SaaS or data-intensive products.
- Strong foundation in software architectures, SQL, and data analysis.
- Proven track record of cross-functional influence and agile execution.`
  }
];

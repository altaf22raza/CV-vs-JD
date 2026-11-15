import { SupportedLanguage } from '../types/resume';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

export const RESUME_SECTION_LABELS: Record<
  SupportedLanguage,
  {
    summary: string;
    experience: string;
    education: string;
    projects: string;
    skills: string;
    certifications: string;
  }
> = {
  en: {
    summary: 'Professional Summary',
    experience: 'Professional Experience',
    education: 'Education',
    projects: 'Key Projects & Initiatives',
    skills: 'Core Competencies & Skills',
    certifications: 'Certifications',
  },
  es: {
    summary: 'Resumen Profesional',
    experience: 'Experiencia Profesional',
    education: 'Educación',
    projects: 'Proyectos Clave e Iniciativas',
    skills: 'Competencias y Habilidades',
    certifications: 'Certificaciones',
  },
  fr: {
    summary: 'Profil Professionnel',
    experience: 'Expérience Professionnelle',
    education: 'Formation',
    projects: 'Projets Clés et Initiatives',
    skills: 'Compétences Clés',
    certifications: 'Certifications',
  },
  de: {
    summary: 'Berufsprofil',
    experience: 'Berufserfahrung',
    education: 'Ausbildung',
    projects: 'Schlüsselprojekte',
    skills: 'Kernkompetenzen & Kenntnisse',
    certifications: 'Zertifizierungen',
  },
  hi: {
    summary: 'व्यावसायिक सारांश',
    experience: 'कार्य अनुभव',
    education: 'शिक्षा',
    projects: 'प्रमुख प्रोजेक्ट्स',
    skills: 'मुख्य कौशल',
    certifications: 'प्रमाणपत्र',
  },
};

export interface UiStrings {
  navHome: string;
  navMyCvs: string;
  navCreateCv: string;
  navOptimizeCv: string;
  navCareerPrep: string;
  navApplications: string;
  ctaOptimize: string;
  signIn: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  uploadCv: string;
  createNewCv: string;
  optimizeForJob: string;
  welcomeBack: string;
  recentlyEdited: string;
  savedJdsTitle: string;
  profileCompletion: string;
  previousReports: string;
  languageLabel: string;
}

export const UI_TRANSLATIONS: Record<SupportedLanguage, UiStrings> = {
  en: {
    navHome: 'Home',
    navMyCvs: 'My CVs',
    navCreateCv: 'Create CV',
    navOptimizeCv: 'Optimize CV',
    navCareerPrep: 'Career Prep',
    navApplications: 'Applications',
    ctaOptimize: 'Optimize for JD',
    signIn: 'Sign In',
    heroEyebrow: 'Resume Architecture & Job Alignment',
    heroTitle: 'Create, Manage, and Optimize Your CV for Any Job Description',
    heroSubtitle:
      'Align your genuine experience directly with target role requirements. Built to improve recruiter readability, ATS keyword compatibility, cover letters, and interview readiness.',
    uploadCv: 'Upload CV',
    createNewCv: 'Create New CV',
    optimizeForJob: 'Optimize CV for a Job',
    welcomeBack: 'Welcome back',
    recentlyEdited: 'Recently Edited Resumes',
    savedJdsTitle: 'Saved Job Descriptions',
    profileCompletion: 'Profile Completion',
    previousReports: 'Previous Optimization Reports',
    languageLabel: 'Language',
  },
  es: {
    navHome: 'Inicio',
    navMyCvs: 'Mis CVs',
    navCreateCv: 'Crear CV',
    navOptimizeCv: 'Optimizar CV',
    navCareerPrep: 'Preparación',
    navApplications: 'Postulaciones',
    ctaOptimize: 'Optimizar CV',
    signIn: 'Iniciar sesión',
    heroEyebrow: 'Arquitectura de CV y Alineación Laboral',
    heroTitle: 'Crea, Gestiona y Optimiza tu CV para Cualquier Oferta',
    heroSubtitle:
      'Alinea tu experiencia real con los requisitos del puesto objetivo. Mejora la legibilidad ATS, cartas de presentación y preparación para entrevistas.',
    uploadCv: 'Subir CV',
    createNewCv: 'Crear Nuevo CV',
    optimizeForJob: 'Optimizar CV para Oferta',
    welcomeBack: 'Bienvenido de nuevo',
    recentlyEdited: 'Currículums Editados Recientemente',
    savedJdsTitle: 'Descripciones de Puesto Guardadas',
    profileCompletion: 'Progreso del Perfil',
    previousReports: 'Informes de Optimización Previos',
    languageLabel: 'Idioma',
  },
  fr: {
    navHome: 'Accueil',
    navMyCvs: 'Mes CVs',
    navCreateCv: 'Créer CV',
    navOptimizeCv: 'Optimiser CV',
    navCareerPrep: 'Préparation',
    navApplications: 'Candidatures',
    ctaOptimize: 'Optimiser CV',
    signIn: 'Connexion',
    heroEyebrow: 'Architecture de CV & Adéquation Poste',
    heroTitle: 'Créez, Gérez et Optimisez Votre CV pour Chaque Offre',
    heroSubtitle:
      'Alignez votre expérience réelle sur les exigences du poste visé. Améliorez la compatibilité ATS, vos lettres de motivation et vos entretiens.',
    uploadCv: 'Importer CV',
    createNewCv: 'Créer un CV',
    optimizeForJob: 'Optimiser pour une Offre',
    welcomeBack: 'Bon retour',
    recentlyEdited: 'CVs Modifiés Récemment',
    savedJdsTitle: 'Offres d’Emploi Enregistrées',
    profileCompletion: 'Complétion du Profil',
    previousReports: 'Rapports d’Optimisation Précédents',
    languageLabel: 'Langue',
  },
  de: {
    navHome: 'Startseite',
    navMyCvs: 'Meine CVs',
    navCreateCv: 'CV Erstellen',
    navOptimizeCv: 'CV Optimieren',
    navCareerPrep: 'Karriere-Prep',
    navApplications: 'Bewerbungen',
    ctaOptimize: 'Für Stelle optimieren',
    signIn: 'Anmelden',
    heroEyebrow: 'Lebenslauf-Architektur & Stellenabgleich',
    heroTitle: 'Erstellen, Verwalten und Optimieren Sie Ihren CV für Jede Stelle',
    heroSubtitle:
      'Richten Sie Ihre tatsächliche Berufserfahrung gezielt auf Stellenanforderungen aus – inklusive ATS-Check, Anschreiben und Interview-Vorbereitung.',
    uploadCv: 'CV Hochladen',
    createNewCv: 'Neuen CV Erstellen',
    optimizeForJob: 'CV für Stelle Optimieren',
    welcomeBack: 'Willkommen zurück',
    recentlyEdited: 'Zuletzt Bearbeitete Lebensläufe',
    savedJdsTitle: 'Gespeicherte Stellenanzeigen',
    profileCompletion: 'Profilvollständigkeit',
    previousReports: 'Frühere Optimierungsberichte',
    languageLabel: 'Sprache',
  },
  hi: {
    navHome: 'होम',
    navMyCvs: 'मेरे CV',
    navCreateCv: 'नया CV',
    navOptimizeCv: 'CV ऑप्टिमाइज़',
    navCareerPrep: 'करियर तैयारी',
    navApplications: 'आवेदन ट्रैकर',
    ctaOptimize: 'जॉब के लिए ऑप्टिमाइज़',
    signIn: 'साइन इन',
    heroEyebrow: 'रिज़्यूमे आर्किटेक्चर और जॉब अलाइनमेंट',
    heroTitle: 'किसी भी जॉब विवरण के लिए अपना CV बनाएं, प्रबंधित करें और ऑप्टिमाइज़ करें',
    heroSubtitle:
      'अपने वास्तविक अनुभव को टारगेट रोल की ज़रूरतों से मिलाएं। ATS कीवर्ड मैचिंग, कवर लेटर और इंटरव्यू तैयारी के साथ।',
    uploadCv: 'CV अपलोड करें',
    createNewCv: 'नया CV बनाएं',
    optimizeForJob: 'जॉब के लिए CV ऑप्टिमाइज़ करें',
    welcomeBack: 'वापसी पर स्वागत है',
    recentlyEdited: 'हाल ही में संपादित रिज़्यूमे',
    savedJdsTitle: 'सहेजे गए जॉब विवरण',
    profileCompletion: 'प्रोफ़ाइल पूर्णता',
    previousReports: 'पिछली ऑप्टिमाइज़ेशन रिपोर्ट्स',
    languageLabel: 'भाषा',
  },
};

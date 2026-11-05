// Shared error pattern, Phase 2 increment 21.
// Every user-facing error has the same shape: a short plain error and
// one concrete solution. API routes return { error, solution }, pages
// render both through the ErrorNotice component. No error is ever a
// bare string, and a failed upload never shows a crippled document:
// the current draft stays exactly as it was, and the page says so.
// Language detection here uses only the extracted text and the word
// lists below, no new dependency. It only names a language when the
// evidence is strong; otherwise it says the language is unknown and
// offers the guided paste instead of guessing.

export function errorWithSolution(error, solution) {
  return {
    error: String(error || "Something went wrong."),
    solution: String(solution || "Try again.")
  };
}

export const LANGUAGE_NAMES = {
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish"
};

const LANGUAGE_WORDS = {
  en: [
    "the", "and", "that", "with", "have", "this", "will", "your", "from",
    "they", "know", "want", "been", "good", "much", "some", "time", "very",
    "when", "come", "here", "just", "like", "long", "many", "over", "such",
    "take", "than", "them", "well", "were", "should", "world", "through",
    "before", "after", "first", "people", "could", "would", "about", "other",
    "which", "their", "there", "these", "those", "where", "while", "under",
    "between", "because", "without", "within", "along", "across", "behind",
    "for", "in", "of", "to", "is", "are", "was", "on", "at", "by", "as",
    "it", "or", "if", "not", "no", "be", "do", "did", "has", "had", "am"
  ],
  de: [
    "der", "die", "das", "und", "ist", "ich", "von", "mit", "für", "nicht",
    "ein", "eine", "haben", "sind", "als", "auch", "bei", "nach", "über",
    "durch", "oder", "aber", "wenn", "dann", "sehr", "mehr", "können",
    "werden", "wurde", "meine", "mein", "seine", "ihre", "keine", "zwischen",
    "während", "schon", "noch", "jetzt", "heute", "hier", "dieser", "diese",
    "einen", "einer", "einem", "sowie", "soll", "sollte", "musste", "konnte",
    "wollen", "möchte", "viele", "alle", "jahr", "jahre", "arbeit",
    "erfahrung", "ausbildung", "kenntnisse", "sprache", "deutsch", "beruf",
    "lebenslauf", "projekt", "team", "kommunikation"
  ],
  fr: [
    "les", "des", "une", "est", "nous", "vous", "ils", "dans", "que", "qui",
    "pour", "avec", "plus", "aux", "être", "avoir", "faire", "aller",
    "venir", "voir", "savoir", "pouvoir", "vouloir", "très", "aussi",
    "comme", "mais", "tout", "tous", "toute", "toutes", "cette", "ces",
    "dont", "quand", "alors", "chez", "sans", "sous", "entre", "après",
    "avant", "pendant", "expérience", "compétences", "formation", "langue",
    "français", "curriculum", "projet", "équipe", "gestion"
  ],
  es: [
    "los", "las", "una", "que", "por", "con", "para", "sus", "del", "como",
    "más", "pero", "este", "esta", "estos", "estas", "ser", "estar",
    "haber", "tener", "hacer", "poder", "decir", "ver", "dar", "saber",
    "querer", "llegar", "pasar", "deber", "poner", "parecer", "quedar",
    "creer", "hablar", "llevar", "dejar", "seguir", "encontrar", "llamar",
    "venir", "pensar", "salir", "volver", "tomar", "conocer", "vivir",
    "sentir", "tratar", "mirar", "contar", "empezar", "esperar", "buscar",
    "existir", "entrar", "trabajar", "escribir", "perder", "producir",
    "ocurrir", "entender", "pedir", "recibir", "recordar", "terminar",
    "permitir", "aparecer", "conseguir", "comenzar", "servir", "sacar",
    "necesitar", "presentar", "resultar", "leer", "caer", "cambiar",
    "experiencia", "habilidades", "educación", "idioma", "español",
    "currículum", "proyecto", "equipo", "gestión"
  ]
};

export function detectLanguage(text) {
  const clean = String(text || "").toLowerCase();
  const tokens = clean.split(/[^a-zà-öø-ÿñß]+/).filter(Boolean);
  if (tokens.length < 15) {
    return { language: "unknown" };
  }
  const scores = { en: 0, de: 0, fr: 0, es: 0 };
  for (const lang of Object.keys(LANGUAGE_WORDS)) {
    const words = new Set(LANGUAGE_WORDS[lang]);
    const found = new Set();
    for (const token of tokens) {
      if (words.has(token)) {
        found.add(token);
      }
    }
    scores[lang] = found.size;
  }
  if (/ß/.test(clean)) {
    scores.de += 3;
  }
  if (/[äöü]/.test(clean)) {
    scores.de += 1;
  }
  if (/[ñ¿¡]/.test(clean)) {
    scores.es += 3;
  }
  if (/[çù]/.test(clean)) {
    scores.fr += 2;
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best = ranked[0];
  const second = ranked[1];
  if (best[1] >= 4 && best[1] >= second[1] + 2) {
    return { language: best[0] };
  }
  return { language: "unknown" };
}

function fileLabel(fileName) {
  const name = String(fileName || "the file").trim() || "the file";
  return name;
}

export function importErrors() {
  return {
    noFile: () =>
      errorWithSolution(
        "A PDF or DOCX file is required.",
        "Choose a PDF or DOCX file from your computer, then upload it again."
      ),
    wrongFormat: (fileName, received) =>
      errorWithSolution(
        `The file ${fileLabel(fileName)} is a ${received || "different"} file, not a PDF or DOCX file.`,
        "Save your CV as a PDF or DOCX file, then upload that file. Only PDF and DOCX files are read here."
      ),
    emptyFile: (fileName) =>
      errorWithSolution(
        `The file ${fileLabel(fileName)} is empty.`,
        "Check the file has content on your computer, then upload it again."
      ),
    oversize: (fileName) =>
      errorWithSolution(
        `The file ${fileLabel(fileName)} is larger than 5 MB.`,
        "Save a smaller copy of the file, then upload it again."
      ),
    unreadable: () =>
      errorWithSolution(
        "No readable text was found in this file.",
        "It may be a scanned image with no text layer. Use the guided paste instead: copy the text from your CV and paste it into the import box."
      ),
    failed: () =>
      errorWithSolution(
        "File import failed. Your draft was not changed.",
        "Check the file opens on your computer, save it as a fresh PDF or DOCX file, and try again."
      ),
    languageMismatch: (detectedName, expectedName) =>
      errorWithSolution(
        `This CV looks like it is written in ${detectedName}, but the builder language is ${expectedName}.`,
        `Switch the builder language to ${detectedName} above, or upload a CV written in ${expectedName}. If the CV is in another language, use the guided paste instead.`
      ),
    languageUnknown: (expectedName) =>
      errorWithSolution(
        "The language of this CV could not be determined.",
        `Check the parsed fields carefully before use, or use the guided paste instead and write the CV in ${expectedName}.`
      )
  };
}

export function linkedinErrors() {
  return {
    noFile: () =>
      errorWithSolution(
        "A LinkedIn export CSV file or ZIP file is required.",
        "Download your LinkedIn data export first, then upload the CSV files or the ZIP file here."
      ),
    wrongFormat: (fileName) =>
      errorWithSolution(
        `The file ${fileLabel(fileName)} is not a LinkedIn export CSV or ZIP file.`,
        "Upload the CSV files from your LinkedIn data export, or the ZIP file that holds them."
      ),
    emptyOrOversize: (fileName) =>
      errorWithSolution(
        `The file ${fileLabel(fileName)} is empty or larger than 5 MB.`,
        "Check the file on your computer, then upload it again. Each file must be 5 MB or smaller."
      ),
    zipUnreadable: (fileName) =>
      errorWithSolution(
        `The ZIP file ${fileLabel(fileName)} could not be read.`,
        "Check the ZIP file opens on your computer, download a fresh LinkedIn export if needed, and try again."
      ),
    zipNoCsv: (fileName) =>
      errorWithSolution(
        `No CSV files were found in the ZIP file ${fileLabel(fileName)}.`,
        "Unzip the LinkedIn export and upload the CSV files inside it, such as Profile.csv and Positions.csv."
      ),
    failed: () =>
      errorWithSolution(
        "LinkedIn export import failed. Your draft was not changed.",
        "Check the files are from your LinkedIn data export, then upload them again."
      )
  };
}

export function exportErrors() {
  return {
    invalid: () =>
      errorWithSolution(
        "A profile and a valid template are required to export.",
        "Choose a template above, fill in at least your name, then try the export again."
      ),
    format: () =>
      errorWithSolution(
        "The export format must be PDF or DOCX.",
        "Choose PDF or DOCX above, then try the export again."
      ),
    notAllowed: (reason) =>
      errorWithSolution(
        String(reason || "This export is not included in your plan."),
        "Choose a free template for a new document, or open the subscription page to check your plan."
      ),
    failed: () =>
      errorWithSolution(
        "Export failed. Your draft was not changed.",
        "Check your connection and try the export again. If it keeps failing, save a version first, then try again."
      )
  };
}

export function authErrors() {
  return {
    nameRequired: () =>
      errorWithSolution(
        "A name is required.",
        "Type your name in the Name field, then try again."
      ),
    emailInvalid: () =>
      errorWithSolution(
        "A valid email is required.",
        "Check the email address for a typo, then try again."
      ),
    passwordShort: () =>
      errorWithSolution(
        "The password must be at least 8 characters.",
        "Choose a longer password, at least 8 characters, then try again."
      ),
    passwordMismatch: () =>
      errorWithSolution(
        "The passwords do not match.",
        "Type the same password in both password fields, then try again."
      ),
    accountExists: () =>
      errorWithSolution(
        "An account with this email already exists.",
        "Sign in with that email instead, or use a different email address."
      ),
    loginMismatch: () =>
      errorWithSolution(
        "The email or password does not match.",
        "Check the email and password, then try again. If you cannot sign in, book a free consultation for help."
      ),
    tokenRequired: () =>
      errorWithSolution(
        "A session token is required to log out.",
        "Sign in again, then sign out."
      ),
    bodyNotJson: () =>
      errorWithSolution(
        "The request body must be JSON.",
        "Reload the page and try again."
      ),
    actionInvalid: () =>
      errorWithSolution(
        "The action must be signup, login, logout, request-reset, or reset.",
        "Reload the page and try again."
      )
  };
}

export function documentErrors() {
  return {
    tokenRequired: () =>
      errorWithSolution(
        "A session token is required.",
        "Sign in on the account page, then try again."
      ),
    sessionInvalid: () =>
      errorWithSolution(
        "That session is not valid or has expired.",
        "Sign in again on the account page, then try again."
      ),
    idRequired: () =>
      errorWithSolution(
        "A document id is required.",
        "Open the document from the dashboard, then try again."
      ),
    notFound: () =>
      errorWithSolution(
        "That document was not found.",
        "Open the dashboard to see your documents, then open the one you want."
      ),
    saveFailed: () =>
      errorWithSolution(
        "The document could not be saved. Your local draft was not changed.",
        "Check your connection and try again. Your draft stays saved in this browser."
      ),
    bodyNotJson: () =>
      errorWithSolution(
        "The request body must be JSON.",
        "Reload the page and try again."
      )
  };
}

export function humanHelpErrors() {
  return {
    validation: (message) =>
      errorWithSolution(
        String(message || "The details are not complete."),
        "Check the highlighted fields and send the request again."
      ),
    saveFailed: () =>
      errorWithSolution(
        "The request could not be saved. Please try again.",
        "Try again in a moment. If it keeps failing, book a free consultation instead."
      ),
    readFailed: () =>
      errorWithSolution(
        "The human help requests could not be read.",
        "Reload the admin page and try again. If it keeps failing, check the database status."
      ),
    bodyNotJson: () =>
      errorWithSolution(
        "The request body must be JSON.",
        "Reload the page and try again."
      )
  };
}

export function profileErrors() {
  return {
    tokenRequired: () =>
      errorWithSolution(
        "A session token is required.",
        "Sign in on the account page, then try again."
      ),
    sessionInvalid: () =>
      errorWithSolution(
        "That session is not valid or has expired.",
        "Sign in again on the account page, then try again."
      ),
    saveFailed: () =>
      errorWithSolution(
        "The profile could not be saved. Your profile in this browser was not changed.",
        "Check your connection and try again."
      ),
    bodyNotJson: () =>
      errorWithSolution(
        "The request body must be JSON.",
        "Reload the page and try again."
      )
  };
}

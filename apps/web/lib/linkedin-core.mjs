// LinkedIn export import, Phase 2 increment 12.
// Official data export import only. This module never contacts
// LinkedIn, never scrapes a LinkedIn page or profile, and never uses
// an unofficial API. The user downloads their own export from
// LinkedIn and uploads the CSV files here, or a ZIP of those files.
// The flow to show on the builder page is: LinkedIn on desktop,
// Settings and Privacy, Data Privacy, Get a copy of your data, pick
// at least Profile, Positions, Education, Skills, Certifications,
// and Languages, request the archive, unzip it, and upload the CSV
// files here. The profile photo is not in the export. Dates in
// Month YYYY form are kept as written, for correction.
// Parsing follows the same pattern as PDF and DOCX import: upload,
// parse, show parsed fields for correction with warnings, and only
// become a draft after user confirmation. Nothing here becomes a
// draft on its own, and no field is invented. Missing columns and
// missing files are warned about, never filled in. Unknown columns
// are warned about and their values are not used. Unparsed rows are
// reported, never silently dropped.

export const LINKEDIN_EXPECTED_FILES = [
  "Profile.csv",
  "Positions.csv",
  "Education.csv",
  "Skills.csv",
  "Certifications.csv",
  "Languages.csv"
];

const KNOWN_COLUMNS = {
  "Profile.csv": ["First Name", "Last Name", "Headline", "Summary", "Geo Location"],
  "Positions.csv": ["Company Name", "Title", "Description", "Location", "Started On", "Finished On"],
  "Education.csv": ["School Name", "Start Date", "End Date", "Degree Name", "Notes", "Activities"],
  "Skills.csv": ["Name"],
  "Certifications.csv": ["Name", "Authority", "License Number", "Url", "Started On", "Finished On"],
  "Languages.csv": ["Name", "Proficiency"]
};

function cleanHeader(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function cleanField(value) {
  return String(value || "").trim();
}

// Proper CSV parser. Handles quoted fields, embedded commas,
// embedded newlines, escaped double quotes (two double quotes in a
// quoted field mean one double quote), CRLF line endings, and a
// UTF-8 BOM at the start. Never a naive split on commas.
export function parseCsvText(text) {
  const input = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let fieldQuoted = false;
  let i = 0;
  const pushField = () => {
    row.push(fieldQuoted ? field : field.trim());
    field = "";
    fieldQuoted = false;
  };
  const pushRow = () => {
    pushField();
    const allEmpty = row.every((item) => item === "");
    if (!allEmpty) {
      rows.push(row);
    }
    row = [];
  };
  while (i < input.length) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }
    if (char === '"' && field === "" && !fieldQuoted) {
      inQuotes = true;
      fieldQuoted = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      if (input[i + 1] === "\n") {
        i += 2;
      } else {
        i += 1;
      }
      pushRow();
      continue;
    }
    if (char === "\n") {
      i += 1;
      pushRow();
      continue;
    }
    field += char;
    i += 1;
  }
  if (inQuotes) {
    // An unterminated quoted field is kept as read, not guessed.
    // The caller reports it through the row it produces.
    rows.push([...row, field]);
  } else if (field !== "" || row.length > 0) {
    pushRow();
  }
  return rows;
}

export function parseCsvWithHeaders(text) {
  const rows = parseCsvText(text);
  if (rows.length === 0) {
    return { headers: [], records: [] };
  }
  const headers = rows[0].map(cleanHeader);
  const records = [];
  for (let index = 1; index < rows.length; index += 1) {
    const record = {};
    headers.forEach((header, columnIndex) => {
      record[header] = cleanField(rows[index][columnIndex] || "");
    });
    for (let columnIndex = headers.length; columnIndex < rows[index].length; columnIndex += 1) {
      const extra = cleanField(rows[index][columnIndex]);
      if (extra) {
        record[`Extra column ${columnIndex + 1}`] = extra;
      }
    }
    records.push(record);
  }
  return { headers, records };
}

function emptyProfile() {
  return {
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    city: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    languages: [],
    customSections: []
  };
}

function periodFrom(start, end, currentWord) {
  const cleanStart = cleanField(start);
  const cleanEnd = cleanField(end);
  if (cleanStart && cleanEnd) {
    return `${cleanStart} to ${cleanEnd}`;
  }
  if (cleanStart && !cleanEnd) {
    return currentWord ? `${cleanStart} to ${currentWord}` : cleanStart;
  }
  if (!cleanStart && cleanEnd) {
    return cleanEnd;
  }
  return "";
}

function fileKeyFor(name) {
  const base = String(name || "").split("/").pop().split("\\").pop();
  const found = LINKEDIN_EXPECTED_FILES.find(
    (expected) => expected.toLowerCase() === base.toLowerCase()
  );
  return found || null;
}

// files: an object mapping a file name to CSV text. File names may
// carry a folder prefix, as they do inside a ZIP, and matching is
// case insensitive. Files that are not in the expected list are
// reported in unparsedLines, never silently used.
export function parseLinkedInExports(files) {
  const profile = emptyProfile();
  const warnings = [];
  const unparsedLines = [];
  const filesParsed = [];
  const filesMissing = [];
  const byKey = {};
  const supplied = files || {};
  for (const [name, text] of Object.entries(supplied)) {
    const key = fileKeyFor(name);
    if (!key) {
      unparsedLines.push(`File not used: ${name}. Only the six LinkedIn export CSV files listed on the builder page are used.`);
      continue;
    }
    if (byKey[key]) {
      warnings.push(`${key} was supplied more than once. Only the first copy was used.`);
      continue;
    }
    byKey[key] = String(text || "");
  }

  for (const expected of LINKEDIN_EXPECTED_FILES) {
    if (!byKey[expected]) {
      filesMissing.push(expected);
      warnings.push(`${expected} was not supplied, so its fields were left empty for correction. Nothing was invented for it.`);
      continue;
    }
    const parsed = parseCsvWithHeaders(byKey[expected]);
    filesParsed.push(expected);
    const known = KNOWN_COLUMNS[expected];
    for (const header of parsed.headers) {
      if (header && !known.includes(header)) {
        warnings.push(`Unknown column ${header} in ${expected} was not used. Check it and add it by hand if you need it.`);
      }
    }
    for (const missing of known) {
      if (!parsed.headers.includes(missing)) {
        warnings.push(`Column ${missing} is missing from ${expected}, so its fields were left empty for correction. Nothing was invented for it.`);
      }
    }

    if (expected === "Profile.csv") {
      const record = parsed.records[0] || {};
      const first = record["First Name"] || "";
      const last = record["Last Name"] || "";
      profile.fullName = [first, last].filter(Boolean).join(" ");
      profile.headline = record["Headline"] || "";
      profile.summary = record["Summary"] || "";
      profile.city = record["Geo Location"] || "";
      if (parsed.records.length === 0) {
        warnings.push("Profile.csv has no data row, so personal details were left empty for correction.");
      }
      if (parsed.records.length > 1) {
        warnings.push("Profile.csv has more than one data row. Only the first row was used.");
      }
    }

    if (expected === "Positions.csv") {
      parsed.records.forEach((record, index) => {
        const employer = record["Company Name"] || "";
        const jobTitle = record["Title"] || "";
        if (!employer && !jobTitle) {
          unparsedLines.push(`Positions.csv row ${index + 2} has no company name and no title, so it was not imported. Check it and add it by hand if you need it.`);
          return;
        }
        const bullets = String(record["Description"] || "")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        profile.experience.push({
          employer,
          jobTitle,
          location: record["Location"] || "",
          period: periodFrom(record["Started On"], record["Finished On"], "Present"),
          bullets
        });
      });
    }

    if (expected === "Education.csv") {
      const notesLines = [];
      parsed.records.forEach((record, index) => {
        const institution = record["School Name"] || "";
        const qualification = record["Degree Name"] || "";
        if (!institution && !qualification) {
          unparsedLines.push(`Education.csv row ${index + 2} has no school name and no degree name, so it was not imported. Check it and add it by hand if you need it.`);
          return;
        }
        profile.education.push({
          institution,
          qualification,
          period: periodFrom(record["Start Date"], record["End Date"], "")
        });
        const notes = record["Notes"] || "";
        const activities = record["Activities"] || "";
        if (notes || activities) {
          const label = institution || qualification;
          if (notes) {
            notesLines.push(`${label}: ${notes}`);
          }
          if (activities) {
            notesLines.push(`${label} activities: ${activities}`);
          }
        }
      });
      if (notesLines.length > 0) {
        profile.customSections.push({
          key: "custom-linkedin-education-notes",
          title: "Education notes",
          lines: notesLines
        });
      }
    }

    if (expected === "Skills.csv") {
      for (const record of parsed.records) {
        const name = record["Name"] || "";
        if (name) {
          profile.skills.push(name);
        }
      }
    }

    if (expected === "Certifications.csv") {
      const lines = [];
      parsed.records.forEach((record) => {
        const name = record["Name"] || "";
        if (!name) {
          return;
        }
        let line = name;
        if (record["Authority"]) {
          line += ` (${record["Authority"]})`;
        }
        const period = periodFrom(record["Started On"], record["Finished On"], "Present");
        if (period) {
          line += `, ${period}`;
        }
        if (record["License Number"]) {
          line += `, License Number: ${record["License Number"]}`;
        }
        if (record["Url"]) {
          line += `, ${record["Url"]}`;
        }
        lines.push(line);
      });
      if (lines.length > 0) {
        profile.customSections.push({
          key: "custom-linkedin-certifications",
          title: "Certifications",
          lines
        });
      }
    }

    if (expected === "Languages.csv") {
      for (const record of parsed.records) {
        const name = record["Name"] || "";
        if (!name) {
          continue;
        }
        profile.languages.push(record["Proficiency"] ? `${name} (${record["Proficiency"]})` : name);
      }
    }
  }

  if (!profile.fullName) {
    warnings.push("No name was found in Profile.csv.");
  }
  if (unparsedLines.length > 0) {
    warnings.push(`${unparsedLines.length} item(s) could not be matched to a field. Check them below before use.`);
  }
  return { profile, warnings, unparsedLines, filesParsed, filesMissing };
}

// Explicit confirmation step, used by the builder page and by tests.
// Parsing never changes a draft. Only this call, after the user has
// checked and corrected the parsed profile, returns a profile that
// the builder may apply as a draft.
export function applyLinkedInImportAfterConfirmation(parsedProfile) {
  if (!parsedProfile) {
    throw new Error("A parsed LinkedIn profile is required before it can be applied as a draft.");
  }
  return JSON.parse(JSON.stringify(parsedProfile));
}

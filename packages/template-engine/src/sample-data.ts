import type { CandidateProfile, ExperienceEntry } from "./types";

// SAMPLE DATA ONLY. Fictional person. Never present this as a real user.
// Sam Sample does not exist. All employers, dates, and achievements below
// are invented sample text for layout and export testing only, and are
// marked SAMPLE in code and in exported output.

function job(
  employer: string,
  jobTitle: string,
  location: string,
  period: string,
  bullets: string[]
): ExperienceEntry {
  return { employer, jobTitle, location, period, bullets };
}

const shortBullets = [
  "Coordinated sample project schedules and tracked sample milestones.",
  "Prepared sample status updates for a sample project team.",
  "Kept sample project documents organised and up to date."
];

export const shortSample: CandidateProfile = {
  sampleMarker: "SAMPLE",
  fullName: "Sam Sample",
  headline: "Sample Project Coordinator",
  email: "sam.sample@example.test",
  phone: "+00 000 000 000",
  city: "Sample City",
  summary:
    "SAMPLE: Fictional sample summary for layout testing only. Organised " +
    "sample project coordinator with experience in planning, scheduling, " +
    "and clear written updates for small teams.",
  experience: [
    job(
      "Sample Projects Ltd",
      "Sample Project Coordinator",
      "Sample City",
      "2022 to 2024",
      shortBullets
    ),
    job(
      "Sample Office Group",
      "Sample Project Assistant",
      "Sample City",
      "2020 to 2022",
      [
        "Supported sample project planning and sample meeting notes.",
        "Updated sample trackers and sample task lists each week."
      ]
    )
  ],
  education: [
    {
      institution: "Sample College",
      qualification: "Sample Diploma in Project Support",
      period: "2018 to 2020"
    }
  ],
  skills: ["Planning", "Scheduling", "Written updates", "Spreadsheets"],
  languages: ["English (Fluent, sample level)"]
};

// Long sample: enough experience, education, and project style content to
// force a second page in PDF at readable sizes. This is intentional, so
// the export test can prove pagination instead of clipping or shrinking.
function longJobs(): ExperienceEntry[] {
  const jobs: ExperienceEntry[] = [];
  for (let i = 1; i <= 8; i++) {
    jobs.push(
      job(
        `Sample Projects Ltd, Team ${i}`,
        i === 1 ? "Sample Project Coordinator" : "Sample Project Assistant",
        "Sample City",
        `20${10 + i} to 20${11 + i}`,
        [
          `Led sample planning work for sample team ${i}, with weekly sample reviews.`,
          `Coordinated sample schedules, sample milestones, and sample handover notes for team ${i}.`,
          `Prepared sample status updates and sample risk notes for team ${i}.`,
          `Kept sample project documents organised, versioned, and easy to find for team ${i}.`,
          `Supported sample onboarding for new sample team members in team ${i}.`
        ]
      )
    );
  }
  return jobs;
}

export const longSample: CandidateProfile = {
  sampleMarker: "SAMPLE",
  fullName: "Sam Sample",
  headline: "Sample Project Coordinator",
  email: "sam.sample@example.test",
  phone: "+00 000 000 000",
  city: "Sample City",
  summary:
    "SAMPLE: Fictional long sample summary for pagination testing only. " +
    "Organised sample project coordinator with repeated sample experience " +
    "in planning, scheduling, reporting, and team support across several " +
    "sample teams. This summary is intentionally longer so the rendered " +
    "document needs more than one page at a readable size, and the test " +
    "can check that the second page is produced instead of text being " +
    "clipped, overlapped, or shrunk below a readable size.",
  experience: longJobs(),
  education: [
    {
      institution: "Sample College",
      qualification: "Sample Diploma in Project Support",
      period: "2018 to 2020"
    },
    {
      institution: "Sample Training Centre",
      qualification: "Sample Certificate in Team Coordination",
      period: "2020 to 2021"
    },
    {
      institution: "Sample Online School",
      qualification: "Sample Course in Written Communication",
      period: "2021 to 2022"
    }
  ],
  skills: [
    "Planning",
    "Scheduling",
    "Written updates",
    "Spreadsheets",
    "Meeting notes",
    "Risk notes",
    "Handover notes",
    "Team support",
    "Document organisation",
    "Time management"
  ],
  languages: ["English (Fluent, sample level)", "Sample Language (Basic, sample level)"]
};

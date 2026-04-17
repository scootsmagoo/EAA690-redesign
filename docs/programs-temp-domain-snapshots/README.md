# Temp domain snapshot — `/programs` (migration reference)

**Source site:** [https://eaa-960-redesign.vercel.app](https://eaa-960-redesign.vercel.app)  
**Captured:** 2026-04-16 (for rebuilding pages in Sanity before relying solely on CMS-driven routes)

This folder preserves what the **Vercel preview** showed for program pages **as static React pages in the repo**, so you can recreate structure, copy, and layout in **Sanity** after committing the CMS-based `/programs/[slug]` work.

## Contents

| Page | Live URL (temp) | Full-page screenshot | Saved HTML |
|------|-----------------|----------------------|------------|
| Programs index | [/programs](https://eaa-960-redesign.vercel.app/programs) | `screenshots/programs.png` | `html/programs.html` |
| Eagle Flights | [/programs/eagle-flights](https://eaa-960-redesign.vercel.app/programs/eagle-flights) | `screenshots/programs-eagle-flights.png` | `html/programs-eagle-flights.html` |
| Ground School | [/programs/ground-school](https://eaa-960-redesign.vercel.app/programs/ground-school) | `screenshots/programs-ground-school.png` | `html/programs-ground-school.html` |
| Outreach | [/programs/outreach](https://eaa-960-redesign.vercel.app/programs/outreach) | `screenshots/programs-outreach.png` | `html/programs-outreach.html` |
| Scholarships | [/programs/scholarships](https://eaa-960-redesign.vercel.app/programs/scholarships) | `screenshots/programs-scholarships.png` | `html/programs-scholarships.html` |
| Summer Camp | [/programs/summer-camp](https://eaa-960-redesign.vercel.app/programs/summer-camp) | `screenshots/programs-summer-camp.png` | `html/programs-summer-camp.html` |
| VMC/IMC Club | [/programs/vmc-imc-club](https://eaa-960-redesign.vercel.app/programs/vmc-imc-club) | `screenshots/programs-vmc-imc-club.png` | `html/programs-vmc-imc-club.html` |
| Youth Aviation | [/programs/youth-aviation](https://eaa-960-redesign.vercel.app/programs/youth-aviation) | `screenshots/programs-youth-aviation.png` | `html/programs-youth-aviation.html` |
| Young Eagles | [/programs/young-eagles](https://eaa-960-redesign.vercel.app/programs/young-eagles) | `screenshots/programs-young-eagles.png` | `html/programs-young-eagles.html` |

- **Screenshots:** full-page PNGs (Playwright), useful for visual parity while editing Studio.
- **HTML:** same URLs saved as static HTML. Open the files locally in a browser (`File → Open`) to scroll/search copy; assets may not load offline if the app used absolute URLs.

## Section outlines (headings) — quick Sanity mapping

Extracted from the saved HTML for structure only (not full body text).

### `/programs` (index)

- **H1:** Programs  
- **Card titles (H2):** Eagle Flights, Ground School, Outreach, Scholarships, Summer Camp, VMC/IMC Club, Youth Aviation Program, Young Eagles  

### Eagle Flights

- **H1:** Eagle Flights  
- **H2:** What is Eagle Flights? · A Chapter First · Ready to Fly?  

### Ground School

- **H1:** Ground School  
- **H2:** Currently on Hiatus · About Ground School · Interested in Updates?  

### Outreach

- **H1:** Outreach  
- **H2:** Heidi… the Helicopter Trainer · Schedule an Appearance  

### Scholarships

- **H1:** Scholarship Programs  
- **H2:** How to Apply · Ray Aviation Scholarship · Apply Online · Additional Scholarship Resources  

### Summer Camp

- **H1:** Aviation STEM Summer Camp  
- **H2:** 2026 Camp Update · 2026 Camp Details · A Six-Year Journey · Join the Waitlist · Stay Informed for 2027  

### VMC/IMC Club

- **H1:** VMC/IMC Club  
- **H2:** About the Club · Meeting Details · All Pilots Welcome · Get Notified About Upcoming Meetings  

### Youth Aviation Program

- **H1:** Youth Aviation Program  
- **H2:** Dream it · Build it · The Details · Program Documents · Express Interest / Apply  

### Young Eagles

- **H1:** Young Eagles  
- **H2:** Young Eagle Flights · Chapter Young Eagles Coordinator · Want to Volunteer?  

## Re-capturing later

If the temp domain updates and you want fresh files:

1. Install Playwright once (downloads Chromium):  
   `npx playwright@1.49.1 install chromium`
2. Example full-page shot:  
   `npx playwright@1.49.1 screenshot --full-page "https://eaa-960-redesign.vercel.app/programs/eagle-flights" "docs/programs-temp-domain-snapshots/screenshots/programs-eagle-flights.png"`

To refresh HTML with Python (if `curl` is unavailable), use a small script with `urllib` and an unverified SSL context only for this one-off archival use.

## Note on committing

These PNGs and HTML files are **intentional documentation artifacts** for migration. If the repo size becomes an issue later, you can move them to chapter Google Drive and replace this folder with a short link in this README.

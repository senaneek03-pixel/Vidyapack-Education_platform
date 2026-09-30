## VidyaPack

**Whole lessons that travel over SMS, WhatsApp, or QR — offline, at zero data cost.**

🔗 **Live demo:** https://vidyapack-education-platform.vercel.app/

> Built for Track 3 · Education for All (SDG 4) — rural, remote, and low-resource education.

---

## The Problem

Millions of students miss school regularly due to distance, lack of transport, illness, or family responsibilities — and most "digital learning" solutions assume a smartphone, a data plan, and a stable internet connection none of them reliably have. VidyaPack assumes the opposite: **zero internet, any phone, zero recurring cost.**

## How It Works

1. **Teacher creates a lesson** in the Teacher Studio — title, explainer text, key points, and a short quiz.
2. **VidyaPack compresses it into a tiny text code** (a few hundred bytes) instead of a multi-megabyte video or PDF.
3. **The code travels however is available** — SMS, WhatsApp text, or a scannable QR code — reaching any phone, smart or basic.
4. **The student opens the code offline**, reads the lesson, answers the quiz, and gets a short reply-code to send back showing their score.
5. **Doubts go straight to the teacher**, not a chatbot — a student picks or types a question and it opens a real WhatsApp/SMS message addressed to the teacher's number, sent over the actual network when they tap Send.

## Features

- **Teacher Studio** — build a lesson and quiz, generate a shareable text code, preview it as QR, or send it directly via WhatsApp/SMS
- **Student App** — open a lesson from a pasted code or QR scan, read offline, take the quiz, get an SMS-sized reply-code
- **Doubt routing to teacher** — no fake AI answers; doubts are sent as real messages to the teacher's own phone
- **Class Dashboard** — teachers paste in received reply-codes and doubt messages to see class-wide performance and who needs help
- **Multi-language interface**
- **Low-resource mode** — strips animations/heavy visuals for low-end devices
- **Data Cost Savings Meter** — shows exactly how much smaller a text-code lesson is versus a video lesson
- **Comfort controls** (`enhance.js`) - Auto/Light/Dark theme, adjustable text size, online/offline indicator, remembered Low-resource mode (auto-on with Data Saver / 2G), Alt+1/2/3 tab shortcuts, scroll progress and back-to-top
- **3D Virtual Science Lab widget** — interactive water cycle / circuit / pH demos, fully offline, no network calls

## Tech Stack

`index.html` plus a small drop-in `enhance.js` — vanilla HTML/CSS/JavaScript, no build step, no framework, no backend server. Lesson codes are encoded client-side; delivery uses native `wa.me` / `sms:` device links, so there are no API keys, no recurring costs, and nothing that requires the school or student to pay for data beyond what an SMS/WhatsApp message already costs.

## Running Locally

```bash
git clone <this-repo-url>
cd <repo-folder>
python -m http.server 8000
```
Then open `http://localhost:8000/index.html` in your browser.

## Deploying

This is a static site — no build command needed. Deployed on [Vercel](https://vercel.com) directly from this repo; any push to `main` redeploys automatically.

## Project Status

Actively developed for hackathon submission. Known next steps:
- Persist teacher/student data across sessions more robustly
- Expand the lesson and quiz content library
- Add more subjects to the virtual lab widget

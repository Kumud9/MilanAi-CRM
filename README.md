# TDC Matchmaker Dashboard

An internal matchmaking CRM and AI-powered compatibility workstation built for **The Date Crew**. The application helps matchmakers manage client profiles, run deterministic matching algorithms, analyze compatibility with an AI Advisor, parse structured call insights, and generate personalized introduction messages.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4) with custom animation extensions
- **State & Validation:** React Hook Form & Zod
- **Database:** Local JSON File (`/data/profiles.json`) & LocalStorage (for session logs, customer notes, match history, and favorites)
- **AI Integrations:** OpenAI API (GPT-4o-mini)
- **Mocking Data:** Faker.js (with custom Indian names, castes, cities, and colleges)
- **PDF Generation:** jsPDF

---

## Core Features

### 1. Dashboard Workstation (`/dashboard`)
- **Key Metrics:** Total Customers, Active Customers, Matches Sent, Meetings Scheduled.
- **Dynamic Search:** Match by Name, Religion, or City.
- **Advanced Filtering:** Segment clients by Gender, Religion, City, Marital Status, and Journey Status.
- **Paginated Table Directory:** Displays client info, journey badges, and live high-potential match counts.

### 2. CRM Profile Center (`/customer/[id]`)
- **Profile completion percentage:** Dynamic calculation showing completeness of demographic, lifestyle, and preference records.
- **Categorized Tabs:** Personal & Family Details, Education & Career, Lifestyle & Preferences, CRM Call Notes, and Match History logs.
- **Confidential PDF Report:** Generates and downloads a clean, print-friendly profile report using `jspdf`.
- **Favorites & Recents Tracker:** Quick bookmarking of client profiles and a tracking stack of recently visited clients.

### 3. Algorithmic Matching Engine (`/lib/matcher.ts`)
Calculates a matching compatibility score out of 100 based on opposite-gender traits and returns the **Top 10** recommendations.
- **Male Target (seeking Female):** Prioritizes younger age, shorter height, matching religion (15%), same city (15%), child preferences (25%), income levels (10%), education preferences (10%), and lifestyle habits (10%).
- **Female Target (seeking Male):** Prioritizes similar career domain/profession (20%), education level (15%), relocation willingness (15%), lifestyle compatibility (15%), child preferences (25%), and matching/higher income (10%).

### 4. Advanced AI Workflow Integrations (`/lib/openai.ts`)
- **AI Compatibility Advisor (`/api/compatibility`):** Generates refined compatibility scores, 3 key strengths, 1-2 potential concerns, and a concise 3-sentence summary explanation.
- **AI Notes Intelligence (`/api/notes-intelligence`):** Parses raw matchmaker call notes (e.g., *"prefers family oriented tech professional who does not smoke"*) into structured CRM tags (Diet, Relocation, Smoking, Industry, Values).
- **AI Introduction Generator (`/api/intro-message`):** Writes custom introduction letters to email or copy-paste directly to the client. Includes a modal with Copy, Regenerate, and Send controls.

---

## Local Setup

### 1. Prerequisites
Ensure you have **Node.js** (v18.x or later) and **npm** installed.

### 2. Clone and Install Dependencies
Navigate to the directory and run:
```bash
npm install
```

### 3. Configure Environment Variables
Create a file named `.env.local` in the project root and add your OpenAI API Key:
```env
OPENAI_API_KEY=your-actual-openai-api-key
```

*Note: If the OpenAI key is missing, the application runs on intelligent fallbacks, allowing you to preview notes extraction, compatibility evaluations, and intro generation without error.*

### 4. Generate Mock Data (Optional)
The seed database contains 200 Indian profiles (100 Male, 100 Female) in `/data/profiles.json`. If you wish to regenerate the database, run:
```bash
node scripts/seed-profiles.js
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3050](http://localhost:3000) (or the port specified by the dev server) in your browser.

---

## Authentication Credentials

To access the matchmaker dashboard workspace, use:
- **Username:** `matchmaker`
- **Password:** `tdc123`

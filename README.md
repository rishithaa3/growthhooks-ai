# GrowthHooks AI

A full-stack AI web application to generate viral LinkedIn hooks using external trend data (Google SERP snippets) and internal brand context (Pixii), powered by Gemini AI.

## Architecture

*   **Frontend:** React + Vite + Tailwind CSS
*   **Backend:** Node.js + Express
*   **AI:** `llama-3.3-70b-versatile` (Groq)
*   **Email:** Nodemailer (Gmail SMTP)

## Setup Instructions

### 1. Backend Setup

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Open `server/.env` and configure your variables:
   
   EMAIL_USER=
   EMAIL_PASS=
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   GROQ_API_KEY=
   APIFY_API_TOKEN=
   APIFY_ACTOR_ID=

USE_FIXTURES=true
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Open a **new** terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open the frontend in your browser (usually `http://localhost:5173`).
2. **Pixii Engine (Main):** Uses hardcoded Pixii context. You can optionally provide an instruction.
3. Configure the goal, time range and tone.
4. Click **Generate Hooks**. The backend will scrape Google for recent trends and use Gemini to generate highly tailored hooks.
5. (Optional) Enter an email address at the bottom to send the results to your inbox.

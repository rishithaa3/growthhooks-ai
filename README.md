# GrowthHooks AI

A full-stack AI web application to generate viral LinkedIn hooks using external trend data (Google SERP snippets) and internal brand context (Pixii), powered by Gemini AI.

## Architecture

*   **Frontend:** React + Vite + Tailwind CSS
*   **Backend:** Node.js + Express
*   **AI:** `@google/genai` (Gemini 2.5 Flash)
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
3. Open `server/.env` and configure your API keys:
   *   `GEMINI_API_KEY`: Your Google AI Studio API key.
   *   `EMAIL_USER`: Your Gmail address.
   *   `EMAIL_PASS`: Your Gmail **App Password** (not your regular password).
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
2. The UI is split into two modes:
    *   **Pixii Engine (Main):** Uses hardcoded Pixii context. You can optionally provide a topic focus.
    *   **Business Hooks:** General hook generation based on a specific niche.
3. Configure the goal and tone.
4. Click **Generate Hooks**. The backend will scrape Google for recent trends and use Gemini to generate highly tailored hooks.
5. (Optional) Enter an email address at the bottom to send the results to your inbox.

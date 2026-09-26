# AutoQA.ai — AI-Powered QA Testing Automation Agent

An enterprise-grade, end-to-end automated QA testing agent built with **Next.js 14 (App Router)**, **React**, **Google Gemini AI**, **GitHub API**, and **Browserbase Cloud Browser Sandbox**.

---

## 🌟 Solution Overview & Problem Addressed

| Core QA Challenge | AutoQA.ai Solution |
| :--- | :--- |
| **Manual & Time-Consuming QA Workflows** | Auto-generates comprehensive, structured test suites across **UI, API, Auth, and Integration** pathways directly from detected routes & components. |
| **Flaky & Unassisted Local Testing** | Generates executable Playwright test scripts and runs them in isolated, recorded cloud browser sandboxes via **Browserbase**. |
| **High AI Token Costs** | **Token-Optimized Tree Inspector**: Smartly prunes node_modules, locks, and media assets, isolating only functional routing & auth middleware. Achieves **>98% context token savings** over whole-repo scanning. |
| **Static Analysis Limitations** | Real cloud browser execution verifies live DOM clicks, forms, network waterfalls, authentication redirects, and session replays. |

---

## 🚀 Key Features

1. **GitHub Repository Inspection & Route Discovery**:
   - Authenticate with GitHub (or inspect any public repository URL / `owner/repo`).
   - Context-preserving file tree pruning: excludes non-functional assets, locks, and compiled code.
   - Automatic route extraction: Next.js App Router (`app/**/page.tsx`, `app/**/route.ts`), Pages Router (`pages/**`), Express routes, and auth middleware.
   - Built-in curated repository presets (SaaS Billing Portal, E-Commerce Storefront, Healthcare Patient Portal).

2. **Smart Test Case Generation (Google Gemini AI)**:
   - Powered by `@google/generative-ai` (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`).
   - Structured JSON test matrix covering:
     - **UI Flows**: Component landmarks, responsive layout, CTA buttons, input forms.
     - **API Pathways**: Route endpoints, status codes, payload validations, error contracts.
     - **Auth Pathways**: Login credentials, session cookie persistence, protected route redirects.
     - **Integration Pathways**: Multi-step user journeys and state transitions.
   - Real Playwright TypeScript scripts ready for Browserbase cloud execution.

3. **Cloud Browser Execution (Browserbase + Playwright)**:
   - Dynamic session provisioning with Browserbase REST API & WebSocket connect URL.
   - Real-time streaming logs (stdout/stderr), step timers, and network telemetry waterfall.
   - High-fidelity Cloud Browser Emulator for seamless offline demonstration and testing.

4. **Visual Debugger, Session Replays & Gemini AI Auto-Remediation**:
   - Interactive Video Replay Studio with scrubber and timeline step markers.
   - Total pass-rate analytics gauge and category health breakdown.
   - **Gemini AI Root-Cause Diagnostic**: When a test fails, 1-click AI diagnosis reveals the root cause, suggested remediation, and an instant code patch!
   - Export full QA reports as formatted JSON.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14 App Router](https://nextjs.org/)
- **UI & Styling**: [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **AI Intelligence**: [Google Gemini AI](https://ai.google.dev/) (`@google/generative-ai`)
- **Cloud Browser Automation**: [Browserbase](https://www.browserbase.com/) (`@browserbasehq/sdk` & Playwright)
- **Repository Metadata**: GitHub REST & Git Trees API

---

## 🏃 Getting Started

### 1. Installation
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment (Optional)
Create a `.env.local` file or configure via the in-app **Settings** modal:
\`\`\`env
# Google Gemini AI Key
GEMINI_API_KEY=your_gemini_api_key_here

# Browserbase Cloud Browser Credentials
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here

# GitHub Token (Optional, for higher rate limits or private repos)
GITHUB_TOKEN=your_github_token_here
\`\`\`

### 3. Run Development / Production Server
\`\`\`bash
# Start Next.js server on port 3000
npm start
# Or for dev mode:
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Architecture

\`\`\`
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── browserbase/
│   │   │   │   ├── create-session/route.ts  # Browserbase cloud session creation
│   │   │   │   └── execute/route.ts         # Cloud browser test runner & telemetry
│   │   │   ├── gemini/
│   │   │   │   ├── diagnose/route.ts        # AI failure root-cause analysis
│   │   │   │   └── generate-tests/route.ts  # Gemini structured test case generator
│   │   │   └── github/
│   │   │       └── inspect/route.ts         # Tree parsing, token pruning & route finder
│   │   ├── globals.css                      # Tailwind styling & dark theme tokens
│   │   ├── layout.tsx                       # Root HTML & body layout
│   │   └── page.tsx                         # Main multi-stage workflow coordinator
│   ├── components/
│   │   ├── Navbar.tsx                       # Header brand, stepper tabs & status pills
│   │   ├── ConfigModal.tsx                  # Settings drawer for API keys & model
│   │   ├── RepoInspector.tsx                # Phase 1: Repo tree, token gauge, routes
│   │   ├── TestMatrix.tsx                   # Phase 2: Category matrix, Playwright viewer
│   │   ├── CloudRunner.tsx                  # Phase 3: Cloud browser runner & live terminal
│   │   └── QAReportView.tsx                 # Phase 4: Video replay, analytics & AI fix
│   ├── lib/
│   │   ├── browserbase.ts                   # Browserbase cloud client & runner
│   │   ├── gemini.ts                        # Gemini AI synthesis & diagnostic prompts
│   │   ├── github.ts                        # GitHub API tree inspector & token counter
│   │   └── presets.ts                       # Production repository archetypes
│   └── types/
│       └── index.ts                         # Complete TypeScript domain interfaces
├── tailwind.config.js
├── tsconfig.json
└── package.json
\`\`\`

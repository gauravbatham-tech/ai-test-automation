# AutoQA.ai — Universal AI-Powered QA Testing Automation Agent

An enterprise-grade, end-to-end automated QA testing agent built with **Next.js 14 (App Router)**, **React**, **Google Gemini AI**, **Browserbase Cloud Browser Sandbox**, and **Universal Multi-Source Intake**.

Generate comprehensive automated test suites for **live deployed applications**, **offline ZIP project archives**, **local filesystem folders**, or **GitHub repositories**.

---

## 🌟 Solution Overview & Problem Addressed

| Core QA Challenge | AutoQA.ai Solution |
| :--- | :--- |
| **No GitHub Repo / Offline Codebase** | **Universal Intake Hub**: Test **live deployed websites** (Vercel, AWS, custom host, localhost), upload **ZIP archives**, or scan **local folders** directly from disk with zero GitHub dependency. |
| **Manual & Time-Consuming QA Workflows** | Auto-generates comprehensive, structured test suites across **UI, API, Auth, and Integration** pathways directly from detected routes & components. |
| **Flaky & Unassisted Local Testing** | Generates executable Playwright test scripts and runs them in isolated, recorded cloud browser sandboxes via **Browserbase**. |
| **High AI Token Costs** | **Token-Optimized Tree Inspector**: Smartly prunes node_modules, locks, and media assets, isolating only functional routing & auth middleware. Achieves **>98% context token savings** over whole-repo scanning. |
| **Static Analysis Limitations** | Real cloud browser execution verifies live DOM clicks, forms, network waterfalls, authentication redirects, and session replays. |

---

## 🚀 Key Features

### 1. Universal Project Intake & Surface Discovery:
- **🌐 Live Deployed Web Applications**:
  - Point to any public staging or production URL (e.g., `https://demo.vercel.store`, `https://my-app.vercel.app`, or `http://localhost:3000`).
  - Automatic web crawling discovers pages, navigation landmarks, and interactive `<form>` elements (inputs, passwords, buttons, and API paths).
  - Automatically targets Playwright scripts directly to the live domain.
- **📦 ZIP Project Archives**:
  - Drag and drop any exported `.zip` project file.
  - Built-in zero-dependency decompressor parses the directory tree, extracts routes (`app/**/page.tsx`, `pages/**`, Express routes), and reads critical route snippets.
- **📁 Local Project Folders**:
  - Select any local codebase folder directly from disk using HTML5 directory picker.
  - 100% private, client-side AST inspection that filters out `node_modules` locally in milliseconds with zero file uploads.
- **🐙 GitHub Repositories**:
  - Connect with GitHub or inspect any public repository URL / `owner/repo`.
  - Recursive tree pruning and route extraction with high rate limits.
- **⚡ Curated Multi-Source Presets**:
  - Live E-Commerce Storefront (`demo.vercel.store`), ZIP Customer Portal, Clerk Auth SaaS, and Full-Stack Platform presets.

### 2. Smart Test Case Generation (Google Gemini AI):
- Powered by `@google/generative-ai` (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`).
- Structured JSON test matrix covering:
  - **UI Flows**: Component landmarks, responsive layout, CTA buttons, input forms.
  - **API Pathways**: Route endpoints, status codes, payload validations, error contracts.
  - **Auth Pathways**: Login credentials, session cookie persistence, protected route redirects.
  - **Integration Pathways**: Multi-step user journeys and state transitions.
- Real Playwright TypeScript scripts ready for Browserbase cloud execution.

### 3. Cloud Browser Execution (Browserbase + Playwright):
- Dynamic session provisioning with Browserbase REST API & WebSocket connect URL.
- Real-time streaming logs (stdout/stderr), step timers, and network telemetry waterfall.
- High-fidelity Cloud Browser Emulator for seamless offline demonstration and testing.

### 4. Visual Debugger, Session Replays & Gemini AI Auto-Remediation:
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
- **Archive & Crawl Engine**: Node.js Zlib & HTML5 Web Directory API
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

### 3. Run Development Server
\`\`\`bash
npm run dev
# Or start production server:
npm start
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
│   │   │   ├── github/
│   │   │   │   └── inspect/route.ts         # Backward-compatible inspect endpoint
│   │   │   └── inspect/
│   │   │       └── route.ts                 # Unified multi-source inspect endpoint (Live URL, ZIP, GitHub)
│   │   ├── globals.css                      # Tailwind styling & dark theme tokens
│   │   ├── layout.tsx                       # Root HTML & body layout
│   │   └── page.tsx                         # Main multi-stage workflow coordinator
│   ├── components/
│   │   ├── Navbar.tsx                       # Header brand, source badge & stepper tabs
│   │   ├── ConfigModal.tsx                  # Settings drawer for API keys & model
│   │   ├── RepoInspector.tsx                # Universal Multi-Source Project Hub (Live URL, ZIP, Folder, GitHub)
│   │   ├── TestMatrix.tsx                   # Phase 2: Category matrix, Playwright viewer
│   │   ├── CloudRunner.tsx                  # Phase 3: Cloud browser runner & live terminal
│   │   └── QAReportView.tsx                 # Phase 4: Video replay, analytics & AI fix
│   ├── lib/
│   │   ├── browserbase.ts                   # Browserbase cloud client & runner
│   │   ├── client-folder-inspector.ts       # Zero-upload client-side folder scanner
│   │   ├── crawler.ts                       # Live deployed web crawler & DOM landmark extractor
│   │   ├── gemini.ts                        # Gemini AI synthesis & multi-source prompt engine
│   │   ├── github.ts                        # GitHub API tree inspector
│   │   ├── presets.ts                       # Production presets (Live, ZIP, and GitHub)
│   │   ├── source-utils.ts                  # Shared route extraction, file classification & auth detection
│   │   └── zip-inspector.ts                 # Pure TypeScript ZIP archive parser & AST extractor
│   └── types/
│       └── index.ts                         # Complete TypeScript domain interfaces
├── tailwind.config.js
├── tsconfig.json
└── package.json
\`\`\`

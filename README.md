# Agent Budget Controller – AI Cost Governance Platform

![Enterprise Governance](https://img.shields.io/badge/Platform-Enterprise%20AI%20Governance-2563EB)
![Backend](https://img.shields.io/badge/Backend-Python%20Flask-000000)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-3B82F6)
![Database](https://img.shields.io/badge/Database-SQLAlchemy%20%2F%20SQLite%20%2F%20MySQL-10B981)

**Agent Budget Controller** is a production-quality, centralized AI Budget Governance Platform designed to continuously track AI request spending, monitor LLM token consumption (OpenAI, Anthropic, Google, DeepSeek), manage multi-tier organization/team/agent/session budgets, automatically enforce governance policies, reject requests exceeding limits, recommend model fallbacks, and generate real-time predictive analytics and reports.

---

## 🚀 Key Features & Architectural Modules

### 1. ⚡ Core Budget Engine
Every API request executes the multi-tiered cascading budget deduction algorithm:
$$\text{Used Budget} = \text{Used Budget} + \text{Current API Cost}$$
$$\text{Remaining Budget} = \text{Total Budget} - \text{Used Budget}$$
$$\text{Budget Percentage} = \frac{\text{Used Budget}}{\text{Total Budget}} \times 100$$
- Cascades balance updates down the hierarchy: **Session $\rightarrow$ AI Agent $\rightarrow$ Team $\rightarrow$ Organization**.
- Supports per-token pricing for models: `gpt-4`, `gpt-4o`, `gpt-4o-mini`, `claude-3-5-sonnet`, `claude-3-opus`, `gemini-1.5-pro`, `gemini-1.5-flash`, `deepseek-r1`.

### 2. 🛡️ Automatic Policy Engine
- **$\ge$ 80% Usage**: Triggers soft budget warning alert + model fallback suggestion.
- **$\ge$ 90% Usage**: Generates high-severity critical alert + notifies administrator.
- **$\ge$ 100% Usage**: **Rejects API request**, terminates active running session, auto-blocks agent.

### 3. 🧠 AI Predictive Analytics & Anomaly Detection
- **30-Day Spending Forecast**: Calculates daily burn rate ($\$/day$) and estimates days until budget pool exhaustion.
- **Statistical Anomaly Detector**: Identifies abnormal token payloads ($Z\text{-score} > 2.0$).
- **Model Optimization Engine**: Recommends switching expensive Preferred Models (e.g. GPT-4) to Fallback Models (e.g. GPT-4o-mini) to save up to 85% on token costs.

### 4. 📊 Enterprise Telemetry Dashboard & Interactive Simulator
- **Live KPI Metrics**: Total Org Budget, Used Budget, Remaining Budget, Today's Spending, Active Sessions, Running Agents, Blocked Requests, Total Tokens.
- **Recharts Visualizations**: Daily Spending Trend, Team Budget Comparison, Top Spending Agents, Model Usage Pie Chart.
- **Live API Request Simulator Modal**: Allows testing real-time budget deduction, policy enforcement, and alerts live in the UI!

### 5. 📑 Executive Reports & Export Engine
- PDF Report Exporter formatted with custom title headers and data tables (`jsPDF` + `jspdf-autotable`).
- CSV & Excel Dataset Exporter (`PapaParse`).

---

## 📁 Repository Folder Structure

```
c:\Users\GUHAN\Desktop\AI budget controller\
├── backend/
│   ├── app.py                      # Flask Application Entrypoint & Blueprints
│   ├── config.py                   # Configuration & LLM Rate Pricing Matrix
│   ├── models.py                   # SQLAlchemy Models (Users, Orgs, Teams, Agents, Sessions, Logs, Alerts)
│   ├── auth.py                     # JWT Auth & Role-Based Access Control (Admin, Manager, Viewer)
│   ├── requirements.txt            # Python Dependencies
│   ├── services/
│   │   ├── budget_engine.py        # Cascading Budget Deduction Algorithm
│   │   ├── policy_engine.py        # Threshold Rules Evaluation
│   │   ├── ai_analytics.py         # Forecasting & Z-Score Anomaly Detection
│   │   └── seed_data.py            # Pre-seeding Script (10 Orgs, 20 Teams, 50 Agents, 500 Logs, 100 Alerts)
│   └── routes/                     # REST API Endpoint Controllers
│       ├── auth_routes.py
│       ├── dashboard_routes.py
│       ├── organization_routes.py
│       ├── team_routes.py
│       ├── agent_routes.py
│       ├── session_routes.py
│       ├── usage_routes.py
│       ├── alert_routes.py
│       ├── analytics_routes.py
│       ├── report_routes.py
│       └── settings_routes.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/            # Sidebar, Header, NotificationCenter
│   │   │   ├── Simulators/        # LiveSimulatorModal
│   │   │   └── UI/                # StatCard, ProgressBar
│   │   ├── context/               # AuthContext & AppContext
│   │   ├── pages/                 # Login, Dashboard, Organizations, Teams, Agents, Sessions, Usage, Analytics, Alerts, Reports, Settings, Profile
│   │   ├── services/              # Axios API Client with JWT Interceptors
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css              # Dark Theme Design System & Glassmorphic Utilities
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── README.md
```

---

## 🔑 Quick Demo Login Credentials

The database comes pre-populated with realistic enterprise dummy data and 3 user roles:

| Role | Username | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full access (Create/Edit/Delete Orgs, Teams, Agents, Settings, Resolve Alerts) |
| **Manager** | `manager` | `manager123` | Management access (Edit Teams/Agents, Switch Fallback Models, Terminate Sessions) |
| **Viewer** | `viewer` | `viewer123` | Read-only access to dashboards, logs, analytics, and reports |

---

## 🛠️ Local Installation & Setup Guide

### Option 1: Run Locally (Development Mode)

#### 1. Backend Setup (Flask Python)
```bash
# Navigate to backend folder
cd backend

# Install dependencies
pip install -r requirements.txt

# Run Flask server (Auto-creates tables and seeds dataset on first boot)
python app.py
```
*Backend API will run at:* `http://localhost:5000`

#### 2. Frontend Setup (React + Vite)
```bash
# Open a new terminal in frontend folder
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend application will run at:* `http://localhost:3000`

---

### Option 2: Run with Docker Compose

```bash
# Build and launch all services in containers
docker-compose up --build
```
- Frontend will be accessible at: `http://localhost`
- Backend REST API will be accessible at: `http://localhost:5000`

---

## 📡 REST API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `GET` | `/api/dashboard/summary` | Retrieve KPI card metrics |
| `GET` | `/api/dashboard/charts` | Retrieve 14-day spending trend, team breakdown, model pie chart |
| `GET` / `POST` | `/api/organizations` | List or create organizations |
| `GET` / `POST` | `/api/teams` | List or create teams |
| `GET` / `POST` | `/api/agents` | List or create AI agents |
| `POST` | `/api/agents/<id>/switch-model` | Switch agent to fallback model |
| `GET` / `POST` | `/api/sessions` | List active sessions or create new session |
| `POST` | `/api/sessions/<id>/terminate` | Force terminate running session |
| `GET` | `/api/usage` | Search & filter API request audit logs |
| `POST` | `/api/usage/simulate` | **Live API Simulation** trigger for budget engine & policy checks |
| `GET` | `/api/analytics/forecast` | Retrieve 30-day budget prediction & burn rate |
| `GET` | `/api/analytics/anomalies` | Retrieve statistical token payload spikes |
| `GET` / `POST` | `/api/alerts` | List alerts or resolve alerts |
| `GET` / `POST` | `/api/reports/generate` | Generate executive budget reports |
| `GET` / `PUT` | `/api/settings` | Retrieve or modify policy thresholds and rate matrices |

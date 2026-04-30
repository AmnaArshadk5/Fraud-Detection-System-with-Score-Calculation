# Fraud Detection System (MERN) — Full Stack FinTech Application

A full-stack MERN app that lets users:
- Sign up / log in (JWT auth)
- Add transactions
- Analyze transactions with a multi-rule fraud risk scoring algorithm (0–100)
- View fraud alerts, reasons, and update alert status

---

## Table of Contents
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Quick Start (Local)](#quick-start-local)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Design](#database-design)
- [Core FinTech Logic](#core-fintech-logic)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack
- Frontend: React (Create React App), React Router, Axios
- Backend: Node.js, Express, JWT
- Database: MongoDB, Mongoose

---

## Features
### Authentication
- Login + Signup pages
- Protected route for dashboard (unauthenticated users cannot access it)
- Token persistence across refresh (stored in `localStorage`)

### Backend (REST APIs + Middleware)
- REST API architecture with routes for auth, transactions, and fraud
- Middleware:
  - JWT auth check (`backend/middleware/auth.js`)
  - Input validation (`backend/middleware/validation.js`)

### Database + Queries
- Collections:
  - `User`
  - `Transaction`
  - `FraudAlert`
  - `RiskProfile`
- Meaningful queries (aggregations):
  - `GET /api/transactions/high-risk` — groups flagged transactions by category (count/total/avg)
  - `GET /api/transactions/trends` — daily transaction totals for the last 30 days

### UI / UX
- Dynamic data fetched from backend (no hardcoded dashboard data)
- Interactive features:
  - Add transaction form feedback
  - Analyze button shows loading + success/error toast
  - Transactions search/sort + “flagged only” filter
  - Alert status update dropdown
- Responsive layout (mobile + desktop)

---

## Quick Start (Local)
### Prerequisites
- Node.js (14+ recommended)
- MongoDB (local or Atlas)
- npm

### 1) Backend
```bash
cd backend
npm install
```

Create `.env` from the template and update values:
```bash
copy .env.example .env
```

Run the server:
```bash
npm run dev
```
Backend runs on `http://localhost:5000` (default).

### 2) Frontend
```bash
cd frontend
npm install
```

Create `.env` from the template:
```bash
copy .env.example .env
```

Run the app:
```bash
npm start
```
Frontend runs on `http://localhost:3000` (default).

---

## Environment Variables
### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb://localhost:27017/fraud-detection
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## API Endpoints
Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/signup`
- `POST /auth/login`

### Transactions
- `POST /transactions` — create a transaction
- `GET /transactions` — list user transactions
- `GET /transactions/high-risk` — aggregation query
- `GET /transactions/trends` — aggregation query

### Fraud
- `POST /fraud/analyze` — analyze a transaction and create a fraud alert
- `GET /fraud/alerts` — list alerts
- `PUT /fraud/alerts/:alertId` — update alert status
- `GET /fraud/risk-profile` — get user risk profile

---

## Database Design
Relationships (referencing):
- `Transaction.userId` → `User`
- `FraudAlert.userId` → `User`
- `FraudAlert.transaction` → `Transaction`
- `Transaction.fraudAlert` → `FraudAlert`
- `RiskProfile.userId` → `User`
- `User.riskProfile` → `RiskProfile`

Why referencing (instead of embedding):
- Transactions and fraud alerts can grow very large; embedding them inside `User` would bloat user documents.
- Referencing enables efficient filtering and aggregation queries on `transactions` and `fraudalerts`.
- Alerts/transactions can be updated independently (e.g., alert status changes) without rewriting a large embedded document.

---

## Core FinTech Logic
Risk score calculation is implemented in `backend/routes/fraud.js`:
- `calculateRiskScore(...)` computes a capped 0–100 score and `reasons[]` using rules:
  - Amount anomaly (vs user average)
  - Category anomaly (rare/new category)
  - Velocity (multiple transactions in last hour)
  - Location risk (if configured)
  - Fraud history rate

The endpoint `POST /api/fraud/analyze`:
1) Validates JWT and inputs
2) Loads the transaction + user history
3) Calculates the score/severity
4) Saves a `FraudAlert`
5) Updates `Transaction.isFlagged` and the user `RiskProfile`

---

## Project Structure
### Backend (`/backend`)
- `routes/` — `auth.js`, `transactions.js`, `fraud.js`
- `models/` — `User.js`, `Transaction.js`, `FraudAlert.js`, `RiskProfile.js`
- `middleware/` — `auth.js`, `validation.js`
- `server.js`

### Frontend (`/frontend`)
- `src/pages/` — `Login.js`, `Signup.js`, `Dashboard.js`
- `src/components/` — `ProtectedRoute.js`
- `src/api.js`

---

## Troubleshooting
### Frontend: “Module not found … node_modules …”
Reinstall dependencies:
```bash
cd frontend
npm install
npm start
```

### Frontend: “Something is already running on port 3000”
Either stop the other process, or run on a different port:
```powershell
$env:PORT=3002; npm start
```

### Backend exits on startup
Backend requires `MONGODB_URI` and `JWT_SECRET`.
- Copy `backend/.env.example` → `backend/.env`
- Set values, then:
```bash
cd backend
npm install
npm run dev
```

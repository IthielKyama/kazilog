# KaziLog

KaziLog is a GPS-enabled digital logbook system for industrial attachment management in Kenyan universities and TVET institutions. It replaces paper logbooks with a live platform for student daily submissions, supervisor review, and assessor grading.

## Monorepo Structure

- `backend/`: Express + MongoDB API for authentication, role-based access, geofencing, logbook workflows, and assessment.
- `mobile-app/`: Expo React Native student app for GPS-backed daily logging, offline queueing, and submission history.
- `web-dashboard/`: React + Vite dashboard for admins, supervisors, and assessors.

## Current Status

The codebase is already beyond prototype level in a few important areas:

- Student login, forced password change, active-session fetch, daily log submission, GPS verification, and offline queue sync are implemented.
- Supervisor review and assessor grading flows are implemented against live backend endpoints.
- Core backend API routes, models, middleware, geofence logic, and automated backend tests are in place.

The project is still incomplete in a few areas:

- The admin dashboard is only partially wired. User registration is live, but company registration is still mocked in the UI and session creation has no finished form yet.
- Some frontend/backend URLs are still hardcoded for local development.
- Email delivery currently uses Ethereal test inboxes rather than a production mail provider.

For a full assessment and phased roadmap, see [CODEBASE_ASSESSMENT.md](./CODEBASE_ASSESSMENT.md).

## Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended
- MongoDB locally or MongoDB Atlas
- Expo Go or an Android/iOS emulator for the mobile app

## Setup

There is no root workspace script yet, so install and run each app separately.

### 1. Clone and install dependencies

```powershell
git clone <your-repo-url>
cd KaziLog

cd backend
npm install
cd ..\web-dashboard
npm install
cd ..\mobile-app
npm install
cd ..
```

### 2. Configure the backend

Create `backend/.env` with:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/kazilog
JWT_SECRET=replace-this-with-a-long-random-secret
ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@kazilog.com
ADMIN_PASSWORD=Admin@12345
```

Start the API:

```powershell
cd backend
npm run dev
```

Bootstrap the first admin account in a fresh database:

```powershell
cd backend
npm run create-admin
```

That script now creates or updates the admin directly in MongoDB using the values in `backend/.env`.

### 3. Start the web dashboard

```powershell
cd web-dashboard
npm run dev
```

Open `http://localhost:5173`.

Notes:

- The dashboard currently assumes the backend is running at `http://localhost:5000`.
- Login, password reset, forced password change, supervisor review, assessor grading, and admin user registration are connected.
- Company creation and session creation still need more UI work, so some admin setup is better done through the API for now.

### 4. Start the mobile app

The mobile app reads `EXPO_PUBLIC_API_BASE_URL` if provided. If not provided, it falls back to:

- Android emulator: `http://10.0.2.2:5000/api`
- Other platforms: `http://localhost:5000/api`

For a physical device on the same network, set your machine IP explicitly:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://YOUR_LOCAL_IP:5000/api"
cd mobile-app
npm start
```

You can also use:

```powershell
npm run android
npm run ios
npm run web
```

## Suggested Local Demo Flow

1. Start MongoDB and the backend.
2. Run `npm run create-admin` inside `backend`.
3. Start `web-dashboard` and sign in as the admin.
4. Register supervisor, assessor, and student accounts from the admin dashboard.
5. Create companies and attachment sessions through the backend API until the admin UI is completed.
6. Sign into the mobile app as the student and submit logs from within the configured geofence.
7. Sign into the dashboard as the supervisor to approve or reject logs.
8. Sign into the dashboard as the assessor to view assigned students and award final grades.

## Backend API Areas

- `/api/auth`: login, registration, profile, change password, forgot password, reset password
- `/api/logs`: active session lookup, student submissions, student history, supervisor review
- `/api/admin`: companies, users, attachment sessions
- `/api/assessor`: assigned sessions and final grading

## Testing and Verification

Backend tests:

```powershell
cd backend
npm test
```

Mobile type checking:

```powershell
cd mobile-app
npm run typecheck
```

Dashboard production build:

```powershell
cd web-dashboard
npm run build
```

## Known Gaps

- No completed admin workflow for company and session setup in the dashboard UI yet
- No frontend automated tests yet
- No background worker or retry strategy beyond device-triggered offline sync
- No production mail service integration yet
- No deployment, HTTPS, audit logging, or observability setup yet

## Research Alignment

This repository maps directly to the project goal of digitizing industrial attachment evaluation through:

- secure multi-role access
- GPS-backed attendance validation
- digital daily log submission
- supervisor review
- assessor grading
- reduced dependence on physical paper logbooks

The detailed traceability between the study requirements and the current implementation is documented in [CODEBASE_ASSESSMENT.md](./CODEBASE_ASSESSMENT.md).

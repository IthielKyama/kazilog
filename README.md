# KaziLog

KaziLog is a GPS-enabled digital logbook system for industrial attachment management in Kenyan universities and TVET institutions. This repository contains the backend API, the web dashboard, and the Expo mobile app used for local development and QA.

## Apps

- `backend/`: Express + MongoDB API
- `web-dashboard/`: React + Vite dashboard for admins, supervisors, and assessors
- `mobile-app/`: Expo React Native app for students

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB running locally or via MongoDB Atlas
- Expo Go or an Android emulator for mobile testing

## Quick Start

### 1. Clone the repo

```powershell
git clone <this-repo-url>
cd kazilog
```

### 2. Copy the env templates

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item web-dashboard/.env.example web-dashboard/.env
Copy-Item mobile-app/.env.example mobile-app/.env
```

### 3. Install dependencies for every app

```powershell
npm run setup
```

### 4. Start the backend and dashboard

```powershell
npm run dev
```

This starts:

- the backend on `http://localhost:5000`
- the dashboard on `http://localhost:5173`

### 5. Start the mobile app

Open a second terminal and run:

```powershell
npm run dev:mobile
```

The default mobile env is optimized for the Android emulator and points to `http://10.0.2.2:5000/api`.

### 6. Bootstrap the first admin account

Open a third terminal and run:

```powershell
npm run bootstrap:admin
```

This reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `backend/.env` and creates or updates the admin account directly in MongoDB.

## Standard Scripts

### Root

- `npm run setup`: install dependencies for all apps
- `npm run dev`: start backend and dashboard together
- `npm run dev:mobile`: start the Expo mobile app
- `npm run bootstrap:admin`: create or update the initial admin user
- `npm run seed:demo`: seed one full end-to-end demo scenario
- `npm run check`: run backend tests, dashboard tests and build, and mobile typecheck

### Backend

- `npm --prefix backend run setup`
- `npm --prefix backend run dev`
- `npm --prefix backend run bootstrap:admin`
- `npm --prefix backend run create-admin`
- `npm --prefix backend run seed:demo`
- `npm --prefix backend test`

### Web Dashboard

- `npm --prefix web-dashboard run setup`
- `npm --prefix web-dashboard run dev`
- `npm --prefix web-dashboard run test`
- `npm --prefix web-dashboard run build`
- `npm --prefix web-dashboard run lint`

### Mobile App

- `npm --prefix mobile-app run setup`
- `npm --prefix mobile-app run dev`
- `npm --prefix mobile-app run dev:android`
- `npm --prefix mobile-app run dev:ios`
- `npm --prefix mobile-app run dev:web`
- `npm --prefix mobile-app run typecheck`

## Environment Files

### Backend

`backend/.env.example` includes:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/kazilog
JWT_SECRET=replace-this-with-a-long-random-secret
ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@kazilog.com
ADMIN_PASSWORD=Admin@12345
WEB_DASHBOARD_URL=http://localhost:5173
MOBILE_APP_RESET_URL=http://localhost:8081/reset-password
```

`WEB_DASHBOARD_URL` is used for assessor, supervisor, and admin password reset links.
`MOBILE_APP_RESET_URL` is used for student password reset links in local development. With the default value above, reset emails point to `http://localhost:8081/reset-password/<token>`.

### Web Dashboard

`web-dashboard/.env.example` includes:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Mobile App

`mobile-app/.env.example` includes:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000/api
```

Override `EXPO_PUBLIC_API_BASE_URL` if you are using:

- iOS simulator or Expo web: `http://localhost:5000/api`
- a physical device on the same network: `http://YOUR_LOCAL_IP:5000/api`

The mobile app registers the custom URL scheme `kazilog://` for student password reset links.

## Suggested Local Demo Flow

1. Start MongoDB.
2. Run `npm run setup`.
3. Run `npm run dev`.
4. Run `npm run dev:mobile`.
5. Run `npm run bootstrap:admin`.
6. Run `npm run seed:demo`.
7. Sign into the dashboard with either the admin credentials from `backend/.env` or the seeded demo credentials below.
8. Sign into the mobile app as the seeded student and test live submissions from within the configured geofence.
9. Sign into the dashboard as the seeded supervisor to review logs.
10. Sign into the dashboard as the seeded assessor to submit final grades.

## Demo Seed

Run:

```powershell
npm run seed:demo
```

This creates one complete reusable demo scenario:

- `KaziLog Demo Admin`
- `Mercy Wanjiku` as supervisor
- `Dr. Peter Otieno` as assessor
- `Amina Njeri` as student
- one Nairobi company geofence
- one active attachment session
- three sample logs covering `Approved`, `Rejected`, and `Pending`

Seeded credentials:

- Admin: `admin.demo@kazilog.com` / `AdminDemo1!`
- Supervisor: `supervisor.demo@kazilog.com` / `Supervisor1!`
- Assessor: `assessor.demo@kazilog.com` / `Assessor1!`
- Student: `student.demo@kazilog.com` / `Student1!`

The seed script is idempotent for the demo records. Re-running it refreshes the same scenario instead of creating duplicates.

## Full Manual Test Guide

### 1. Start the stack

```powershell
npm run dev
```

In a second terminal:

```powershell
npm run dev:mobile
```

In a third terminal:

```powershell
npm run seed:demo
```

### 2. Test the admin view

1. Open `http://localhost:5173`.
2. Sign in as `admin.demo@kazilog.com`.
3. Confirm the home dashboard shows:
   - `System Setup`
   - `Supervisor Workflow Preview`
   - `Assessor Workflow Preview`
4. Open `Admin Setup` and verify:
   - the overview lists the seeded company, users, and session
   - `Register Company` submits successfully
   - `Register User` works for student, supervisor, and assessor roles
   - `Create Session` allows selecting seeded users through custom dropdowns

### 3. Test the student mobile app

1. Sign into the mobile app as `student.demo@kazilog.com`.
2. Confirm the active session loads.
3. From within the company geofence, submit a new daily log and confirm it lands in history.
4. Temporarily disable internet, submit another log, and confirm it appears in the offline queue.
5. Re-enable internet and confirm the queue syncs automatically.
6. Sign out, tap `Forgot password?`, request a reset link, and confirm the email link opens the `Reset Password` screen in the app.
7. If using an emulator without reliable GPS, development-only fallback coordinates are still allowed in `__DEV__` builds.

### 4. Test the supervisor dashboard

1. Sign into the dashboard as `supervisor.demo@kazilog.com`.
2. Open `Reviews`.
3. Verify the status filter uses the custom KaziLog dropdown, not the browser default.
4. Open the seeded pending log, add a comment, and approve or reject it.
5. Switch filters to confirm approved and rejected logs remain visible with their saved comments.

### 5. Test the assessor dashboard

1. Sign into the dashboard as `assessor.demo@kazilog.com`.
2. Open `Students`.
3. Verify both filter controls use the custom KaziLog dropdown style.
4. Open the student log modal and confirm approved logs and supervisor comments are visible.
5. Submit a final grade and confirm the session status changes from active to completed.

### 6. Test admin cross-role development access

1. Stay signed in as `admin.demo@kazilog.com`.
2. Open `Supervisor Workflow Preview` from the dashboard home or `Supervisor View` from the nav.
3. Confirm the page loads with the development preview banner and behaves like the supervisor review screen.
4. Open `Assessor Workflow Preview` from the dashboard home or `Assessor View` from the nav.
5. Confirm the assessor workflow and grading interface are reachable without switching accounts.

## Verification

```powershell
npm run check
```

On Windows PowerShell systems that block `npm.ps1`, use `npm.cmd` for the same commands.

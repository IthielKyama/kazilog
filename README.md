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
- `npm run check`: run backend tests, dashboard build, and mobile typecheck

### Backend

- `npm --prefix backend run setup`
- `npm --prefix backend run dev`
- `npm --prefix backend run bootstrap:admin`
- `npm --prefix backend run create-admin`
- `npm --prefix backend test`

### Web Dashboard

- `npm --prefix web-dashboard run setup`
- `npm --prefix web-dashboard run dev`
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
```

`WEB_DASHBOARD_URL` is used for password reset links sent by the backend.

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

## Suggested Local Demo Flow

1. Start MongoDB.
2. Run `npm run setup`.
3. Run `npm run dev`.
4. Run `npm run dev:mobile`.
5. Run `npm run bootstrap:admin`.
6. Sign into the dashboard with the admin credentials from `backend/.env`.
7. Register supervisor, assessor, and student accounts from the admin dashboard.
8. Create companies and attachment sessions.
9. Sign into the mobile app as the student and submit logs from within the configured geofence.
10. Sign into the dashboard as the supervisor to review logs.
11. Sign into the dashboard as the assessor to submit final grades.

## Verification

```powershell
npm run check
```

If you hit local Windows permission issues with spawned test/build tools, rerun the verification commands in a normal local shell or CI environment.

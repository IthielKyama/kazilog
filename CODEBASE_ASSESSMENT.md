# KaziLog Codebase Assessment

Assessment date: `2026-04-26`

## 1. Executive Summary

KaziLog already has a solid functional backbone for the core research idea:

- a working backend API
- a working student mobile app
- a partially working multi-role web dashboard
- GPS geofence validation on log submission
- offline queueing for student submissions
- supervisor review and assessor grading flows

The repo is not yet feature-complete against the full study vision. The main gap is not the core logbook engine, but the operational/admin layer around it. In practical terms, the student journey is much further along than the institution setup journey.

## 2. Expected System From the Documentation

Based on the project write-up, KaziLog is expected to provide:

- secure access for students, supervisors, assessors, and admins
- a digital alternative to paper logbooks
- GPS-backed location verification during student submissions
- online supervisor approval and commenting
- online assessor monitoring and final grading
- a web-first or mobile-friendly student experience
- offline resilience for areas with weak internet
- a system aligned with Kenyan attachment workflows in universities and TVET institutions

## 3. Current Repository Structure

## `backend/`

Purpose:
Node.js/Express API with MongoDB persistence.

Current responsibilities:

- JWT authentication
- role-based authorization
- user registration and login
- password reset and forced password change
- company storage with geofence radius
- attachment session storage
- student logbook entry creation
- supervisor review
- assessor grading

Key files:

- `backend/src/app.js`
- `backend/src/server.js`
- `backend/src/controllers/`
- `backend/src/routes/`
- `backend/src/models/`
- `backend/src/utils/geofence.js`

## `mobile-app/`

Purpose:
Student-facing Expo React Native client.

Current responsibilities:

- student login
- forced password change
- active session display
- daily log submission
- runtime GPS capture
- offline queue storage
- submission history view

Key files:

- `mobile-app/App.tsx`
- `mobile-app/src/context/AuthContext.tsx`
- `mobile-app/src/screens/DailyLogScreen.tsx`
- `mobile-app/src/screens/HistoryScreen.tsx`
- `mobile-app/src/utils/offlineQueue.ts`
- `mobile-app/src/utils/location.ts`

## `web-dashboard/`

Purpose:
Role-based React dashboard for admin, supervisor, and assessor users.

Current responsibilities:

- login
- forgot/reset password
- forced password change
- supervisor pending-review workflow
- assessor session grading workflow
- partial admin operations

Key files:

- `web-dashboard/src/App.jsx`
- `web-dashboard/src/pages/Login.jsx`
- `web-dashboard/src/pages/SupervisorDashboard.jsx`
- `web-dashboard/src/pages/AssessorDashboard.jsx`
- `web-dashboard/src/pages/AdminDashboard.jsx`

## 4. What Is Implemented Today

## Authentication and Access Control

Implemented:

- JWT login for all user roles
- role checks in middleware
- profile fetch with `/api/auth/me`
- forgot password endpoint
- reset password endpoint
- forced password-change flow for temporary passwords
- strong password policy validation

Notes:

- Admin-created accounts can be given temporary passwords automatically.
- The mobile app intentionally blocks non-student accounts.

## Student Logbook Flow

Implemented:

- active attachment session lookup
- task and skills submission
- automatic timestamping
- GPS coordinate capture at submission time
- geofence validation against company coordinates and radius
- student submission history
- offline queueing in device storage
- sync attempt on reconnect and app foreground

What this means:

- The central research idea of replacing paper daily entries with a GPS-backed digital process is already working in code.

## Supervisor Workflow

Implemented:

- fetch pending logs for supervised students
- approve or reject log entries
- optional comment field in backend
- review UI in the dashboard

Current limitation:

- The dashboard review action currently sends only the status, not a written comment from the UI.

## Assessor Workflow

Implemented:

- fetch sessions assigned to an assessor
- show total logs and approved logs
- set final grade
- automatically mark a session inactive when grading is finalized

Current limitation:

- The assessor UI shows summary/progress only. It does not yet drill into full approved log details for a student.

## Admin Workflow

Implemented:

- backend endpoints to create companies
- backend endpoints to list companies
- backend endpoints to list users
- backend endpoints to create attachment sessions
- dashboard UI to register users
- admin bootstrap script for fresh environments

Partially implemented:

- company registration form exists in the dashboard, but it is still mocked instead of calling the backend
- session creation tab exists, but the form is not yet implemented

## Automated Testing

Implemented:

- backend integration tests for auth
- backend integration tests for logbook flows
- backend integration tests for admin flows
- backend integration tests for assessor flows
- backend model and middleware tests

Missing:

- web dashboard tests
- mobile app tests
- end-to-end tests across the full stack

## 5. Requirement Coverage

## Functional Requirements

| Requirement | Expected | Current coverage | Status |
| --- | --- | --- | --- |
| FR-01 User logins | Secure multi-role access | Implemented in backend and both clients | Complete |
| FR-02 Set boundaries | Admin defines workplace radius | Backend supports it, dashboard UI partial | Partial |
| FR-03 Capture location | Capture GPS on submission | Implemented in mobile app | Complete |
| FR-04 Check location | Allow submission only within geofence | Implemented in backend | Complete |
| FR-05 Daily logging | Student enters daily work and cannot edit after submit | Create-only flow exists, no edit route exists | Complete |
| FR-06 Supervisor dashboard | Review, approve, comment | Review exists, comment support is backend-only in practice | Partial |
| FR-07 Assessor grading | Remote review and grading | Session summary and grading implemented | Partial |
| FR-08 Offline mode | Save and sync later | Implemented in mobile app | Complete |

## Non-Functional Requirements

| Requirement | Expected | Current coverage | Status |
| --- | --- | --- | --- |
| Speed | Submission and geofence under 2 seconds | No benchmark or monitoring yet | Not yet validated |
| Scalability | Support many concurrent users | No load testing yet | Not yet validated |
| Reliability | 99.5% uptime | No deployment or uptime tooling yet | Not yet validated |
| Security | Protect passwords and location data | Password hashing and JWT exist; production hardening incomplete | Partial |
| Ease of use | Very simple workflow | Mobile flow is strong, admin setup flow still rough | Partial |

## 6. Current Gaps and Risks

## A. Admin Operations Are the Biggest Delivery Gap

Why it matters:

- The student and supervisor flows depend on companies, users, and sessions being set up correctly.
- The backend can do this, but the admin UI is not complete enough yet for normal operational use.

What is missing:

- live company creation from the dashboard
- session creation form in the dashboard
- better admin data management and validation

## B. Configuration Is Still Development-Oriented

Current issues:

- several dashboard API calls are hardcoded to `http://localhost:5000`
- the password reset email builds a hardcoded frontend URL at `http://localhost:5173`
- there is no shared environment strategy across all apps

Impact:

- local development works
- staging/production deployment will be harder until URLs are environment-driven

## C. Email Is Not Production-Ready

Current behavior:

- email uses Ethereal test accounts on demand
- emails are preview/test emails, not institution-ready mail delivery

Impact:

- good for development
- not suitable for actual university or TVET rollout

## D. Frontend Coverage Is Limited

Current issues:

- no frontend unit tests
- no mobile interaction tests
- no end-to-end workflow tests

Impact:

- regression risk is highest in dashboard and mobile changes

## E. Product Scope Still Needs a Few Workflow Details

Missing or limited today:

- admin UI for full lifecycle management
- richer assessor review of approved daily logs
- reporting/analytics dashboard
- stronger audit trail around approvals, rejections, and grading
- better operational handling for supervisor comments and feedback loops

## 7. Where the Codebase Is Today

The best way to describe the repo today is:

- Core platform logic: mostly present
- Student experience: meaningfully implemented
- Supervisor experience: usable
- Assessor experience: usable but still summary-level
- Admin experience: partially implemented and the main blocker to a full real-world pilot
- Production readiness: not there yet

This means the repo is already a credible technical prototype and a good MVP foundation, but not yet a fully operational institutional system.

## 8. Recommended Delivery Phases

## Phase 1: Stabilize Core Setup and Configuration

Goal:
Make the system easy to boot, configure, and run for developers and testers.

Recommended work:

- move all dashboard API URLs to environment variables
- make password reset frontend URL environment-driven
- add environment examples for each app
- standardize local setup scripts
- keep the admin bootstrap path working and documented

Definition of done:

- a new developer can start backend, dashboard, and mobile app without code edits

## Phase 2: Complete Admin Operations

Goal:
Remove dependency on manual API setup for normal system use.

Recommended work:

- wire the company registration form to `/api/admin/companies`
- build the session creation UI against `/api/admin/sessions`
- add user and company selection lists to session creation
- add better validation and success/error states
- optionally add admin views for active sessions and user management

Definition of done:

- an admin can fully set up a student attachment from the dashboard alone

## Phase 3: Deepen Supervisor and Assessor Workflows

Goal:
Match the academic process more closely.

Recommended work:

- add supervisor comment input in the UI
- let assessors open a student and read approved logs in detail
- show clearer progress indicators and flagged exceptions
- add filters by status, company, supervisor, and assessor

Definition of done:

- supervisors and assessors can carry out their full review workflow without leaving the dashboard

## Phase 4: Improve Mobile Robustness

Goal:
Make the student app stronger in real field conditions.

Recommended work:

- improve sync retry behavior and error handling
- distinguish queued, syncing, synced, and failed submissions more clearly
- add optional duplicate-submission protection
- consider background sync strategies where platform support allows
- improve permission and GPS failure messaging

Definition of done:

- students can reliably submit from unstable network environments with minimal confusion

## Phase 5: Production Hardening

Goal:
Prepare for pilot deployment in real institutions.

Recommended work:

- replace Ethereal with a real mail provider
- add logging, monitoring, and error tracking
- define backup and restore strategy
- add rate limiting and stricter security controls
- add HTTPS-aware deployment configuration
- run performance and load testing
- add privacy, consent, and data retention guidance for GPS data

Definition of done:

- the system can be deployed and operated responsibly outside local development

## 9. Suggested Near-Term Priorities

If the goal is the fastest path to a complete MVP, the next priorities should be:

1. Complete admin company and session management in the dashboard.
2. Remove hardcoded local URLs and standardize environment configuration.
3. Add assessor detail views and supervisor comment capture in the UI.
4. Add frontend/mobile test coverage for the most important workflows.
5. Prepare a production-ready email and deployment strategy.

## 10. Practical Setup Notes for the Current Repo

For the codebase as it exists now:

- the backend must be running first
- MongoDB must be available
- the first admin should be created with `backend/create-admin.js`
- the dashboard is enough for login, user registration, supervisor review, and assessor grading
- the company/session setup still depends on backend API usage until the admin UI is finished

## 11. Final Assessment

KaziLog already demonstrates the most important technical proof points of the research:

- digitized daily attachment logging
- GPS-backed presence validation
- remote supervision and grading
- offline-aware student submissions

The remaining work is mostly about completion, operational polish, and deployment readiness rather than proving the concept itself. That is a strong position for the project to be in at this stage.

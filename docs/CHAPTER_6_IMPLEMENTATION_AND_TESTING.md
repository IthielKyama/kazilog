# Chapter 6: Implementation and Testing

This chapter describes how KaziLog was implemented and how the completed system was tested using the current codebase, runtime environment, and seeded sample data. The implementation combined a Node.js and Express back-end API, a React web dashboard for administrators, supervisors, and assessors, and an Expo React Native mobile application for students. Testing focused on the core functional requirements identified in Chapter 4, especially authentication, geofence-based submission, log review, and final grading workflows.

## 6.1 Development Environment

### 6.1.1 Hardware and Software Environment

KaziLog was implemented and verified in a local development environment running on Windows 10 Pro. The project used Node.js `v22.16.0` and npm commands executed through `npm.cmd`, which is a practical requirement on some PowerShell installations where script execution is restricted. Source code was organized in a monorepo structure with separate folders for the back-end API, the web dashboard, and the mobile application.

### 6.1.2 Back-End Development Environment

The back-end was implemented in the `backend/` application using the following technologies:

- Node.js for the runtime environment
- Express.js for the REST API layer
- MongoDB for persistent data storage
- Mongoose for schema definition and database access
- JSON Web Tokens (JWT) for secure authentication
- bcryptjs for password hashing
- Jest and Supertest for automated unit and integration testing

The back-end uses environment variables stored in `backend/.env` to configure the application. Key variables include the server port, MongoDB connection string, JWT secret, and password reset URLs. The API exposes role-aware routes for administrators, students, supervisors, and assessors. Core business logic implemented on the server includes:

- registration and login control
- session creation and assignment
- GPS coordinate validation against company geofences
- logbook entry submission and status tracking
- supervisor approval or rejection of logs
- assessor grading of completed attachment sessions

### 6.1.3 Front-End Development Environment

The KaziLog front end is split into two client applications because the system serves different users in different contexts.

The `web-dashboard/` application was implemented with:

- React 19
- Vite for development and production builds
- Axios for API communication
- Zustand for authentication state management
- Vitest and Testing Library for component and page testing

The dashboard provides browser-based interfaces for:

- admin setup of companies, users, and attachment sessions
- supervisor review of submitted student logs
- assessor viewing of approved logs and final grading

The `mobile-app/` application was implemented with:

- Expo
- React Native
- TypeScript
- Expo Location for GPS capture
- AsyncStorage and custom queue utilities for offline-first behavior

The mobile application allows students to:

- authenticate securely
- retrieve their active attachment session
- capture daily tasks and skills learned
- attach GPS coordinates at submission time
- queue entries offline and sync them when connectivity is restored

### 6.1.4 Database and Test Data Environment

The persistent data layer is built on MongoDB with four main collections aligned to the system design in Chapter 5:

- `users`
- `companies`
- `attachmentsessions`
- `logbookentries`

To support realistic implementation testing, the project now includes a reusable seeding script, `npm run seed:test-data`, which clears the application collections and loads representative attachment scenarios. The seeded dataset used for this chapter contained:

- 11 users
- 4 companies
- 4 attachment sessions
- 13 logbook entries

The data was intentionally designed to cover multiple workflow states rather than a single happy path. It includes active and completed sessions, multiple counties in Kenya, different company geofence radii, and log entries across `Pending`, `Approved`, and `Rejected` states.

### 6.1.5 Seeded Test Scenarios Used

The main seeded scenarios used for implementation and testing were:

| Scenario | Student | Company | Session Status | Evidence Seeded |
| --- | --- | --- | --- | --- |
| Scenario 1 | Brian Odhiambo | Nairobi Innovation Hub | Active | 4 logs with approved, rejected, and pending review states |
| Scenario 2 | Sharon Chepkemoi | Rift Valley Agro Systems, Nakuru | Active | 3 logs with approved and pending review states |
| Scenario 3 | Kevin Musyoka | Coastline Data Systems, Mombasa | Active | 2 logs with rejected and pending review states |
| Scenario 4 | Faith Wambui | Lake Basin Digital Works, Kisumu | Completed | 4 approved logs and final grade `A` |

These scenarios made it possible to test more than one workflow outcome, compare dashboards across multiple users, and demonstrate that the system can support both in-progress and completed industrial attachment records.

## 6.2 Test Plan

### 6.2.1 Testing Strategy

Testing for KaziLog used a blended strategy with automated back-end tests, automated web UI tests, production build verification, and mobile static verification. The main objective was to confirm that sampled functional requirements from Chapter 4 behave correctly in realistic workflows.

The testing approach included:

- automated unit and integration tests for the Express API using Jest and Supertest
- automated dashboard interaction tests using Vitest and Testing Library
- front-end production build verification using Vite
- mobile TypeScript validation for the Expo application
- seeded manual QA scenarios using multiple user roles and locations

### 6.2.2 Test Data

The sampled functional tests were executed against realistic data seeded with the command below:

```powershell
npm run seed:test-data
```

This command reset the application collections and inserted:

- 2 admin accounts
- 3 supervisors
- 2 assessors
- 4 students
- 4 Kenyan workplace locations with geofence radii
- 4 attachment sessions
- 13 daily logbook entries

Representative credentials created for testing included:

- Admin: `admin.demo@kazilog.com`
- Supervisor: `grace.atieno@kazilog.co.ke`
- Assessor: `faith.mutua@kazilog.co.ke`
- Student: `brian.odhiambo@kazilog.co.ke`

### 6.2.3 Sampled Functional Requirement Test Cases

The table below summarizes sampled test cases derived from the functional requirements in Chapter 4.

| Test Case ID | Functional Requirement | Test Procedure | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| TC-01 | FR-01 User Logins | Log in as admin, supervisor, assessor, and student with valid credentials | System authenticates each role and returns the correct session data | Automated auth tests passed and seeded users can sign in by role | Pass |
| TC-02 | FR-01 User Logins | Attempt login with an invalid password | System rejects the login request | Back-end authentication tests returned `401 Unauthorized` for invalid credentials | Pass |
| TC-03 | FR-02 Set Boundaries | Create companies with latitude, longitude, and allowed radius | Company geofence should be stored successfully | Admin API tests and seeded company records stored correctly | Pass |
| TC-04 | FR-03 Capture Location and FR-04 Check Location | Submit a student log from coordinates inside the assigned geofence | Log should be saved and marked within boundary | Automated integration test returned `201 Created` and stored the log successfully | Pass |
| TC-05 | FR-04 Check Location | Submit a student log from outside the assigned geofence | Log should be blocked with an error | Automated integration test returned `403` with a geofence failure message | Pass |
| TC-06 | FR-05 Daily Logging | Retrieve the student history after submission | Submitted records should appear in the student log list | Student log retrieval tests returned only the authenticated student records | Pass |
| TC-07 | FR-06 Supervisor Dashboard | Open pending logs, add a review comment, and approve or reject a log | Supervisor decision should update the record status and comment | Dashboard tests confirmed comment submission and review state updates | Pass |
| TC-08 | FR-07 Assessor Grading | Open assigned sessions, review approved logs, and assign a final grade | Grade should be saved and completed session should become inactive | API and dashboard tests confirmed grading and session completion behavior | Pass |
| TC-09 | FR-08 Offline Mode | Queue a student log while offline and sync later when connectivity returns | Entry should be stored locally, then uploaded automatically after reconnection | Mobile offline utilities compiled successfully; full device execution should be completed during user acceptance testing | Partial |

### 6.2.4 Test Results from the Current KaziLog System

After seeding the database, the following verification command was executed:

```powershell
npm run check
```

The result was successful across all project applications:

- back-end automated tests: 8 test suites passed, 94 tests passed
- web dashboard automated tests: 5 test files passed, 10 tests passed
- web dashboard production build: completed successfully
- mobile application type checking: completed successfully

These results show that the current implementation is stable enough for demonstration, iterative improvement, and academic evaluation.

### 6.2.5 Interpretation of Results

The test outcomes indicate that KaziLog successfully implements the most important functional requirements of the proposed system. Authentication is working across all user roles, geofence enforcement prevents submissions from unauthorized locations, supervisors can review and comment on daily entries, and assessors can grade sessions remotely without relying on physical paper logbooks.

The seeded multi-scenario dataset also showed that the system does not depend on one ideal workflow. It can handle mixed review outcomes, multiple simultaneous active students, and previously completed attachments. This is important because industrial attachment supervision in Kenyan institutions involves many users and highly varied field conditions.

The only area that still requires broader execution during field deployment is FR-08 offline synchronization on real mobile devices under unstable network conditions. The codebase contains the necessary offline queue and sync utilities, and the project passed static validation, but real-world acceptance testing should still be conducted with target users in universities, TVET institutions, and workplace environments.

### 6.2.6 Conclusion

Implementation and testing results confirm that KaziLog is a working GPS-enabled digital logbook solution aligned with the objectives of this study. The current system provides a practical replacement for paper-based attachment tracking by combining secure access control, GPS-aware daily logging, online supervisor review, and remote assessor grading. The completed implementation is therefore suitable for pilot deployment and further usability evaluation in higher education and TVET contexts in Kenya.

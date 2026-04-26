const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const AttachmentSession = require('../models/AttachmentSession');
const LogbookEntry = require('../models/LogbookEntry');

// ─── User Data ──────────────────────────────────────────
const userData = {
  admin: {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'Password1!',
    role: 'admin',
  },
  student: {
    name: 'Test Student',
    email: 'student@test.com',
    password: 'Password1!',
    role: 'student',
    registrationNumber: 'STU-2026-001',
    department: 'Computer Science',
  },
  supervisor: {
    name: 'Test Supervisor',
    email: 'supervisor@test.com',
    password: 'Password1!',
    role: 'supervisor',
  },
  assessor: {
    name: 'Test Assessor',
    email: 'assessor@test.com',
    password: 'Password1!',
    role: 'assessor',
  },
};

// ─── Company Data (Nairobi coordinates) ─────────────────
const companyData = {
  name: 'Tech Corp Kenya',
  address: '123 Moi Avenue, Nairobi',
  latitude: -1.286389,
  longitude: 36.817223,
  allowedRadiusMeters: 200,
};

// ─── Factory Functions ──────────────────────────────────

/**
 * Create a user directly in the database (bypasses the API/route logic)
 */
const createUser = async (role = 'student') => {
  const data = { ...userData[role] };
  // Add a unique suffix to avoid duplicate key errors across tests
  const suffix = new mongoose.Types.ObjectId().toString().slice(-6);
  data.email = `${role}-${suffix}@test.com`;
  return await User.create(data);
};

/**
 * Generate a JWT token for a given user ID
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * Create a user and return both the user document and a valid auth token
 */
const createAuthenticatedUser = async (role = 'student') => {
  const user = await createUser(role);
  const token = generateToken(user._id);
  return { user, token };
};

/**
 * Create a company directly in the database
 */
const createCompany = async (overrides = {}) => {
  const data = { ...companyData, ...overrides };
  return await Company.create({
    name: data.name + '-' + new mongoose.Types.ObjectId().toString().slice(-6),
    address: data.address,
    location: {
      type: 'Point',
      coordinates: [data.longitude, data.latitude],
    },
    allowedRadiusMeters: data.allowedRadiusMeters,
  });
};

/**
 * Create a full test scenario: admin, student, supervisor, assessor, company, and session
 */
const createFullScenario = async () => {
  const admin = await createAuthenticatedUser('admin');
  const student = await createAuthenticatedUser('student');
  const supervisor = await createAuthenticatedUser('supervisor');
  const assessor = await createAuthenticatedUser('assessor');
  const company = await createCompany();

  const session = await AttachmentSession.create({
    student: student.user._id,
    company: company._id,
    supervisor: supervisor.user._id,
    assessor: assessor.user._id,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-06-30'),
    isActive: true,
  });

  return { admin, student, supervisor, assessor, company, session };
};

/**
 * Create a logbook entry for a given session and student
 */
const createLogEntry = async (sessionId, studentId, overrides = {}) => {
  return await LogbookEntry.create({
    session: sessionId,
    student: studentId,
    tasksDone: 'Completed API integration',
    skillsLearned: 'RESTful API design',
    submissionLocation: {
      type: 'Point',
      coordinates: [36.817223, -1.286389], // At the company
    },
    distanceFromCompanyMeters: 10,
    isWithinBoundary: true,
    ...overrides,
  });
};

module.exports = {
  userData,
  companyData,
  createUser,
  generateToken,
  createAuthenticatedUser,
  createCompany,
  createFullScenario,
  createLogEntry,
};

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue(undefined));
const sendEmail = require('../../utils/sendEmail');
const app = require('../../app');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
  process.env.NODE_ENV = 'test';
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  sendEmail.mockClear();
  delete process.env.WEB_DASHBOARD_URL;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Helper: create a user directly in DB and return token
const createUserAndToken = async (role = 'student') => {
  const user = await User.create({
    name: `Test ${role}`,
    email: `${role}-${Date.now()}@test.com`,
    password: 'Password1!',
    role,
    registrationNumber: role === 'student' ? 'STU-001' : undefined,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
};

// ═══════════════════════════════════════════════════════════
// POST /api/auth/register
// ═══════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {

  test('registers a new student successfully (public)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Student',
        email: 'newstudent@test.com',
        password: 'Password1!',
        registrationNumber: 'STU-100',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('token');
    expect(res.body.name).toBe('New Student');
    expect(res.body.role).toBe('student');
  });

  test('defaults to student role when no role is specified', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Default Student',
        email: 'defaultrole@test.com',
        password: 'Password1!',
        registrationNumber: 'STU-101',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.role).toBe('student');
  });

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'No Email' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/basic fields/i);
  });

  test('returns 400 when a student registration has no registration number', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student Without Reg Number',
        email: 'noreg@test.com',
        password: 'Password1!',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/registration number is required/i);
  });

  test('returns 400 for duplicate email', async () => {
    // Create first user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'First',
        email: 'duplicate@test.com',
        password: 'Password1!',
        registrationNumber: 'STU-102',
      });

    // Attempt duplicate
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Second',
        email: 'duplicate@test.com',
        password: 'Password2@',
        registrationNumber: 'STU-103',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('rejects non-student role creation without admin auth', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Fake Supervisor',
        email: 'fakesup@test.com',
        password: 'Password1!',
        role: 'supervisor',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/only admins/i);
  });

  test('allows admin to create supervisor account', async () => {
    const { token } = await createUserAndToken('admin');

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Real Supervisor',
        email: 'realsup@test.com',
        password: 'Password1!',
        role: 'supervisor',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.role).toBe('supervisor');
    expect(res.body.mustChangePassword).toBe(false);
  });

  test('allows admin to create assessor account', async () => {
    const { token } = await createUserAndToken('admin');

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Real Assessor',
        email: 'realassessor@test.com',
        password: 'Password1!',
        role: 'assessor',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.role).toBe('assessor');
  });

  test('auto-generates password when none provided', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'No Password User',
        email: 'nopassword@test.com',
        registrationNumber: 'STU-104',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.mustChangePassword).toBe(true);

    const createdUser = await User.findOne({ email: 'nopassword@test.com' }).select('+password');
    expect(createdUser.mustChangePassword).toBe(true);
  });

  test('rejects weak manually supplied passwords', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak Password User',
        email: 'weak@test.com',
        password: 'weakpass',
        registrationNumber: 'STU-105',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/password must be at least 8 characters/i);
  });
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/login
// ═══════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {

  beforeEach(async () => {
    await User.create({
      name: 'Login Test User',
      email: 'login@test.com',
      password: 'Password1!',
      role: 'student',
      registrationNumber: 'STU-200',
    });
  });

  test('logs in successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password1!' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe('login@test.com');
    expect(res.body.role).toBe('student');
    expect(res.body.mustChangePassword).toBe(false);
  });

  test('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  test('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'Password1!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  test('returns mustChangePassword for temporary-password users', async () => {
    const tempUser = await User.create({
      name: 'Temp User',
      email: 'temp-login@test.com',
      password: 'Password1!',
      registrationNumber: 'STU-201',
      mustChangePassword: true,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: tempUser.email, password: 'Password1!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.mustChangePassword).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════
// GET /api/auth/me
// ═══════════════════════════════════════════════════════════
describe('GET /api/auth/me', () => {

  test('returns current user data when authenticated', async () => {
    const { user, token } = await createUserAndToken('student');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id.toString()).toBe(user._id.toString());
    expect(res.body.name).toBe(user.name);
    expect(res.body.password).toBeUndefined();
    expect(res.body.mustChangePassword).toBe(false);
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/forgotpassword
// ═══════════════════════════════════════════════════════════
describe('POST /api/auth/forgotpassword', () => {
  test('uses WEB_DASHBOARD_URL when building the reset link', async () => {
    process.env.WEB_DASHBOARD_URL = 'http://localhost:5173/';

    await User.create({
      name: 'Forgot Password User',
      email: 'forgot@test.com',
      password: 'Password1!',
      registrationNumber: 'STU-250',
    });

    const res = await request(app)
      .post('/api/auth/forgotpassword')
      .send({ email: 'forgot@test.com' });

    expect(res.statusCode).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'forgot@test.com',
        message: expect.stringContaining('http://localhost:5173/reset-password/'),
      })
    );
  });

  test('returns 404 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/forgotpassword')
      .send({ email: 'ghost@test.com' });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/no user/i);
  });
});

// ═══════════════════════════════════════════════════════════
// PUT /api/auth/resetpassword/:token
// ═══════════════════════════════════════════════════════════
describe('PUT /api/auth/resetpassword/:token', () => {

  test('returns 400 for invalid reset token', async () => {
    const res = await request(app)
      .put('/api/auth/resetpassword/invalidtoken123')
      .send({ password: 'Newpassword1!' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  test('successfully resets password with valid token', async () => {
    const user = await User.create({
      name: 'Reset User',
      email: 'resetme@test.com',
      password: 'Oldpassword1!',
      registrationNumber: 'STU-300',
      mustChangePassword: true,
    });

    // Generate reset token via the model method
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .put(`/api/auth/resetpassword/${resetToken}`)
      .send({ password: 'Newpassword1!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.mustChangePassword).toBe(false);

    // Verify new password works
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'resetme@test.com', password: 'Newpassword1!' });

    expect(loginRes.statusCode).toBe(200);
  });

  test('rejects weak reset password submissions', async () => {
    const user = await User.create({
      name: 'Weak Reset User',
      email: 'weakreset@test.com',
      password: 'Oldpassword1!',
      registrationNumber: 'STU-301',
    });

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .put(`/api/auth/resetpassword/${resetToken}`)
      .send({ password: 'weakpass' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/password must be at least 8 characters/i);
  });
});

describe('PUT /api/auth/change-password', () => {
  test('rejects incorrect current password', async () => {
    const { token } = await createUserAndToken('student');

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword1!', newPassword: 'NewPassword1!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/current password is incorrect/i);
  });

  test('rejects weak new passwords', async () => {
    const { token } = await createUserAndToken('student');

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password1!', newPassword: 'weakpass' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/password must be at least 8 characters/i);
  });

  test('rejects using the same password again', async () => {
    const { token } = await createUserAndToken('student');

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password1!', newPassword: 'Password1!' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/must be different/i);
  });

  test('changes the password and clears mustChangePassword', async () => {
    const user = await User.create({
      name: 'First Login User',
      email: 'firstlogin@test.com',
      password: 'Password1!',
      registrationNumber: 'STU-302',
      mustChangePassword: true,
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password1!', newPassword: 'NewPassword1!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.mustChangePassword).toBe(false);

    const refreshedUser = await User.findById(user._id).select('+password');
    expect(refreshedUser.mustChangePassword).toBe(false);
    expect(await refreshedUser.matchPassword('NewPassword1!')).toBe(true);
  });
});

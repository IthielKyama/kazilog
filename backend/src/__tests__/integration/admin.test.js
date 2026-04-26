const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const User = require('../../models/User');
const Company = require('../../models/Company');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
  process.env.NODE_ENV = 'test';
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) { await collections[key].deleteMany({}); }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

const makeUser = async (role) => {
  const u = await User.create({
    name: `${role}`, email: `${role}-${Date.now()}@t.com`,
    password: 'password123', role,
    registrationNumber: role === 'student' ? 'STU-1' : undefined,
  });
  return { user: u, token: jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '1h' }) };
};

describe('POST /api/admin/companies', () => {
  test('admin creates company successfully', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app).post('/api/admin/companies').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Co', address: '123 Main St', latitude: -1.286, longitude: 36.817 });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('Test Co');
    expect(res.body.data.location.coordinates).toEqual([36.817, -1.286]);
  });

  test('returns 400 for missing fields', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app).post('/api/admin/companies').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Incomplete' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 for duplicate company name', async () => {
    const { token } = await makeUser('admin');
    await Company.create({ name: 'Dup Co', address: 'Addr', location: { type: 'Point', coordinates: [36, -1] }, allowedRadiusMeters: 200 });
    const res = await request(app).post('/api/admin/companies').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup Co', address: 'Other', latitude: -1, longitude: 36 });
    expect(res.statusCode).toBe(400);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).post('/api/admin/companies').send({ name: 'No Auth Co', address: 'Addr', latitude: -1, longitude: 36 });
    expect(res.statusCode).toBe(401);
  });

  test('returns 403 for student role', async () => {
    const { token } = await makeUser('student');
    const res = await request(app).post('/api/admin/companies').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Student Co', address: 'Addr', latitude: -1, longitude: 36 });
    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/admin/companies', () => {
  test('returns all companies', async () => {
    const { token } = await makeUser('admin');
    await Company.create({ name: 'Co1', address: 'A1', location: { type: 'Point', coordinates: [36, -1] }, allowedRadiusMeters: 200 });
    await Company.create({ name: 'Co2', address: 'A2', location: { type: 'Point', coordinates: [37, -2] }, allowedRadiusMeters: 300 });
    const res = await request(app).get('/api/admin/companies').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('GET /api/admin/users', () => {
  test('returns all users without passwords', async () => {
    const { token } = await makeUser('admin');
    await makeUser('student');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    res.body.data.forEach(u => expect(u.password).toBeUndefined());
  });
});

describe('POST /api/admin/sessions', () => {
  test('creates session successfully', async () => {
    const admin = await makeUser('admin');
    const student = await makeUser('student');
    const supervisor = await makeUser('supervisor');
    const assessor = await makeUser('assessor');
    const co = await Company.create({ name: 'SessCo', address: 'A', location: { type: 'Point', coordinates: [36, -1] }, allowedRadiusMeters: 200 });

    const res = await request(app).post('/api/admin/sessions').set('Authorization', `Bearer ${admin.token}`)
      .send({ student: student.user._id, company: co._id, supervisor: supervisor.user._id, assessor: assessor.user._id, startDate: '2026-01-01', endDate: '2026-06-30' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.isActive).toBe(true);
  });

  test('returns 400 when fields missing', async () => {
    const { token } = await makeUser('admin');
    const res = await request(app).post('/api/admin/sessions').set('Authorization', `Bearer ${token}`)
      .send({ student: new mongoose.Types.ObjectId() });
    expect(res.statusCode).toBe(400);
  });
});

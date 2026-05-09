const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const User = require('../../models/User');
const Company = require('../../models/Company');
const AttachmentSession = require('../../models/AttachmentSession');
const LogbookEntry = require('../../models/LogbookEntry');

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
    password: 'Password1!', role,
    registrationNumber: role === 'student' ? 'STU-1' : undefined,
  });
  return { user: u, token: jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '1h' }) };
};

const makeScenario = async () => {
  const s = await makeUser('student'), sup = await makeUser('supervisor'), a = await makeUser('assessor');
  const co = await Company.create({ name: 'Co-' + Date.now(), address: '123 St', location: { type: 'Point', coordinates: [36.817, -1.286] }, allowedRadiusMeters: 200 });
  const sess = await AttachmentSession.create({ student: s.user._id, company: co._id, supervisor: sup.user._id, assessor: a.user._id, startDate: '2026-01-01', endDate: '2026-12-31', isActive: true });
  return { student: s, supervisor: sup, assessor: a, company: co, session: sess };
};

describe('GET /api/assessor/sessions', () => {
  test('returns assigned sessions with stats', async () => {
    const sc = await makeScenario();
    await LogbookEntry.create({ session: sc.session._id, student: sc.student.user._id, tasksDone: 'T', skillsLearned: 'S', submissionLocation: { type: 'Point', coordinates: [36.817, -1.286] }, distanceFromCompanyMeters: 5, isWithinBoundary: true, supervisorStatus: 'Approved' });

    const res = await request(app).get('/api/assessor/sessions').set('Authorization', `Bearer ${sc.assessor.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].stats.totalLogs).toBe(1);
    expect(res.body.data[0].stats.approvedLogs).toBe(1);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/assessor/sessions');
    expect(res.statusCode).toBe(401);
  });

  test('returns 403 for student role', async () => {
    const s = await makeUser('student');
    const res = await request(app).get('/api/assessor/sessions').set('Authorization', `Bearer ${s.token}`);
    expect(res.statusCode).toBe(403);
  });
});

describe('PUT /api/assessor/sessions/:id/grade', () => {
  test('grades a session successfully', async () => {
    const sc = await makeScenario();
    const res = await request(app).put(`/api/assessor/sessions/${sc.session._id}/grade`).set('Authorization', `Bearer ${sc.assessor.token}`).send({ finalGrade: 'Pass' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.finalGrade).toBe('Pass');
    expect(res.body.data.isActive).toBe(false);
    expect(res.body.data.sessionStatusCode).toBe('graded');
  });

  test('keeps session active with Pending grade', async () => {
    const sc = await makeScenario();
    const res = await request(app).put(`/api/assessor/sessions/${sc.session._id}/grade`).set('Authorization', `Bearer ${sc.assessor.token}`).send({ finalGrade: 'Pending' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.isActive).toBe(true);
  });

  test('returns 400 for invalid grade', async () => {
    const sc = await makeScenario();
    const res = await request(app).put(`/api/assessor/sessions/${sc.session._id}/grade`).set('Authorization', `Bearer ${sc.assessor.token}`).send({ finalGrade: 'Z' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 404 for unauthorized assessor', async () => {
    const sc = await makeScenario();
    const other = await makeUser('assessor');
    const res = await request(app).put(`/api/assessor/sessions/${sc.session._id}/grade`).set('Authorization', `Bearer ${other.token}`).send({ finalGrade: 'Fail' });
    expect(res.statusCode).toBe(404);
  });
});

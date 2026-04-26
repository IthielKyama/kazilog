const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const AttachmentSession = require('../../models/AttachmentSession');
const { createAuthenticatedUser, createCompany, createLogEntry } = require('../../test/fixtures');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
  process.env.NODE_ENV = 'test';
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
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

const createScenario = async () => {
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
    endDate: new Date('2026-12-31'),
    isActive: true,
  });

  return { student, supervisor, assessor, company, session };
};

describe('GET /api/logs/session/active', () => {
  test('returns the current student attachment session', async () => {
    const scenario = await createScenario();

    const res = await request(app)
      .get('/api/logs/session/active')
      .set('Authorization', `Bearer ${scenario.student.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id.toString()).toBe(scenario.session._id.toString());
    expect(res.body.data.company.name).toBe(scenario.company.name);
    expect(res.body.data.supervisor.email).toBe(scenario.supervisor.user.email);
  });

  test('returns 404 when the student has no active session', async () => {
    const student = await createAuthenticatedUser('student');

    const res = await request(app)
      .get('/api/logs/session/active')
      .set('Authorization', `Bearer ${student.token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/no active attachment session/i);
  });
});

describe('POST /api/logs', () => {
  test('submits a log successfully when inside the geofence', async () => {
    const scenario = await createScenario();

    const res = await request(app)
      .post('/api/logs')
      .set('Authorization', `Bearer ${scenario.student.token}`)
      .send({
        sessionId: scenario.session._id.toString(),
        tasksDone: 'Completed filing workflow',
        skillsLearned: 'Learned inventory handling',
        latitude: -1.286389,
        longitude: 36.817223,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student.toString()).toBe(scenario.student.user._id.toString());
    expect(res.body.data.isWithinBoundary).toBe(true);
  });

  test('returns 403 when the user is outside the company radius', async () => {
    const scenario = await createScenario();

    const res = await request(app)
      .post('/api/logs')
      .set('Authorization', `Bearer ${scenario.student.token}`)
      .send({
        sessionId: scenario.session._id.toString(),
        tasksDone: 'Worked remotely',
        skillsLearned: 'Time management',
        latitude: -1.300001,
        longitude: 36.900001,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/geofence failed/i);
  });
});

describe('GET /api/logs/student', () => {
  test('returns logs for the authenticated student only', async () => {
    const scenario = await createScenario();
    const otherStudent = await createAuthenticatedUser('student');

    await createLogEntry(scenario.session._id, scenario.student.user._id);
    await createLogEntry(scenario.session._id, otherStudent.user._id, {
      student: otherStudent.user._id,
    });

    const res = await request(app)
      .get('/api/logs/student')
      .set('Authorization', `Bearer ${scenario.student.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
  });
});

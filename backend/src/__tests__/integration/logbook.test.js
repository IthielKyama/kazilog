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

describe('GET /api/logs/session/latest', () => {
  test('returns the active session when one exists', async () => {
    const scenario = await createScenario();

    const res = await request(app)
      .get('/api/logs/session/latest')
      .set('Authorization', `Bearer ${scenario.student.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data._id.toString()).toBe(scenario.session._id.toString());
    expect(res.body.data.isActive).toBe(true);
  });

  test('returns the most recent completed session when no active session exists', async () => {
    const scenario = await createScenario();
    scenario.session.isActive = false;
    scenario.session.finalGrade = 'Pass';
    await scenario.session.save();

    const latestCompleted = await AttachmentSession.create({
      student: scenario.student.user._id,
      company: scenario.company._id,
      supervisor: scenario.supervisor.user._id,
      assessor: scenario.assessor.user._id,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2027-02-28'),
      isActive: false,
      finalGrade: 'Pass',
    });

    const olderCompleted = await AttachmentSession.create({
      student: scenario.student.user._id,
      company: scenario.company._id,
      supervisor: scenario.supervisor.user._id,
      assessor: scenario.assessor.user._id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: false,
      finalGrade: 'Fail',
    });

    const res = await request(app)
      .get('/api/logs/session/latest')
      .set('Authorization', `Bearer ${scenario.student.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data._id.toString()).toBe(latestCompleted._id.toString());
    expect(res.body.data._id.toString()).not.toBe(olderCompleted._id.toString());
    expect(res.body.data.finalGrade).toBe('Pass');
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

  test('filters logs to the requested student session only', async () => {
    const scenario = await createScenario();
    const anotherCompany = await createCompany();
    const anotherSession = await AttachmentSession.create({
      student: scenario.student.user._id,
      company: anotherCompany._id,
      supervisor: scenario.supervisor.user._id,
      assessor: scenario.assessor.user._id,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
      isActive: false,
      finalGrade: 'Pass',
    });

    const targetLog = await createLogEntry(scenario.session._id, scenario.student.user._id);
    await createLogEntry(anotherSession._id, scenario.student.user._id, {
      tasksDone: 'Old attachment work',
    });

    const res = await request(app)
      .get(`/api/logs/student?sessionId=${scenario.session._id}`)
      .set('Authorization', `Bearer ${scenario.student.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0]._id.toString()).toBe(targetLog._id.toString());
  });
});

describe('GET /api/logs/session/:sessionId', () => {
  test('returns all session logs including rejected entries for the assessor', async () => {
    const scenario = await createScenario();

    await createLogEntry(scenario.session._id, scenario.student.user._id, {
      supervisorStatus: 'Approved',
      supervisorComment: 'Solid work',
    });
    await createLogEntry(scenario.session._id, scenario.student.user._id, {
      supervisorStatus: 'Rejected',
      supervisorComment: 'Please improve detail',
      tasksDone: 'Incomplete entry',
    });

    const res = await request(app)
      .get(`/api/logs/session/${scenario.session._id}`)
      .set('Authorization', `Bearer ${scenario.assessor.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data.map((log) => log.supervisorStatus).sort()).toEqual(['Approved', 'Rejected']);
  });

  test('returns session lifecycle metadata with session logs', async () => {
    const scenario = await createScenario();

    const res = await request(app)
      .get(`/api/logs/session/${scenario.session._id}`)
      .set('Authorization', `Bearer ${scenario.assessor.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.session.sessionStatusCode).toBe('active');
    expect(res.body.session.weekProgress.label).toMatch(/^Week \d+\/\d+$/);
  });
});

describe('GET /api/logs/supervisor/sessions', () => {
  test('returns supervisor sessions with lifecycle and stats', async () => {
    const scenario = await createScenario();
    await createLogEntry(scenario.session._id, scenario.student.user._id, { supervisorStatus: 'Approved' });
    await createLogEntry(scenario.session._id, scenario.student.user._id, { supervisorStatus: 'Pending' });

    const res = await request(app)
      .get('/api/logs/supervisor/sessions')
      .set('Authorization', `Bearer ${scenario.supervisor.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].stats.totalLogs).toBe(2);
    expect(res.body.data[0].stats.pendingLogs).toBe(1);
    expect(res.body.data[0].sessionStatusCode).toBe('active');
  });
});

describe('GET /api/logs/session/:sessionId/export', () => {
  test('streams a PDF export for an authorized supervisor', async () => {
    const scenario = await createScenario();
    await createLogEntry(scenario.session._id, scenario.student.user._id, { supervisorStatus: 'Approved' });

    const res = await request(app)
      .get(`/api/logs/session/${scenario.session._id}/export`)
      .set('Authorization', `Bearer ${scenario.supervisor.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });
});

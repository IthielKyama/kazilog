require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Company = require('./src/models/Company');
const AttachmentSession = require('./src/models/AttachmentSession');
const LogbookEntry = require('./src/models/LogbookEntry');
const { syncSessionLifecycle } = require('./src/utils/sessionLifecycle');

const SEED = {
  supervisor: {
    name: 'Ithiel Kariuki',
    email: 'ithiel@email.com',
    password: 'Supervisor1!',
    role: 'supervisor',
    department: 'Industrial Training',
  },
  assessor: {
    name: 'Vaylor Muli',
    email: 'vaylor@email.com',
    password: 'Assessor1!',
    role: 'assessor',
    department: 'School of Computing',
  },
  student: {
    name: 'Naomi Wanjiru',
    email: 'naomi.awaiting.grading@kazilog.co.ke',
    password: 'Student1!',
    role: 'student',
    registrationNumber: 'TVET-ATT-2026-AG-001',
    department: 'Information Technology',
  },
  company: {
    name: 'Awaiting Grading Technologies',
    address: 'Ngong Road, Nairobi, Kenya',
    latitude: -1.3004,
    longitude: 36.7842,
    allowedRadiusMeters: 200,
  },
  session: {
    startDate: '2026-01-06',
    endDate: '2026-04-24',
    isActive: false,
    finalGrade: 'Pending',
  },
  logs: [
    {
      date: '2026-01-08T08:05:00.000Z',
      tasksDone: 'Set up the workstation, reviewed attachment reporting expectations, and documented the help desk onboarding checklist.',
      skillsLearned: 'Workplace onboarding, support desk etiquette, and documenting routine technical tasks clearly.',
      distanceFromCompanyMeters: 10,
      supervisorStatus: 'Approved',
      supervisorComment: 'Good start. Keep noting the tools and systems you use each day.',
      idempotencyKey: 'awaiting-grading-log-001',
    },
    {
      date: '2026-01-15T09:15:00.000Z',
      tasksDone: 'Updated equipment inventory records and assisted with printer connectivity troubleshooting for office users.',
      skillsLearned: 'Asset management, first-line troubleshooting, and communicating support outcomes to staff.',
      distanceFromCompanyMeters: 6,
      supervisorStatus: 'Approved',
      supervisorComment: 'Well documented and practical. Continue linking work to specific incidents.',
      idempotencyKey: 'awaiting-grading-log-002',
    },
    {
      date: '2026-01-22T10:30:00.000Z',
      tasksDone: 'Prepared backup verification notes, reviewed account access requests, and summarized the day’s completed work.',
      skillsLearned: 'Backup verification, access control awareness, and concise daily reporting.',
      distanceFromCompanyMeters: 9,
      supervisorStatus: 'Approved',
      supervisorComment: 'Consistent improvement. This is ready for final assessor review once the session ends.',
      idempotencyKey: 'awaiting-grading-log-003',
    },
  ],
};

function buildPoint(longitude, latitude) {
  return {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
}

async function ensureUser(definition) {
  const existing = await User.findOne({ email: definition.email }).select('+password');

  if (existing) {
    return { user: existing, created: false };
  }

  const user = await User.create({
    name: definition.name,
    email: definition.email,
    password: definition.password,
    role: definition.role,
    registrationNumber: definition.registrationNumber,
    department: definition.department,
    mustChangePassword: false,
  });

  return { user, created: true };
}

async function ensureCompany(definition) {
  let company = await Company.findOne({ name: definition.name });
  let created = false;

  if (!company) {
    company = await Company.create({
      name: definition.name,
      address: definition.address,
      location: buildPoint(definition.longitude, definition.latitude),
      allowedRadiusMeters: definition.allowedRadiusMeters,
    });
    created = true;
  }

  return { company, created };
}

async function ensureSession({ student, supervisor, assessor, company }) {
  let session = await AttachmentSession.findOne({
    student: student._id,
    supervisor: supervisor._id,
    assessor: assessor._id,
    company: company._id,
  });
  let created = false;

  if (!session) {
    session = new AttachmentSession({
      student: student._id,
      supervisor: supervisor._id,
      assessor: assessor._id,
      company: company._id,
    });
    created = true;
  }

  session.startDate = new Date(SEED.session.startDate);
  session.endDate = new Date(SEED.session.endDate);
  session.isActive = SEED.session.isActive;
  session.finalGrade = SEED.session.finalGrade;
  await session.save();
  const lifecycle = await syncSessionLifecycle(session);

  return { session, lifecycle, created };
}

async function ensureLogs({ session, student, company }) {
  const submissionLocation = buildPoint(company.location.coordinates[0], company.location.coordinates[1]);
  let createdCount = 0;

  for (const definition of SEED.logs) {
    const existing = await LogbookEntry.findOne({ idempotencyKey: definition.idempotencyKey });

    if (existing) {
      existing.session = session._id;
      existing.student = student._id;
      existing.date = new Date(definition.date);
      existing.tasksDone = definition.tasksDone;
      existing.skillsLearned = definition.skillsLearned;
      existing.submissionLocation = submissionLocation;
      existing.distanceFromCompanyMeters = definition.distanceFromCompanyMeters;
      existing.isWithinBoundary = true;
      existing.supervisorStatus = definition.supervisorStatus;
      existing.supervisorComment = definition.supervisorComment;
      await existing.save();
      continue;
    }

    await LogbookEntry.create({
      session: session._id,
      student: student._id,
      date: new Date(definition.date),
      tasksDone: definition.tasksDone,
      skillsLearned: definition.skillsLearned,
      submissionLocation,
      distanceFromCompanyMeters: definition.distanceFromCompanyMeters,
      isWithinBoundary: true,
      supervisorStatus: definition.supervisorStatus,
      supervisorComment: definition.supervisorComment,
      idempotencyKey: definition.idempotencyKey,
    });
    createdCount += 1;
  }

  return createdCount;
}

async function seedCompletedAwaitingGradingStudent() {
  await connectDB();

  try {
    const { user: supervisor, created: supervisorCreated } = await ensureUser(SEED.supervisor);
    const { user: assessor, created: assessorCreated } = await ensureUser(SEED.assessor);
    const { user: student, created: studentCreated } = await ensureUser(SEED.student);
    const { company, created: companyCreated } = await ensureCompany(SEED.company);
    const { session, lifecycle, created: sessionCreated } = await ensureSession({
      student,
      supervisor,
      assessor,
      company,
    });
    const createdLogCount = await ensureLogs({ session, student, company });

    console.log('Completed-awaiting-grading student seed applied successfully.');
    console.log(`Supervisor: ${supervisor.email} (${supervisorCreated ? 'created' : 'existing'})`);
    console.log(`Assessor: ${assessor.email} (${assessorCreated ? 'created' : 'existing'})`);
    console.log(`Student: ${student.email} (${studentCreated ? 'created' : 'existing'})`);
    console.log(`Company: ${company.name} (${companyCreated ? 'created' : 'existing'})`);
    console.log(`Session: ${session._id} (${sessionCreated ? 'created' : 'updated'})`);
    console.log(`Lifecycle status: ${lifecycle.sessionStatus} [${lifecycle.sessionStatusCode}]`);
    console.log(`Final grade: ${lifecycle.finalGrade}`);
    console.log(`Logs inserted this run: ${createdLogCount}`);
    console.log(`Student password: ${studentCreated ? SEED.student.password : 'unchanged'}`);
  } catch (error) {
    console.error('Failed to seed completed-awaiting-grading student:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedCompletedAwaitingGradingStudent();

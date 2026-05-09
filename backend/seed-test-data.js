require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Company = require('./src/models/Company');
const AttachmentSession = require('./src/models/AttachmentSession');
const LogbookEntry = require('./src/models/LogbookEntry');

const SEED = {
  admins: [
    {
      key: 'systemAdmin',
      name: process.env.ADMIN_NAME || 'System Admin',
      email: (process.env.ADMIN_EMAIL || 'admin@kazilog.com').trim().toLowerCase(),
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
    },
    {
      key: 'demoAdmin',
      name: 'KaziLog Demo Admin',
      email: 'admin.demo@kazilog.com',
      password: 'AdminDemo1!',
      role: 'admin',
    },
  ],
  supervisors: [
    {
      key: 'grace',
      name: 'Grace Atieno',
      email: 'grace.atieno@kazilog.co.ke',
      password: 'Supervisor1!',
      role: 'supervisor',
      department: 'ICT Operations',
    },
    {
      key: 'james',
      name: 'James Mwangi',
      email: 'james.mwangi@kazilog.co.ke',
      password: 'Supervisor1!',
      role: 'supervisor',
      department: 'Systems Support',
    },
    {
      key: 'linda',
      name: 'Linda Chebet',
      email: 'linda.chebet@kazilog.co.ke',
      password: 'Supervisor1!',
      role: 'supervisor',
      department: 'Data Services',
    },
  ],
  assessors: [
    {
      key: 'faith',
      name: 'Dr. Faith Mutua',
      email: 'faith.mutua@kazilog.co.ke',
      password: 'Assessor1!',
      role: 'assessor',
      department: 'School of Computing',
    },
    {
      key: 'kevin',
      name: 'Kevin Kiptoo',
      email: 'kevin.kiptoo@kazilog.co.ke',
      password: 'Assessor1!',
      role: 'assessor',
      department: 'Department of Engineering',
    },
  ],
  students: [
    {
      key: 'brian',
      name: 'Brian Odhiambo',
      email: 'brian.odhiambo@kazilog.co.ke',
      password: 'Student1!',
      role: 'student',
      registrationNumber: 'TVET-IT-2026-001',
      department: 'Information Technology',
    },
    {
      key: 'sharon',
      name: 'Sharon Chepkemoi',
      email: 'sharon.chepkemoi@kazilog.co.ke',
      password: 'Student1!',
      role: 'student',
      registrationNumber: 'UNI-CS-2026-014',
      department: 'Computer Science',
    },
    {
      key: 'kevinStudent',
      name: 'Kevin Musyoka',
      email: 'kevin.musyoka@kazilog.co.ke',
      password: 'Student1!',
      role: 'student',
      registrationNumber: 'TVET-BIS-2026-009',
      department: 'Business Information Systems',
    },
    {
      key: 'faithStudent',
      name: 'Faith Wambui',
      email: 'faith.wambui@kazilog.co.ke',
      password: 'Student1!',
      role: 'student',
      registrationNumber: 'UNI-IT-2025-102',
      department: 'Information Technology',
    },
  ],
  companies: [
    {
      key: 'nairobiHub',
      name: 'Nairobi Innovation Hub',
      address: 'Waiyaki Way, Westlands, Nairobi, Kenya',
      latitude: -1.2676,
      longitude: 36.8108,
      allowedRadiusMeters: 200,
    },
    {
      key: 'nakuruAgro',
      name: 'Rift Valley Agro Systems',
      address: 'Kenyatta Avenue, Nakuru, Kenya',
      latitude: -0.3031,
      longitude: 36.08,
      allowedRadiusMeters: 180,
    },
    {
      key: 'mombasaData',
      name: 'Coastline Data Systems',
      address: 'Moi Avenue, Mombasa, Kenya',
      latitude: -4.0435,
      longitude: 39.6682,
      allowedRadiusMeters: 150,
    },
    {
      key: 'kisumuWorks',
      name: 'Lake Basin Digital Works',
      address: 'Oginga Odinga Street, Kisumu, Kenya',
      latitude: -0.0917,
      longitude: 34.768,
      allowedRadiusMeters: 220,
    },
  ],
  sessions: [
    {
      key: 'brianCurrent',
      student: 'brian',
      company: 'nairobiHub',
      supervisor: 'grace',
      assessor: 'faith',
      startDate: '2026-05-01',
      endDate: '2026-08-31',
      isActive: true,
      finalGrade: 'Pending',
    },
    {
      key: 'sharonCurrent',
      student: 'sharon',
      company: 'nakuruAgro',
      supervisor: 'james',
      assessor: 'faith',
      startDate: '2026-04-15',
      endDate: '2026-07-31',
      isActive: true,
      finalGrade: 'Pending',
    },
    {
      key: 'kevinCurrent',
      student: 'kevinStudent',
      company: 'mombasaData',
      supervisor: 'linda',
      assessor: 'kevin',
      startDate: '2026-05-10',
      endDate: '2026-08-10',
      isActive: true,
      finalGrade: 'Pending',
    },
    {
      key: 'faithCompleted',
      student: 'faithStudent',
      company: 'kisumuWorks',
      supervisor: 'grace',
      assessor: 'kevin',
      startDate: '2025-09-01',
      endDate: '2025-12-20',
      isActive: false,
      finalGrade: 'Pass',
    },
  ],
  logs: [
    {
      session: 'brianCurrent',
      student: 'brian',
      date: '2026-05-02T08:10:00.000Z',
      tasksDone: 'Completed workstation setup, antivirus updates, and user orientation checklist for the support desk.',
      skillsLearned: 'Device readiness checks, basic endpoint support, and workplace communication etiquette.',
      longitude: 36.81076,
      latitude: -1.26755,
      distanceFromCompanyMeters: 9,
      supervisorStatus: 'Approved',
      supervisorComment: 'Well documented. Keep identifying the tools you use for each support task.',
      idempotencyKey: 'seed-brian-001',
    },
    {
      session: 'brianCurrent',
      student: 'brian',
      date: '2026-05-03T09:05:00.000Z',
      tasksDone: 'Updated printer inventory, tagged faulty switches, and assisted with local network troubleshooting.',
      skillsLearned: 'Asset tracking, first-level troubleshooting, and communicating technical issues to staff.',
      longitude: 36.81072,
      latitude: -1.26763,
      distanceFromCompanyMeters: 7,
      supervisorStatus: 'Approved',
      supervisorComment: 'Good progress. Add ticket numbers next time for stronger traceability.',
      idempotencyKey: 'seed-brian-002',
    },
    {
      session: 'brianCurrent',
      student: 'brian',
      date: '2026-05-04T10:40:00.000Z',
      tasksDone: 'Helped test internet redundancy but mixed several activities into one short summary.',
      skillsLearned: 'Observed failover testing and reporting steps.',
      longitude: 36.81081,
      latitude: -1.26758,
      distanceFromCompanyMeters: 4,
      supervisorStatus: 'Rejected',
      supervisorComment: 'Break this into separate tasks and explain the final outcome of the failover test.',
      idempotencyKey: 'seed-brian-003',
    },
    {
      session: 'brianCurrent',
      student: 'brian',
      date: '2026-05-05T11:20:00.000Z',
      tasksDone: 'Prepared backup verification notes and cross-checked user access requests against team procedures.',
      skillsLearned: 'Backup validation, access control workflow, and audit awareness.',
      longitude: 36.81084,
      latitude: -1.2676,
      distanceFromCompanyMeters: 5,
      supervisorStatus: 'Pending',
      supervisorComment: '',
      idempotencyKey: 'seed-brian-004',
    },
    {
      session: 'sharonCurrent',
      student: 'sharon',
      date: '2026-04-16T07:50:00.000Z',
      tasksDone: 'Captured inventory data for fertilizer blending inputs and reconciled stock cards with the warehouse clerk.',
      skillsLearned: 'Inventory reconciliation, stock record handling, and process accuracy checks.',
      longitude: 36.07995,
      latitude: -0.30314,
      distanceFromCompanyMeters: 8,
      supervisorStatus: 'Approved',
      supervisorComment: 'Accurate entry. Continue linking the activity to the production workflow.',
      idempotencyKey: 'seed-sharon-001',
    },
    {
      session: 'sharonCurrent',
      student: 'sharon',
      date: '2026-04-17T08:20:00.000Z',
      tasksDone: 'Observed weighing and batching steps, then entered sample production totals into the reporting sheet.',
      skillsLearned: 'Production data capture, spreadsheet handling, and understanding process checkpoints.',
      longitude: 36.08002,
      latitude: -0.30308,
      distanceFromCompanyMeters: 6,
      supervisorStatus: 'Approved',
      supervisorComment: 'Strong practical detail. Keep documenting the figures and variances you observe.',
      idempotencyKey: 'seed-sharon-002',
    },
    {
      session: 'sharonCurrent',
      student: 'sharon',
      date: '2026-04-18T09:10:00.000Z',
      tasksDone: 'Drafted the daily summary for the line supervisor and helped file quality assurance forms.',
      skillsLearned: 'Operational reporting, document control, and compliance support.',
      longitude: 36.08012,
      latitude: -0.3032,
      distanceFromCompanyMeters: 16,
      supervisorStatus: 'Pending',
      supervisorComment: '',
      idempotencyKey: 'seed-sharon-003',
    },
    {
      session: 'kevinCurrent',
      student: 'kevinStudent',
      date: '2026-05-11T08:00:00.000Z',
      tasksDone: 'Reviewed service desk procedures, reset user passwords, and logged incoming support requests.',
      skillsLearned: 'Ticket intake, identity verification, and handling user support requests professionally.',
      longitude: 39.66812,
      latitude: -4.04344,
      distanceFromCompanyMeters: 11,
      supervisorStatus: 'Rejected',
      supervisorComment: 'List the systems you used and describe how each password reset request was verified.',
      idempotencyKey: 'seed-kevin-001',
    },
    {
      session: 'kevinCurrent',
      student: 'kevinStudent',
      date: '2026-05-12T10:05:00.000Z',
      tasksDone: 'Escalated unresolved email access issues and prepared a checklist for common support incidents.',
      skillsLearned: 'Issue escalation, documenting repeat problems, and standardizing response steps.',
      longitude: 39.6683,
      latitude: -4.04357,
      distanceFromCompanyMeters: 14,
      supervisorStatus: 'Pending',
      supervisorComment: '',
      idempotencyKey: 'seed-kevin-002',
    },
    {
      session: 'faithCompleted',
      student: 'faithStudent',
      date: '2025-09-03T07:40:00.000Z',
      tasksDone: 'Configured shared folders for the records unit and verified user permissions with the supervisor.',
      skillsLearned: 'Folder permission mapping, user role checks, and change verification.',
      longitude: 34.76805,
      latitude: -0.09168,
      distanceFromCompanyMeters: 7,
      supervisorStatus: 'Approved',
      supervisorComment: 'Excellent start and accurate technical detail.',
      idempotencyKey: 'seed-faith-001',
    },
    {
      session: 'faithCompleted',
      student: 'faithStudent',
      date: '2025-09-04T09:10:00.000Z',
      tasksDone: 'Prepared equipment issue summaries, followed up on repairs, and updated the maintenance register.',
      skillsLearned: 'Incident follow-up, maintenance tracking, and concise technical reporting.',
      longitude: 34.76816,
      latitude: -0.09175,
      distanceFromCompanyMeters: 18,
      supervisorStatus: 'Approved',
      supervisorComment: 'Clear evidence of growth in reporting quality.',
      idempotencyKey: 'seed-faith-002',
    },
    {
      session: 'faithCompleted',
      student: 'faithStudent',
      date: '2025-09-05T10:25:00.000Z',
      tasksDone: 'Helped reconcile daily network uptime notes and generated a short summary for the ICT office.',
      skillsLearned: 'Basic network monitoring, daily reporting, and identifying recurring service trends.',
      longitude: 34.76821,
      latitude: -0.09162,
      distanceFromCompanyMeters: 22,
      supervisorStatus: 'Approved',
      supervisorComment: 'Consistent documentation with strong workplace relevance.',
      idempotencyKey: 'seed-faith-003',
    },
    {
      session: 'faithCompleted',
      student: 'faithStudent',
      date: '2025-09-08T11:15:00.000Z',
      tasksDone: 'Compiled a weekly progress summary, highlighted key tasks completed, and reflected on challenges faced.',
      skillsLearned: 'Weekly reflection, structured summary writing, and progress evaluation.',
      longitude: 34.76794,
      latitude: -0.09179,
      distanceFromCompanyMeters: 12,
      supervisorStatus: 'Approved',
      supervisorComment: 'Ready for assessor review. Strong attachment performance overall.',
      idempotencyKey: 'seed-faith-004',
    },
  ],
};

function buildPoint(longitude, latitude) {
  return {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
}

async function createUsers(definitions) {
  const created = {};

  for (const definition of definitions) {
    const user = await User.create({
      name: definition.name,
      email: definition.email,
      password: definition.password,
      role: definition.role,
      registrationNumber: definition.registrationNumber,
      department: definition.department,
      mustChangePassword: false,
    });

    created[definition.key] = user;
  }

  return created;
}

async function createCompanies(definitions) {
  const created = {};

  for (const definition of definitions) {
    const company = await Company.create({
      name: definition.name,
      address: definition.address,
      location: buildPoint(definition.longitude, definition.latitude),
      allowedRadiusMeters: definition.allowedRadiusMeters,
    });

    created[definition.key] = company;
  }

  return created;
}

async function createSessions(definitions, users, companies) {
  const created = {};

  for (const definition of definitions) {
    const session = await AttachmentSession.create({
      student: users[definition.student]._id,
      company: companies[definition.company]._id,
      supervisor: users[definition.supervisor]._id,
      assessor: users[definition.assessor]._id,
      startDate: new Date(definition.startDate),
      endDate: new Date(definition.endDate),
      isActive: definition.isActive,
      finalGrade: definition.finalGrade,
    });

    created[definition.key] = session;
  }

  return created;
}

async function createLogs(definitions, users, sessions) {
  const payload = definitions.map((definition) => ({
    session: sessions[definition.session]._id,
    student: users[definition.student]._id,
    date: new Date(definition.date),
    tasksDone: definition.tasksDone,
    skillsLearned: definition.skillsLearned,
    submissionLocation: buildPoint(definition.longitude, definition.latitude),
    distanceFromCompanyMeters: definition.distanceFromCompanyMeters,
    isWithinBoundary: true,
    supervisorStatus: definition.supervisorStatus,
    supervisorComment: definition.supervisorComment,
    idempotencyKey: definition.idempotencyKey,
  }));

  await LogbookEntry.insertMany(payload);
}

async function clearApplicationCollections() {
  await LogbookEntry.deleteMany({});
  await AttachmentSession.deleteMany({});
  await Company.deleteMany({});
  await User.deleteMany({});
}

function printCredentials(label, users) {
  console.log(`\n${label}`);

  users.forEach((user) => {
    console.log(`${user.role.padEnd(11)} ${user.email} / ${user.password}`);
  });
}

async function seedTestData() {
  await connectDB();

  try {
    await clearApplicationCollections();

    const admins = await createUsers(SEED.admins);
    const supervisors = await createUsers(SEED.supervisors);
    const assessors = await createUsers(SEED.assessors);
    const students = await createUsers(SEED.students);
    const users = { ...admins, ...supervisors, ...assessors, ...students };

    const companies = await createCompanies(SEED.companies);
    const sessions = await createSessions(SEED.sessions, users, companies);
    await createLogs(SEED.logs, users, sessions);

    const [userCount, companyCount, sessionCount, logCount] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      AttachmentSession.countDocuments(),
      LogbookEntry.countDocuments(),
    ]);

    console.log('KaziLog test data reset completed successfully.');
    console.log(`Users: ${userCount}`);
    console.log(`Companies: ${companyCount}`);
    console.log(`Attachment sessions: ${sessionCount}`);
    console.log(`Logbook entries: ${logCount}`);

    printCredentials('Admin accounts', SEED.admins);
    printCredentials('Supervisor accounts', SEED.supervisors);
    printCredentials('Assessor accounts', SEED.assessors);
    printCredentials('Student accounts', SEED.students);

    console.log('\nSeeded scenarios');
    console.log('1. Brian Odhiambo -> Active Nairobi ICT attachment with approved, rejected, and pending logs.');
    console.log('2. Sharon Chepkemoi -> Active Nakuru operations attachment with approved and pending logs.');
    console.log('3. Kevin Musyoka -> Active Mombasa support attachment with rejected and pending logs.');
    console.log('4. Faith Wambui -> Completed Kisumu attachment with fully approved logs and a final pass result.');
  } catch (error) {
    console.error('Failed to seed test data:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedTestData();

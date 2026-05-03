require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Company = require('./src/models/Company');
const AttachmentSession = require('./src/models/AttachmentSession');
const LogbookEntry = require('./src/models/LogbookEntry');

const DEMO = {
  admin: {
    name: 'KaziLog Demo Admin',
    email: 'admin.demo@kazilog.com',
    password: 'AdminDemo1!',
    role: 'admin',
  },
  supervisor: {
    name: 'Mercy Wanjiku',
    email: 'supervisor.demo@kazilog.com',
    password: 'Supervisor1!',
    role: 'supervisor',
  },
  assessor: {
    name: 'Dr. Peter Otieno',
    email: 'assessor.demo@kazilog.com',
    password: 'Assessor1!',
    role: 'assessor',
  },
  student: {
    name: 'Amina Njeri',
    email: 'student.demo@kazilog.com',
    password: 'Student1!',
    role: 'student',
    registrationNumber: 'TVET-ATT-2026-001',
    department: 'Information Technology',
  },
  company: {
    name: 'KaziLog Demo Works',
    address: 'Westlands Road, Nairobi, Kenya',
    latitude: -1.2676,
    longitude: 36.8108,
    allowedRadiusMeters: 200,
  },
};

async function upsertUser(config) {
  let user = await User.findOne({ email: config.email }).select('+password');

  if (!user) {
    user = new User(config);
  } else {
    user.name = config.name;
    user.email = config.email;
    user.password = config.password;
    user.role = config.role;
    user.registrationNumber = config.registrationNumber;
    user.department = config.department;
  }

  user.mustChangePassword = false;
  await user.save();
  return user;
}

async function resetDemoData({ student, company }) {
  const existingCompany = await Company.findOne({ name: company.name });

  await LogbookEntry.deleteMany({ student: student._id });
  await AttachmentSession.deleteMany({ student: student._id });

  if (existingCompany) {
    await AttachmentSession.deleteMany({ company: existingCompany._id });
    await Company.deleteOne({ _id: existingCompany._id });
  }
}

async function seedDemoScenario() {
  await connectDB();

  try {
    const admin = await upsertUser(DEMO.admin);
    const supervisor = await upsertUser(DEMO.supervisor);
    const assessor = await upsertUser(DEMO.assessor);
    const student = await upsertUser(DEMO.student);

    await resetDemoData({ student, company: DEMO.company });

    const company = await Company.create({
      name: DEMO.company.name,
      address: DEMO.company.address,
      location: {
        type: 'Point',
        coordinates: [DEMO.company.longitude, DEMO.company.latitude],
      },
      allowedRadiusMeters: DEMO.company.allowedRadiusMeters,
    });

    const session = await AttachmentSession.create({
      student: student._id,
      company: company._id,
      supervisor: supervisor._id,
      assessor: assessor._id,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-08-31'),
      isActive: true,
      finalGrade: 'Pending',
    });

    const baseLocation = {
      type: 'Point',
      coordinates: [DEMO.company.longitude, DEMO.company.latitude],
    };

    await LogbookEntry.insertMany([
      {
        session: session._id,
        student: student._id,
        date: new Date('2026-05-02T08:15:00.000Z'),
        tasksDone: 'Configured the workstation, reviewed department safety procedures, and shadowed the ICT support desk.',
        skillsLearned: 'Orientation to workplace reporting, ticket handling, and equipment check-in procedures.',
        submissionLocation: baseLocation,
        distanceFromCompanyMeters: 12,
        isWithinBoundary: true,
        supervisorStatus: 'Approved',
        supervisorComment: 'Strong start. Continue documenting the specific systems you touched each day.',
        idempotencyKey: 'demo-approved-log-1',
      },
      {
        session: session._id,
        student: student._id,
        date: new Date('2026-05-03T09:05:00.000Z'),
        tasksDone: 'Updated printer inventory and assisted with Ethernet troubleshooting on the second floor.',
        skillsLearned: 'Basic cable testing, asset tracking, and communicating incident updates to users.',
        submissionLocation: baseLocation,
        distanceFromCompanyMeters: 8,
        isWithinBoundary: true,
        supervisorStatus: 'Rejected',
        supervisorComment: 'Please split separate tasks more clearly and include the issue resolution outcome.',
        idempotencyKey: 'demo-rejected-log-1',
      },
      {
        session: session._id,
        student: student._id,
        date: new Date('2026-05-04T11:10:00.000Z'),
        tasksDone: 'Prepared daily backup reports and helped verify new user account creation requests.',
        skillsLearned: 'Backup verification, access request handling, and audit trail awareness.',
        submissionLocation: baseLocation,
        distanceFromCompanyMeters: 15,
        isWithinBoundary: true,
        supervisorStatus: 'Pending',
        supervisorComment: '',
        idempotencyKey: 'demo-pending-log-1',
      },
    ]);

    console.log('Demo data seeded successfully.\n');
    console.log('Dashboard credentials:');
    console.log(`Admin      ${DEMO.admin.email} / ${DEMO.admin.password}`);
    console.log(`Supervisor ${DEMO.supervisor.email} / ${DEMO.supervisor.password}`);
    console.log(`Assessor   ${DEMO.assessor.email} / ${DEMO.assessor.password}`);
    console.log('\nMobile credentials:');
    console.log(`Student    ${DEMO.student.email} / ${DEMO.student.password}`);
    console.log('\nDemo company geofence:');
    console.log(`${DEMO.company.name} (${DEMO.company.latitude}, ${DEMO.company.longitude}) radius ${DEMO.company.allowedRadiusMeters}m`);
    console.log(`Active session id: ${session._id}`);
    console.log(`Company id: ${company._id}`);
    console.log(`Student id: ${student._id}`);
    console.log(`Supervisor id: ${supervisor._id}`);
    console.log(`Assessor id: ${assessor._id}`);
    console.log(`Admin id: ${admin._id}`);
  } catch (error) {
    console.error('Failed to seed demo data:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedDemoScenario();

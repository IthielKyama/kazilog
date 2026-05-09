const asyncHandler = require('../utils/asyncHandler');
const LogbookEntry = require('../models/LogbookEntry');
const AttachmentSession = require('../models/AttachmentSession');
const Company = require('../models/Company');
const { calculateDistance } = require('../utils/geofence');
const { streamSessionPdf } = require('../utils/sessionPdf');
const {
  serializeSessionWithLifecycle,
  syncSessionLifecycle,
} = require('../utils/sessionLifecycle');

async function loadSessionWithAccess(sessionId, user, populateFields = []) {
  let query = AttachmentSession.findById(sessionId);
  populateFields.forEach((field) => {
    query = query.populate(field.path, field.select);
  });

  const session = await query;

  if (!session) {
    const error = new Error('Session not found');
    error.statusCode = 404;
    throw error;
  }

  const resolveId = (value) => {
    if (!value) return '';
    if (value._id) return value._id.toString();
    return value.toString();
  };

  const hasAccess = user.role === 'admin'
    || resolveId(session.assessor) === user.id
    || resolveId(session.supervisor) === user.id
    || resolveId(session.student) === user.id;

  if (!hasAccess) {
    const error = new Error('Not authorized to view logs for this session');
    error.statusCode = 403;
    throw error;
  }

  return session;
}

// @desc    Get the active attachment session for the logged-in student
// @route   GET /api/logs/session/active
// @access  Private (Student only)
exports.getActiveStudentSession = asyncHandler(async (req, res) => {
  const session = await AttachmentSession.findOne({
    student: req.user.id,
  })
    .populate('company', 'name address location allowedRadiusMeters')
    .populate('supervisor', 'name email')
    .populate('assessor', 'name email')
    .sort({ isActive: -1, endDate: -1, createdAt: -1 });

  if (!session) {
    res.status(404);
    throw new Error('No active attachment session found for this student');
  }

  const lifecycle = await syncSessionLifecycle(session);

  if (!lifecycle.isActive) {
    res.status(404);
    throw new Error('No active attachment session found for this student');
  }

  res.status(200).json({
    success: true,
    data: serializeSessionWithLifecycle(session),
  });
});

// @desc    Get the latest attachment session for the logged-in student
// @route   GET /api/logs/session/latest
// @access  Private (Student only)
exports.getLatestStudentSession = asyncHandler(async (req, res) => {
  const session = await AttachmentSession.findOne({
    student: req.user.id,
  })
    .populate('company', 'name address location allowedRadiusMeters')
    .populate('supervisor', 'name email')
    .populate('assessor', 'name email')
    .sort({ isActive: -1, endDate: -1, createdAt: -1 });

  if (!session) {
    res.status(404);
    throw new Error('No attachment session found for this student');
  }

  await syncSessionLifecycle(session);

  res.status(200).json({
    success: true,
    data: serializeSessionWithLifecycle(session),
  });
});

// @desc    Submit a daily logbook entry with GPS verification
// @route   POST /api/logs
// @access  Private (Student only)
exports.submitLog = asyncHandler(async (req, res) => {
  let { sessionId, tasksDone, skillsLearned, latitude, longitude, idempotencyKey } = req.body;
  const studentId = req.user.id;

  // Idempotency check: prevent duplicate submissions
  if (idempotencyKey) {
    const existingLog = await LogbookEntry.findOne({ idempotencyKey, student: studentId });
    if (existingLog) {
      return res.status(200).json({
        success: true,
        data: existingLog,
        message: 'Duplicate submission prevented by idempotency key.'
      });
    }
  }

  // If coming from FormData, these will be strings
  if (typeof latitude === 'string') latitude = parseFloat(latitude);
  if (typeof longitude === 'string') longitude = parseFloat(longitude);

  if (!sessionId || !tasksDone || !skillsLearned || latitude === undefined || isNaN(latitude) || longitude === undefined || isNaN(longitude)) {
    res.status(400);
    throw new Error('Please provide all required fields including GPS coordinates');
  }

  // Verify the session belongs to the student and is active
  const session = await AttachmentSession.findOne({
    _id: sessionId,
    student: studentId,
    isActive: true
  }).populate('company');

  if (!session) {
    res.status(404);
    throw new Error('Active attachment session not found');
  }

  const lifecycle = await syncSessionLifecycle(session);
  if (!lifecycle.isActive) {
    res.status(400);
    throw new Error('This attachment session has already been completed and is awaiting grading.');
  }

  const company = session.company;
  
  // The company model stores coordinates as [longitude, latitude] in GeoJSON format
  const companyLon = company.location.coordinates[0];
  const companyLat = company.location.coordinates[1];

  // Calculate distance in meters
  const distance = calculateDistance(latitude, longitude, companyLat, companyLon);
  
  const allowedRadius = company.allowedRadiusMeters || 200;
  const isWithinBoundary = distance <= allowedRadius;

  if (!isWithinBoundary) {
    res.status(403);
    throw new Error(`Geofence failed. You are ${Math.round(distance)} meters away from the workplace. Allowed radius is ${allowedRadius} meters.`);
  }

  // Create logbook entry
  const logEntry = await LogbookEntry.create({
    session: sessionId,
    student: studentId,
    tasksDone,
    skillsLearned,
    submissionLocation: {
      type: 'Point',
      coordinates: [longitude, latitude] // GeoJSON format: [lon, lat]
    },
    distanceFromCompanyMeters: distance,
    isWithinBoundary,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    idempotencyKey
  });

  res.status(201).json({
    success: true,
    data: logEntry
  });
});

// @desc    Get all logs for the logged-in student
// @route   GET /api/logs/student
// @access  Private (Student only)
exports.getStudentLogs = asyncHandler(async (req, res) => {
  const filter = { student: req.user.id };

  if (req.query.sessionId) {
    const session = await AttachmentSession.findOne({
      _id: req.query.sessionId,
      student: req.user.id,
    }).select('_id');

    if (!session) {
      res.status(404);
      throw new Error('Attachment session not found for this student');
    }

    filter.session = session._id;
  }

  const logs = await LogbookEntry.find(filter).sort('-date');
  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Get logs for a supervisor to review
// @route   GET /api/logs/supervisor
// @access  Private (Supervisor only)
exports.getSupervisorLogs = asyncHandler(async (req, res) => {
  // Find sessions where this user is the supervisor
  const sessions = await AttachmentSession.find({ supervisor: req.user.id }).select('_id');
  const sessionIds = sessions.map(s => s._id);

  const filter = { session: { $in: sessionIds } };
  
  if (req.query.status && req.query.status !== 'All') {
    filter.supervisorStatus = req.query.status;
  } else if (!req.query.status) {
    filter.supervisorStatus = 'Pending';
  }

  // Find logs belonging to these sessions
  const logs = await LogbookEntry.find(filter)
    .populate('student', 'name email registrationNumber')
    .sort('-date');

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Get sessions for a supervisor workspace
// @route   GET /api/logs/supervisor/sessions
// @access  Private (Supervisor only)
exports.getSupervisorSessions = asyncHandler(async (req, res) => {
  const sessions = await AttachmentSession.find({ supervisor: req.user.id })
    .populate('student', 'name email registrationNumber')
    .populate('company', 'name')
    .populate('supervisor', 'name email')
    .populate('assessor', 'name email')
    .sort({ endDate: -1, createdAt: -1 });

  const sessionsWithStats = await Promise.all(sessions.map(async (session) => {
    await syncSessionLifecycle(session);

    const totalLogs = await LogbookEntry.countDocuments({ session: session._id });
    const approvedLogs = await LogbookEntry.countDocuments({ session: session._id, supervisorStatus: 'Approved' });
    const rejectedLogs = await LogbookEntry.countDocuments({ session: session._id, supervisorStatus: 'Rejected' });
    const pendingLogs = totalLogs - approvedLogs - rejectedLogs;

    return serializeSessionWithLifecycle(session, {
      stats: { totalLogs, approvedLogs, rejectedLogs, pendingLogs },
    });
  }));

  res.status(200).json({
    success: true,
    data: sessionsWithStats,
  });
});

// @desc    Approve or reject a log
// @route   PUT /api/logs/:id/review
// @access  Private (Supervisor only)
exports.reviewLog = asyncHandler(async (req, res) => {
  const { status, comment } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    res.status(400);
    throw new Error('Status must be Approved or Rejected');
  }

  const log = await LogbookEntry.findById(req.params.id);

  if (!log) {
    res.status(404);
    throw new Error('Log not found');
  }

  // Verify the supervisor has access to this log
  const session = await AttachmentSession.findOne({
    _id: log.session,
    supervisor: req.user.id
  });

  if (!session) {
    res.status(403);
    throw new Error('You are not authorized to review this log');
  }

  log.supervisorStatus = status;
  log.supervisorComment = comment || '';
  await log.save();

  res.status(200).json({
    success: true,
    data: log
  });
});

// @desc    Get logs for a specific session
// @route   GET /api/logs/session/:sessionId
// @access  Private (Assessor or Supervisor)
exports.getSessionLogs = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  const session = await loadSessionWithAccess(sessionId, req.user);
  await syncSessionLifecycle(session);

  const logs = await LogbookEntry.find({ session: sessionId }).sort('-date');

  res.status(200).json({
    success: true,
    count: logs.length,
    session: serializeSessionWithLifecycle(session),
    data: logs
  });
});

// @desc    Download all logs for a specific attachment session
// @route   GET /api/logs/session/:sessionId/export
// @access  Private (Assessor or Supervisor or Admin)
exports.exportSessionLogsPdf = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await loadSessionWithAccess(sessionId, req.user, [
    { path: 'student', select: 'name email registrationNumber' },
    { path: 'company', select: 'name address' },
    { path: 'supervisor', select: 'name email' },
    { path: 'assessor', select: 'name email' },
  ]);

  await syncSessionLifecycle(session);

  const logs = await LogbookEntry.find({ session: sessionId }).sort({ date: 1, createdAt: 1 });

  streamSessionPdf(res, {
    session: serializeSessionWithLifecycle(session),
    logs,
    exportedByRole: req.user.role,
    exportedByName: req.user.name,
  });
});

const asyncHandler = require('../utils/asyncHandler');
const LogbookEntry = require('../models/LogbookEntry');
const AttachmentSession = require('../models/AttachmentSession');
const Company = require('../models/Company');
const { calculateDistance } = require('../utils/geofence');

// @desc    Get the active attachment session for the logged-in student
// @route   GET /api/logs/session/active
// @access  Private (Student only)
exports.getActiveStudentSession = asyncHandler(async (req, res) => {
  const session = await AttachmentSession.findOne({
    student: req.user.id,
    isActive: true,
  })
    .populate('company', 'name address location allowedRadiusMeters')
    .populate('supervisor', 'name email')
    .populate('assessor', 'name email')
    .sort('-createdAt');

  if (!session) {
    res.status(404);
    throw new Error('No active attachment session found for this student');
  }

  res.status(200).json({
    success: true,
    data: session,
  });
});

// @desc    Submit a daily logbook entry with GPS verification
// @route   POST /api/logs
// @access  Private (Student only)
exports.submitLog = asyncHandler(async (req, res) => {
  const { sessionId, tasksDone, skillsLearned, latitude, longitude } = req.body;
  const studentId = req.user.id;

  if (!sessionId || !tasksDone || !skillsLearned || latitude === undefined || longitude === undefined) {
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
    isWithinBoundary
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
  const logs = await LogbookEntry.find({ student: req.user.id }).sort('-date');
  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Get pending logs for a supervisor to review
// @route   GET /api/logs/supervisor
// @access  Private (Supervisor only)
exports.getSupervisorLogs = asyncHandler(async (req, res) => {
  // Find sessions where this user is the supervisor
  const sessions = await AttachmentSession.find({ supervisor: req.user.id }).select('_id');
  const sessionIds = sessions.map(s => s._id);

  // Find logs belonging to these sessions
  const logs = await LogbookEntry.find({ 
    session: { $in: sessionIds },
    supervisorStatus: 'Pending'
  }).populate('student', 'name email registrationNumber').sort('date');

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
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

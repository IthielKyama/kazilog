const asyncHandler = require('../utils/asyncHandler');
const AttachmentSession = require('../models/AttachmentSession');
const LogbookEntry = require('../models/LogbookEntry');
const {
  normalizeFinalGradeValue,
  serializeSessionWithLifecycle,
  syncSessionLifecycle,
} = require('../utils/sessionLifecycle');

// @desc    Get all sessions/students assigned to this assessor
// @route   GET /api/assessor/sessions
// @access  Private (Assessor only)
exports.getAssignedSessions = asyncHandler(async (req, res) => {
  const sessions = await AttachmentSession.find({ assessor: req.user.id })
    .populate('student', 'name email registrationNumber')
    .populate('company', 'name')
    .populate('supervisor', 'name email')
    .populate('assessor', 'name email');
    
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

  res.status(200).json({ success: true, data: sessionsWithStats });
});

// @desc    Grade a session
// @route   PUT /api/assessor/sessions/:id/grade
// @access  Private (Assessor only)
exports.gradeSession = asyncHandler(async (req, res) => {
  const rawFinalGrade = typeof req.body.finalGrade === 'string' ? req.body.finalGrade.trim().toLowerCase() : '';
  if (!['pending', 'pass', 'fail'].includes(rawFinalGrade)) {
    res.status(400);
    throw new Error('Invalid grade');
  }

  const finalGrade = normalizeFinalGradeValue(req.body.finalGrade);
  
  const session = await AttachmentSession.findOne({ 
    _id: req.params.id, 
    assessor: req.user.id 
  })
    .populate('student', 'name email registrationNumber')
    .populate('company', 'name')
    .populate('supervisor', 'name email')
    .populate('assessor', 'name email');

  if (!session) {
    res.status(404);
    throw new Error('Session not found or you are not authorized to grade this student');
  }

  if (session.finalGrade !== 'Pending' && session.finalGrade) {
    res.status(400);
    throw new Error('This session has already been graded and cannot be changed');
  }

  session.finalGrade = finalGrade;
  await session.save();
  const lifecycle = await syncSessionLifecycle(session);

  const totalLogs = await LogbookEntry.countDocuments({ session: session._id });
  const approvedLogs = await LogbookEntry.countDocuments({ session: session._id, supervisorStatus: 'Approved' });
  const rejectedLogs = await LogbookEntry.countDocuments({ session: session._id, supervisorStatus: 'Rejected' });
  const pendingLogs = totalLogs - approvedLogs - rejectedLogs;

  res.status(200).json({
    success: true,
    data: serializeSessionWithLifecycle(session, {
      stats: { totalLogs, approvedLogs, rejectedLogs, pendingLogs },
    }),
    message: lifecycle.sessionStatus,
  });
});

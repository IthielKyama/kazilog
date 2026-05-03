const asyncHandler = require('../utils/asyncHandler');
const AttachmentSession = require('../models/AttachmentSession');
const LogbookEntry = require('../models/LogbookEntry');

// @desc    Get all sessions/students assigned to this assessor
// @route   GET /api/assessor/sessions
// @access  Private (Assessor only)
exports.getAssignedSessions = asyncHandler(async (req, res) => {
  const sessions = await AttachmentSession.find({ assessor: req.user.id })
    .populate('student', 'name email registrationNumber')
    .populate('company', 'name');
    
  // For each session, fetch the total number of approved logs to show progress
  const sessionsWithStats = await Promise.all(sessions.map(async (session) => {
    const totalLogs = await LogbookEntry.countDocuments({ session: session._id });
    const approvedLogs = await LogbookEntry.countDocuments({ session: session._id, supervisorStatus: 'Approved' });
    const rejectedLogs = await LogbookEntry.countDocuments({ session: session._id, supervisorStatus: 'Rejected' });
    
    return {
      ...session.toObject(),
      stats: { totalLogs, approvedLogs, rejectedLogs }
    };
  }));

  res.status(200).json({ success: true, data: sessionsWithStats });
});

// @desc    Grade a session
// @route   PUT /api/assessor/sessions/:id/grade
// @access  Private (Assessor only)
exports.gradeSession = asyncHandler(async (req, res) => {
  const { finalGrade } = req.body;
  
  if (!['A', 'B', 'C', 'D', 'E', 'F', 'Pending'].includes(finalGrade)) {
    res.status(400);
    throw new Error('Invalid grade');
  }

  const session = await AttachmentSession.findOne({ 
    _id: req.params.id, 
    assessor: req.user.id 
  });

  if (!session) {
    res.status(404);
    throw new Error('Session not found or you are not authorized to grade this student');
  }

  session.finalGrade = finalGrade;
  
  // If a final grade (not Pending) is given, the attachment is essentially completed.
  if(finalGrade !== 'Pending') {
     session.isActive = false; 
  }

  await session.save();

  res.status(200).json({ success: true, data: session });
});

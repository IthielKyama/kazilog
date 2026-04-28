const express = require('express');
const router = express.Router();
const {
  submitLog,
  getActiveStudentSession,
  getStudentLogs,
  getSupervisorLogs,
  reviewLog,
  getSessionLogs
} = require('../controllers/logbookController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(protect);

// Student routes
router.get('/session/active', authorize('student'), getActiveStudentSession);
router.post('/', authorize('student'), submitLog);
router.get('/student', authorize('student'), getStudentLogs);

// Supervisor routes
router.get('/supervisor', authorize('supervisor'), getSupervisorLogs);
router.put('/:id/review', authorize('supervisor'), reviewLog);

// Assessor & Supervisor routes
router.get('/session/:sessionId', authorize('supervisor', 'assessor', 'admin'), getSessionLogs);

module.exports = router;

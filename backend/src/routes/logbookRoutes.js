const express = require('express');
const router = express.Router();
const {
  submitLog,
  getStudentLogs,
  getSupervisorLogs,
  reviewLog
} = require('../controllers/logbookController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(protect);

// Student routes
router.post('/', authorize('student'), submitLog);
router.get('/student', authorize('student'), getStudentLogs);

// Supervisor routes
router.get('/supervisor', authorize('supervisor'), getSupervisorLogs);
router.put('/:id/review', authorize('supervisor'), reviewLog);

module.exports = router;

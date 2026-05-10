const express = require('express');
const router = express.Router();
const {
  submitLog,
  getActiveStudentSession,
  getLatestStudentSession,
  getStudentLogs,
  getSupervisorLogs,
  getSupervisorSessions,
  reviewLog,
  getSessionLogs,
  exportSessionLogsPdf,
} = require('../controllers/logbookController');

const { protect, authorize } = require('../middlewares/authMiddleware');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// All routes are protected
router.use(protect);

// Student routes
router.get('/session/active', authorize('student'), getActiveStudentSession);
router.get('/session/latest', authorize('student'), getLatestStudentSession);
router.post('/', authorize('student'), upload.single('image'), submitLog);
router.get('/student', authorize('student'), getStudentLogs);

// Supervisor routes
router.get('/supervisor', authorize('supervisor'), getSupervisorLogs);
router.get('/supervisor/sessions', authorize('supervisor'), getSupervisorSessions);
router.put('/:id/review', authorize('supervisor'), reviewLog);

// Assessor, Supervisor, Admin, & Student routes
router.get('/session/:sessionId/export', authorize('supervisor', 'assessor', 'admin', 'student'), exportSessionLogsPdf);
router.get('/session/:sessionId', authorize('supervisor', 'assessor', 'admin', 'student'), getSessionLogs);

module.exports = router;

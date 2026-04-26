const express = require('express');
const router = express.Router();
const {
  getAssignedSessions,
  gradeSession
} = require('../controllers/assessorController');

const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('assessor', 'admin'));

router.route('/sessions')
  .get(getAssignedSessions);

router.route('/sessions/:id/grade')
  .put(gradeSession);

module.exports = router;

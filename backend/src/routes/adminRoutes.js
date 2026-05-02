const express = require('express');
const router = express.Router();
const {
  createCompany,
  getCompanies,
  getUsers,
  createSession,
  getSessions
} = require('../controllers/adminController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Protect and restrict all admin routes
router.use(protect);
router.use(authorize('admin'));

router.route('/companies')
  .post(createCompany)
  .get(getCompanies);

router.route('/users')
  .get(getUsers);

router.route('/sessions')
  .post(createSession)
  .get(getSessions);

module.exports = router;

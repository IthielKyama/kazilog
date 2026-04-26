const asyncHandler = require('../utils/asyncHandler');
const Company = require('../models/Company');
const AttachmentSession = require('../models/AttachmentSession');
const User = require('../models/User');

// @desc    Register a new company
// @route   POST /api/admin/companies
// @access  Private (Admin only)
exports.createCompany = asyncHandler(async (req, res) => {
  const { name, address, latitude, longitude, allowedRadiusMeters } = req.body;

  if (!name || !address || latitude === undefined || longitude === undefined) {
    res.status(400);
    throw new Error('Please provide all required fields including GPS coordinates');
  }

  // Check if company exists
  const companyExists = await Company.findOne({ name });
  if (companyExists) {
    res.status(400);
    throw new Error('Company already exists');
  }

  const company = await Company.create({
    name,
    address,
    location: {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)]
    },
    allowedRadiusMeters: allowedRadiusMeters || 200
  });

  res.status(201).json({
    success: true,
    data: company
  });
});

// @desc    Get all companies
// @route   GET /api/admin/companies
// @access  Private (Admin only)
exports.getCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({});
  res.status(200).json({
    success: true,
    data: companies
  });
});

// @desc    Get all users by role
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.status(200).json({
    success: true,
    data: users
  });
});

// @desc    Create an attachment session
// @route   POST /api/admin/sessions
// @access  Private (Admin only)
exports.createSession = asyncHandler(async (req, res) => {
  const { student, company, supervisor, assessor, startDate, endDate } = req.body;

  if (!student || !company || !supervisor || !assessor || !startDate || !endDate) {
    res.status(400);
    throw new Error('Please provide all required session fields');
  }

  const session = await AttachmentSession.create({
    student,
    company,
    supervisor,
    assessor,
    startDate,
    endDate,
    isActive: true
  });

  res.status(201).json({
    success: true,
    data: session
  });
});

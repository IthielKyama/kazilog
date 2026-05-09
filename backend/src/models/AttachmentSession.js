const mongoose = require('mongoose');

const { normalizeFinalGradeValue } = require('../utils/sessionLifecycle');

const attachmentSessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },
  supervisor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  assessor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  finalGrade: {
    type: String,
    enum: ['Pending', 'Pass', 'Fail'],
    default: 'Pending',
    set: normalizeFinalGradeValue,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AttachmentSession', attachmentSessionSchema);

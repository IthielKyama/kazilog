const mongoose = require('mongoose');

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
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'Pending'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AttachmentSession', attachmentSessionSchema);

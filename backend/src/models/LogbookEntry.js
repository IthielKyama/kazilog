const mongoose = require('mongoose');

const logbookEntrySchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.ObjectId,
    ref: 'AttachmentSession',
    required: true
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  tasksDone: {
    type: String,
    required: [true, 'Please describe tasks done']
  },
  skillsLearned: {
    type: String,
    required: [true, 'Please describe skills learned']
  },
  // GPS capture at the time of submission
  submissionLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  distanceFromCompanyMeters: {
    type: Number,
    required: true
  },
  isWithinBoundary: {
    type: Boolean,
    required: true
  },
  supervisorStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  supervisorComment: {
    type: String
  },
  imageUrl: {
    type: String
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true // allows existing records without this key to coexist
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LogbookEntry', logbookEntrySchema);

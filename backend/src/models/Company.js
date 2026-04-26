const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a company name'],
    unique: true
  },
  address: {
    type: String,
    required: [true, 'Please add a company address']
  },
  location: {
    // GeoJSON Point for geofencing
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere' // Required for geospatial queries like $near
    }
  },
  allowedRadiusMeters: {
    type: Number,
    default: 200, // Default 200 meters boundary
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);

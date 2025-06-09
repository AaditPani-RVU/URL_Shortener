const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        // Improved URL validation
        return /^(https?:\/\/)([\w-]+\.)+[\w-]{2,}(\/\S*)?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  shortCode: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  clicks: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Url', UrlSchema);

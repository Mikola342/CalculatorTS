const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  day: {
    type: String,
    required: true,
    enum: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);

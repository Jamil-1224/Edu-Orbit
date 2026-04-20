const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
  bookId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  publisher: String,
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  publicationYear: Number,
  category: {
    type: String,
    enum: ['fiction', 'non-fiction', 'reference', 'academic', 'other'],
    default: 'other'
  },
  quantity: {
    type: Number,
    default: 1
  },
  availableQuantity: {
    type: Number,
    default: 1
  },
  location: String,
  price: Number,
  dateAdded: {
    type: Date,
    default: Date.now
  },
  issues: [{
    issuedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    issuedDate: Date,
    dueDate: Date,
    returnedDate: Date,
    fineAmount: Number,
    status: {
      type: String,
      enum: ['active', 'returned', 'overdue'],
      default: 'active'
    }
  }],
  coverImage: String
});

module.exports = mongoose.model('LibraryBook', librarySchema);

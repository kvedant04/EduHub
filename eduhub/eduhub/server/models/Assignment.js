import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  totalPoints: {
    type: Number,
    default: 100
  },
  attachments: [{
    name: String,
    url: String
  }],
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date,
    files: [{
      name: String,
      url: String
    }],
    text: String,
    grade: Number,
    feedback: String,
    status: {
      type: String,
      enum: ['submitted', 'graded', 'late'],
      default: 'submitted'
    }
  }],
  type: {
    type: String,
    enum: ['assignment', 'quiz', 'test'],
    default: 'assignment'
  },
  questions: [{
    question: String,
    type: {
      type: String,
      enum: ['mcq', 'short', 'long']
    },
    options: [String],
    correctAnswer: String,
    points: Number
  }]
}, {
  timestamps: true
});

export default mongoose.model('Assignment', assignmentSchema);

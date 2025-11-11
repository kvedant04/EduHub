import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 60
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'scheduled'
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date,
    status: {
      type: String,
      enum: ['waiting', 'joined', 'removed']
    }
  }],
  attendance: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    present: Boolean,
    joinTime: Date,
    leaveTime: Date
  }],
  settings: {
    waitingRoom: {
      type: Boolean,
      default: true
    },
    chatEnabled: {
      type: Boolean,
      default: true
    },
    screenShareEnabled: {
      type: Boolean,
      default: true
    },
    recordingEnabled: {
      type: Boolean,
      default: false
    }
  },
  recording: {
    url: String,
    startedAt: Date,
    endedAt: Date
  },
  meetingLink: String
}, {
  timestamps: true
});

export default mongoose.model('Meeting', meetingSchema);

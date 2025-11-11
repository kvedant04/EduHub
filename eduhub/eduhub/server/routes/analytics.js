import express from 'express';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Assignment from '../models/Assignment.js';
import Meeting from '../models/Meeting.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalClasses = await Class.countDocuments();
    const totalMeetings = await Meeting.countDocuments();
    const pendingVerifications = await User.countDocuments({ role: 'teacher', isVerified: false });

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalClasses,
        totalMeetings,
        pendingVerifications
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/teacher/:classId', protect, authorize('teacher'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.classId).populate('students');
    const assignments = await Assignment.find({ class: req.params.classId });
    
    const totalStudents = classData.students.length;
    const totalAssignments = assignments.length;
    const avgSubmissionRate = assignments.reduce((acc, a) => 
      acc + (a.submissions.length / totalStudents), 0) / totalAssignments || 0;

    res.json({
      success: true,
      analytics: {
        totalStudents,
        totalAssignments,
        avgSubmissionRate: (avgSubmissionRate * 100).toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

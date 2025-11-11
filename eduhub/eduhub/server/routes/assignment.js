import express from 'express';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.create({
      ...req.body,
      teacher: req.user.id
    });
    res.status(201).json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/class/:classId', protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({ class: req.params.classId })
      .populate('teacher', 'name email')
      .sort({ dueDate: 1 });

    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('submissions.student', 'name email avatar');

    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === req.user.id
    );

    if (existingSubmission) {
      return res.status(400).json({ message: 'Already submitted' });
    }

    assignment.submissions.push({
      student: req.user.id,
      submittedAt: new Date(),
      ...req.body,
      status: new Date() > assignment.dueDate ? 'late' : 'submitted'
    });

    await assignment.save();

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { xp: 10 }
    });

    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/grade/:submissionId', protect, authorize('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    const submission = assignment.submissions.id(req.params.submissionId);
    
    submission.grade = req.body.grade;
    submission.feedback = req.body.feedback;
    submission.status = 'graded';

    await assignment.save();

    const xpGained = Math.floor((req.body.grade / assignment.totalPoints) * 50);
    await User.findByIdAndUpdate(submission.student, {
      $inc: { xp: xpGained }
    });

    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

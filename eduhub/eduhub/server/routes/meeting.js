import express from 'express';
import Meeting from '../models/Meeting.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const meeting = await Meeting.create({
      ...req.body,
      host: req.user.id
    });
    res.status(201).json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    let meetings = [];
    
    if (req.user.role === 'teacher') {
      meetings = await Meeting.find({ host: req.user.id })
        .populate('host', 'name email')
        .populate('class', 'title')
        .sort({ scheduledAt: 1 });
    } else if (req.user.role === 'student') {
      const Class = (await import('../models/Class.js')).default;
      const enrolledClasses = await Class.find({ students: req.user.id }).select('_id');
      const classIds = enrolledClasses.map(c => c._id);
      
      meetings = await Meeting.find({ class: { $in: classIds } })
        .populate('host', 'name email')
        .populate('class', 'title')
        .sort({ scheduledAt: 1 });
    }

    res.json({ success: true, meetings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'name email avatar')
      .populate('class')
      .populate('participants.user', 'name email avatar');

    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/status', protect, authorize('teacher'), async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, host: req.user.id },
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/attendance', protect, authorize('teacher'), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    meeting.attendance.push(req.body);
    await meeting.save();
    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

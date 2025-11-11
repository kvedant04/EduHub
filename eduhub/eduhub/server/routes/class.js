import express from 'express';
import Class from '../models/Class.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const classData = await Class.create({
      ...req.body,
      teacher: req.user.id
    });

    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdClasses: classData._id }
    });

    res.status(201).json({ success: true, class: classData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query = { students: req.user.id };
    } else if (req.user.role === 'teacher') {
      query = { teacher: req.user.id };
    }

    const classes = await Class.find(query)
      .populate('teacher', 'name email avatar')
      .populate('students', 'name email avatar');

    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('teacher', 'name email avatar')
      .populate('students', 'name email avatar xp level');

    res.json({ success: true, class: classData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/join/:code', protect, authorize('student'), async (req, res) => {
  try {
    const classData = await Class.findOne({ code: req.params.code.toUpperCase() });
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found with this code' });
    }
    
    if (classData.students.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already enrolled in this class' });
    }

    classData.students.push(req.user.id);
    await classData.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: { enrolledClasses: classData._id }
    });

    res.json({ success: true, class: classData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/join', protect, authorize('student'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    if (classData.students.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    classData.students.push(req.user.id);
    await classData.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: { enrolledClasses: classData._id }
    });

    res.json({ success: true, class: classData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/announcement', protect, authorize('teacher'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    
    if (classData.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    classData.announcements.unshift(req.body);
    await classData.save();

    res.json({ success: true, class: classData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const classData = await Class.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!classData) {
      return res.status(404).json({ message: 'Class not found or not authorized' });
    }

    res.json({ success: true, class: classData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add student(s) to class (teacher only)
router.post('/:id/students', protect, authorize('teacher'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) return res.status(404).json({ message: 'Class not found' });
    if (classData.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { userId, email } = req.body;
    let student = null;
    if (userId) {
      student = await User.findById(userId);
    } else if (email) {
      student = await User.findOne({ email: email.toLowerCase() });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (student.role !== 'student') {
      return res.status(400).json({ message: 'Only students can be enrolled' });
    }

    const alreadyEnrolled = classData.students.some(s => s.toString() === student._id.toString());
    if (!alreadyEnrolled) {
      classData.students.push(student._id);
      await classData.save();
      await User.findByIdAndUpdate(student._id, { $addToSet: { enrolledClasses: classData._id } });
    }

    const populated = await Class.findById(classData._id)
      .populate('teacher', 'name email avatar')
      .populate('students', 'name email avatar xp level');

    res.json({ success: true, class: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove student from class (teacher only)
router.delete('/:id/students/:studentId', protect, authorize('teacher'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) return res.status(404).json({ message: 'Class not found' });
    if (classData.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const studentId = req.params.studentId;
    classData.students = classData.students.filter(s => s.toString() !== studentId);
    await classData.save();
    await User.findByIdAndUpdate(studentId, { $pull: { enrolledClasses: classData._id } });

    const populated = await Class.findById(classData._id)
      .populate('teacher', 'name email avatar')
      .populate('students', 'name email avatar xp level');

    res.json({ success: true, class: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Class deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

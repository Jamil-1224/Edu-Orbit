const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateRegister = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'teacher', 'student', 'parent']).withMessage('Invalid role')
];

const validateLogin = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').exists().withMessage('Password is required')
];

const buildEmployeeId = () => `TCH-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
const getAcademicYear = () => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
};

const ensureDefaultClass = async () => {
  let classDoc = await Class.findOne({ name: 'Unassigned', section: 'General' }).select('_id').lean();
  if (classDoc) return classDoc;

  try {
    classDoc = await Class.create({
      name: 'Unassigned',
      section: 'General',
      academicYear: getAcademicYear(),
      totalStudents: 0,
      room: 'TBD'
    });
    return classDoc;
  } catch (error) {
    if (error.code === 11000) {
      const existing = await Class.findOne({ name: 'Unassigned', section: 'General' }).select('_id').lean();
      if (existing) return existing;
    }
    throw error;
  }
};

router.get('/register-options', async (req, res) => {
  try {
    let classes = await Class.find()
      .select('name section academicYear')
      .sort({ name: 1, section: 1 })
      .lean();

    if (!classes.length) {
      await ensureDefaultClass();
      classes = await Class.find()
        .select('name section academicYear')
        .sort({ name: 1, section: 1 })
        .lean();
    }

    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register
router.post('/register', validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      email,
      password,
      role,
      adminInviteCode,
      classId,
      rollNumber,
      enrollmentNumber,
      guardianName,
      guardianPhone,
      guardianEmail
    } = req.body;

    let selectedClassId = classId;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    if (role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      const inviteKey = process.env.ADMIN_REGISTRATION_KEY;

      if (adminCount > 0 && adminInviteCode !== inviteKey) {
        return res.status(403).json({
          success: false,
          message: 'Admin registration requires a valid invite code'
        });
      }
    }

    if (role === 'student') {
      if (!rollNumber) {
        return res.status(400).json({ success: false, message: 'Student registration requires roll number' });
      }

      if (!selectedClassId) {
        const fallbackClass = await ensureDefaultClass();
        selectedClassId = fallbackClass._id;
      }

      const classDoc = await Class.findById(selectedClassId).select('_id').lean();
      if (!classDoc) {
        return res.status(400).json({ success: false, message: 'Selected class does not exist' });
      }
    }

    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    if (role === 'teacher') {
      let created = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await Teacher.create({
            userId: user._id,
            employeeId: buildEmployeeId(),
            qualifications: [],
            assignedClasses: [],
            assignedSubjects: [],
            designation: 'Teacher'
          });
          created = true;
          break;
        } catch (error) {
          if (error.code !== 11000) throw error;
        }
      }

      if (!created) {
        throw new Error('Failed to initialize teacher profile');
      }
    }

    if (role === 'student') {
      try {
        await Student.create({
          userId: user._id,
          rollNumber,
          enrollmentNumber: enrollmentNumber || undefined,
          class: selectedClassId,
          guardianName: guardianName || undefined,
          guardianPhone: guardianPhone || undefined,
          guardianEmail: guardianEmail || undefined,
          dateOfAdmission: new Date(),
          fees: {
            totalAmount: 0,
            paidAmount: 0,
            dueAmount: 0,
            lastPaidDate: null
          }
        });
      } catch (error) {
        await User.findByIdAndDelete(user._id);
        if (error.code === 11000) {
          return res.status(409).json({ success: false, message: 'Roll number or enrollment number already exists' });
        }
        throw error;
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Admin (only existing admins can create new admins)
router.post('/create-admin', authenticate, async (req, res) => {
  try {
    // Check if requester is admin
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create new admins' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = new User({
      name,
      email,
      password,
      role: 'admin'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Logout (handled on frontend by removing token)
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
    }

    const user = await User.findById(req.user.id);
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Old password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

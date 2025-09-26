const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register user
const register = async (req, res, next) => {
  try {
    console.log('Registration attempt:', {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        missing: {
          firstName: !firstName,
          lastName: !lastName,
          email: !email,
          password: !password
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: password
    };

    console.log('Creating user with data:', {
      ...userData,
      password: '[HIDDEN]'
    });

    const user = await User.create(userData);

    console.log('User created successfully:', {
      id: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`
    });

    // Generate token
    const token = generateToken(user._id);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    console.log('Login attempt:', {
      email: req.body.email,
      timestamp: new Date().toISOString(),
      headers: req.headers
    });
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user and include password
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+password');
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`
    });

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('Login successful for user:', email);

    // Generate token
    const token = generateToken(user._id);

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile
};
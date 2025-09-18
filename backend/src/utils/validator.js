const { body, param, query } = require('express-validator');

// Common validation rules
const commonValidations = {
  // MongoDB ObjectId validation
  mongoId: param('id').isMongoId().withMessage('Invalid ID format'),
  
  // Pagination validation
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  
  // Email validation
  email: body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  
  // Password validation
  password: body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  // Name validation
  name: (field) => body(field).trim().isLength({ min: 2, max: 50 }).withMessage(`${field} must be between 2-50 characters`),
  
  // Optional string validation
  optionalString: (field, maxLength = 500) => 
    body(field).optional().trim().isLength({ max: maxLength }).withMessage(`${field} cannot exceed ${maxLength} characters`),
  
  // Array validation
  array: (field) => body(field).optional().isArray().withMessage(`${field} must be an array`),
  
  // URL validation
  url: (field) => body(field).optional().isURL().withMessage(`${field} must be a valid URL`),
  
  // Date validation
  date: (field) => body(field).isISO8601().withMessage(`${field} must be a valid date`),
  
  // Optional date validation
  optionalDate: (field) => body(field).optional().isISO8601().withMessage(`${field} must be a valid date`),
  
  // Enum validation
  enum: (field, values) => body(field).isIn(values).withMessage(`${field} must be one of: ${values.join(', ')}`)
};

// Specific validation sets
const validationSets = {
  // User registration
  userRegistration: [
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.email,
    commonValidations.password
  ],
  
  // User login
  userLogin: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required')
  ],
  
  // Profile update
  profileUpdate: [
    commonValidations.name('firstName').optional(),
    commonValidations.name('lastName').optional(),
    commonValidations.optionalString('phone', 20),
    commonValidations.optionalString('location', 200),
    commonValidations.optionalString('bio', 500),
    commonValidations.array('skills'),
    commonValidations.array('interests')
  ],
  
  // Milestone creation/update
  milestone: [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be between 2-200 characters'),
    body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10-1000 characters'),
    commonValidations.enum('type', ['education', 'job', 'certification', 'achievement', 'project']),
    commonValidations.date('startDate'),
    commonValidations.optionalDate('endDate'),
    commonValidations.optionalString('company', 200),
    commonValidations.optionalString('location', 200),
    commonValidations.array('skills'),
    commonValidations.array('technologies'),
    commonValidations.array('achievements'),
    commonValidations.url('url')
  ],
  
  // Question validation
  question: [
    body('question').trim().isLength({ min: 5, max: 500 }).withMessage('Question must be between 5-500 characters')
  ],
  
  // Generic ID validation
  mongoIdParam: commonValidations.mongoId,
  
  // Pagination validation
  pagination: commonValidations.pagination
};

module.exports = {
  commonValidations,
  validationSets
};

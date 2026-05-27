import { body, validationResult } from 'express-validator';

// Reusable validator formatter
export const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  };
};

// Sign Up Validation rules
export const signupValidation = validate([
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters long.'),
  body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('phone').optional().trim(),
]);

// Login Validation rules
export const loginValidation = validate([
  body('email').trim().isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
]);

// Category CRUD Validation rules
export const categoryValidation = validate([
  body('categoryId').trim().notEmpty().withMessage('Category ID is required.'),
  body('name').trim().notEmpty().withMessage('Category name is required.'),
  body('description').optional().trim(),
  body('icon').optional().trim(),
  body('image').optional().trim(),
]);

// Service CRUD Validation rules
export const serviceValidation = validate([
  body('serviceId').trim().notEmpty().withMessage('Service ID is required.'),
  body('categoryId').trim().notEmpty().withMessage('Category ID is required.'),
  body('name').trim().notEmpty().withMessage('Service name is required.'),
  body('category').trim().notEmpty().withMessage('Category text label is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('duration').optional().trim(),
  body('description').optional().trim(),
  body('image').optional().trim(),
  body('featured').optional().isBoolean().withMessage('Featured must be a boolean value.'),
]);

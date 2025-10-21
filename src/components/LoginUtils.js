// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates login form data
 * @param {Object} formData - Form data containing email and password
 * @returns {string|null} Error message or null if valid
 */
export const validateLoginForm = (formData) => {
  const { email, password } = formData;

  // Check if fields are empty
  if (!email?.trim() || !password?.trim()) {
    return 'Please fill in all fields';
  }

  // Validate email format
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }

  // Validate password length
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  return null;
};

/**
 * Validates sign-up form data
 * @param {Object} formData - Form data containing name, email, password
 * @returns {string|null} Error message or null if valid
 */
export const validateSignUpForm = (formData) => {
  const { name, email, password } = formData;

  // Check if name field is empty
  if (!name?.trim()) {
    return 'Please enter your name';
  }

  // Use login validation for email and password
  return validateLoginForm({ email, password });
};

/**
 * Maps Firebase auth error codes to user-friendly messages
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly error message
 */
export const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    // Sign-in errors
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password. Please try again',
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/invalid-credential': 'Invalid email or password',

    // Sign-up errors
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled',

    // General errors
    'auth/network-request-failed': 'Network error. Please check your connection',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/popup-closed-by-user': 'Sign-in popup was closed',
    'auth/cancelled-popup-request': 'Sign-in was cancelled',
    'auth/popup-blocked': 'Sign-in popup was blocked by browser',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth',

    // Default
    'default': 'Authentication failed. Please try again'
  };

  return errorMessages[errorCode] || errorMessages.default;
};

/**
 * Sanitizes user input to prevent XSS
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Checks if email domain is valid (basic check)
 * @param {string} email - Email address
 * @returns {boolean} True if domain seems valid
 */
export const hasValidEmailDomain = (email) => {
  if (!email || typeof email !== 'string') return false;
  const domain = email.split('@')[1];
  return domain && domain.includes('.');
};

/**
 * Password strength checker
 * @param {string} password - Password to check
 * @returns {Object} Strength level and feedback
 */
export const checkPasswordStrength = (password) => {
  if (!password) {
    return { strength: 'none', message: 'Password required', score: 0 };
  }

  let score = 0;
  const feedback = [];

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Complexity checks
  if (/[a-z]/.test(password)) score += 1; // lowercase
  if (/[A-Z]/.test(password)) score += 1; // uppercase
  if (/[0-9]/.test(password)) score += 1; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special chars

  // Determine strength
  let strength = 'weak';
  let message = 'Weak password';

  if (score <= 2) {
    strength = 'weak';
    message = 'Weak password';
    feedback.push('Use at least 8 characters');
    feedback.push('Include uppercase and lowercase letters');
  } else if (score <= 4) {
    strength = 'medium';
    message = 'Medium password';
    feedback.push('Add numbers and special characters for better security');
  } else {
    strength = 'strong';
    message = 'Strong password';
  }

  return { strength, message, score, feedback };
};

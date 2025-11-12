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


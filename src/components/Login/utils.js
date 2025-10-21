// Form validation utilities
export const validateForm = (formData, isSignUp, agreeToTerms) => {
  if (isSignUp) {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return 'Please enter your full name';
    }
    if (!agreeToTerms) {
      return 'Please accept the Terms and Conditions';
    }
  }

  if (!formData.email || !formData.password) {
    return 'Please fill in all fields';
  }

  if (formData.password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  return null;
};

// Firebase error message mapping
export const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/email-already-in-use': 'Email already in use',
    'auth/weak-password': 'Password is too weak',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-email': 'Invalid email address',
  };

  return errorMessages[errorCode] || 'Authentication failed. Please try again.';
};

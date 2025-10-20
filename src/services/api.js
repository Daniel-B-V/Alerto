// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token
const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Helper function to remove auth token
const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Login user
  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Get current user
  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  // Update profile
  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Change password
  changePassword: async (passwordData) => {
    return apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  // Logout
  logout: () => {
    removeAuthToken();
  },
};

// Reports API
export const reportsAPI = {
  // Get all reports with filtering
  getReports: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/reports${queryString ? `?${queryString}` : ''}`);
  },

  // Get single report
  getReport: async (id) => {
    return apiRequest(`/reports/${id}`);
  },

  // Create new report
  createReport: async (reportData, images = []) => {
    const formData = new FormData();
    
    // Add report data
    Object.keys(reportData).forEach(key => {
      if (key === 'location') {
        formData.append(key, JSON.stringify(reportData[key]));
      } else {
        formData.append(key, reportData[key]);
      }
    });

    // Add images
    images.forEach((image, index) => {
      formData.append('images', image);
    });

    return apiRequest('/reports', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  },

  // Update report
  updateReport: async (id, updateData) => {
    return apiRequest(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Delete report
  deleteReport: async (id) => {
    return apiRequest(`/reports/${id}`, {
      method: 'DELETE',
    });
  },

  // Like/unlike report
  toggleLike: async (id) => {
    return apiRequest(`/reports/${id}/like`, {
      method: 'POST',
    });
  },

  // Add comment
  addComment: async (id, comment) => {
    return apiRequest(`/reports/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text: comment }),
    });
  },
};

// Weather API
export const weatherAPI = {
  // Get current weather
  getCurrentWeather: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/weather/current${queryString ? `?${queryString}` : ''}`);
  },

  // Get weather forecast
  getForecast: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/weather/forecast${queryString ? `?${queryString}` : ''}`);
  },

  // Get weather alerts
  getAlerts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/weather/alerts${queryString ? `?${queryString}` : ''}`);
  },

  // Get historical weather data
  getHistorical: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/weather/historical${queryString ? `?${queryString}` : ''}`);
  },
};

// Users API
export const usersAPI = {
  // Get user profile
  getProfile: async () => {
    return apiRequest('/users/profile');
  },

  // Get user's reports
  getUserReports: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/users/reports${queryString ? `?${queryString}` : ''}`);
  },

  // Get user statistics
  getUserStats: async () => {
    return apiRequest('/users/stats');
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    return apiRequest('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },
};

// Admin API
export const adminAPI = {
  // Get admin dashboard data
  getDashboard: async () => {
    return apiRequest('/admin/dashboard');
  },

  // Get all reports for admin
  getAdminReports: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/reports${queryString ? `?${queryString}` : ''}`);
  },

  // Update report status
  updateReportStatus: async (id, status, resolution = null) => {
    return apiRequest(`/admin/reports/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolution }),
    });
  },

  // Get all users for admin
  getAdminUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  // Update user role
  updateUserRole: async (id, role) => {
    return apiRequest(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },
};

// Utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
  },

  // Get auth token
  getToken: getAuthToken,

  // Set auth token
  setToken: setAuthToken,

  // Remove auth token
  removeToken: removeAuthToken,

  // Handle API errors
  handleError: (error) => {
    console.error('API Error:', error);
    
    if (error.message.includes('401')) {
      // Unauthorized - redirect to login
      removeAuthToken();
      window.location.href = '/login';
    }
    
    return {
      message: error.message || 'An error occurred',
      status: 'error'
    };
  },
};

export default {
  auth: authAPI,
  reports: reportsAPI,
  weather: weatherAPI,
  users: usersAPI,
  admin: adminAPI,
  utils: apiUtils,
};

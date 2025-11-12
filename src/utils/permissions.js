/**
 * Simple Permission System for Alerto
 * Only Governor and Mayor roles
 */

// Check if user is Governor (has full permissions)
export const isGovernor = (user) => {
  if (!user) return false;
  const role = user.role?.toLowerCase();
  return role === 'admin' || role === 'super_admin' || role === 'governor';
};

// Check if user is Mayor (limited permissions)
export const isMayor = (user) => {
  if (!user) return false;
  return user.role?.toLowerCase() === 'mayor';
};

// Governor can issue suspensions directly
export const canIssueSuspension = (user) => {
  return isGovernor(user);
};

// Mayor can only request suspensions (needs governor approval)
export const canRequestSuspension = (user) => {
  return isMayor(user);
};

// Governor can lift/extend suspensions
export const canManageSuspensions = (user) => {
  return isGovernor(user);
};

// Governor sees all cities, Mayor sees only their city
export const canViewAllCities = (user) => {
  return isGovernor(user);
};

// Get user's assigned city (for mayors)
export const getUserCity = (user) => {
  return user?.city || null;
};

// Filter cities based on role
export const filterCitiesByRole = (cities, user) => {
  if (!user) return [];

  // Governor sees all cities
  if (isGovernor(user)) {
    return cities;
  }

  // Mayor sees only their city
  if (isMayor(user)) {
    const userCity = getUserCity(user);
    if (!userCity) return [];
    return cities.filter(c => c.city === userCity || c === userCity);
  }

  return [];
};

// Get role display badge
export const getRoleBadge = (user) => {
  if (isGovernor(user)) {
    return { label: 'Governor', icon: '👑', color: 'purple' };
  }
  if (isMayor(user)) {
    return { label: 'Mayor', icon: '🏛️', color: 'blue' };
  }
  return { label: 'User', icon: '👤', color: 'gray' };
};

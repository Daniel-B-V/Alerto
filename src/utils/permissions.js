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

// Check if user is Test Role (same as regular user, for UI/UX testing)
export const isTestRole = (user) => {
  if (!user) return false;
  return user.role?.toLowerCase() === 'test';
};

// Both Governor and Mayor can issue suspensions directly
// Mayor can only issue for their assigned city
export const canIssueSuspension = (user) => {
  return isGovernor(user) || isMayor(user);
};

// Check if user can issue suspension for a specific city
export const canIssueSuspensionFor = (user, cityName) => {
  if (!user || !cityName) return false;

  // Governor can issue for any city
  if (isGovernor(user)) return true;

  // Mayor can only issue for their assigned city
  if (isMayor(user)) {
    return getUserCity(user) === cityName;
  }

  return false;
};

// DEPRECATED: Mayor can now issue suspensions directly (no longer needs requests)
// Kept for backward compatibility with old data
export const canRequestSuspension = (user) => {
  return false; // Feature removed - mayors can now suspend directly
};

// Both Governor and Mayor can lift/extend suspensions
// Mayor can only manage their city's suspensions
export const canManageSuspensions = (user) => {
  return isGovernor(user) || isMayor(user);
};

// Check if user can manage (extend/lift/edit) a specific suspension
export const canManageSuspension = (user, suspension) => {
  if (!user || !suspension) return false;

  // Governor can manage all suspensions
  if (isGovernor(user)) return true;

  // Mayor can only manage suspensions for their assigned city
  if (isMayor(user)) {
    const userCity = getUserCity(user);
    return suspension.city === userCity;
  }

  return false;
};

// Governor sees all cities, Mayor sees only their city
export const canViewAllCities = (user) => {
  return isGovernor(user);
};

// Get user's assigned city (for mayors)
export const getUserCity = (user) => {
  return user?.assignedCity || null;
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

// Check if user can view a specific city
export const canViewCity = (user, cityName) => {
  if (!user || !cityName) return false;

  // Governor can view all cities
  if (isGovernor(user)) return true;

  // Mayor can only view their assigned city
  if (isMayor(user)) {
    return getUserCity(user) === cityName;
  }

  return false;
};

// DEPRECATED: Replaced with canIssueSuspensionFor
// Kept for backward compatibility
export const canRequestSuspensionFor = (user, cityName) => {
  // Feature removed - use canIssueSuspensionFor instead
  return canIssueSuspensionFor(user, cityName);
};

// Check if user can approve suspension requests
export const canApproveSuspension = (user) => {
  return isGovernor(user);
};

// Get list of cities visible to user
export const getVisibleCities = (user, allCities = []) => {
  if (!user) return [];

  // Governor sees all cities
  if (isGovernor(user)) {
    return allCities;
  }

  // Mayor sees only their assigned city
  if (isMayor(user)) {
    const userCity = getUserCity(user);
    if (!userCity) return [];

    // Return array with just their city
    if (Array.isArray(allCities)) {
      return allCities.filter(city => {
        // Handle both string arrays and object arrays
        if (typeof city === 'string') return city === userCity;
        return city.city === userCity || city.name === userCity;
      });
    }

    return [userCity];
  }

  return [];
};

// Get list of barangays visible to user in a specific city
export const getVisibleBarangays = (user, cityName, batangasLocations = {}) => {
  if (!user || !cityName) return [];

  // Check if user can view this city
  if (!canViewCity(user, cityName)) return [];

  // Return all barangays for the city from batangasLocations
  return batangasLocations[cityName] || [];
};

// Get user's assigned province
export const getUserProvince = (user) => {
  return user?.assignedProvince || user?.province || 'Batangas';
};

// Get scope display text (for UI)
export const getScopeDisplay = (user) => {
  if (isGovernor(user)) {
    return {
      scope: 'provincial',
      label: `${getUserProvince(user)} Province`,
      description: 'All cities and municipalities'
    };
  }

  if (isMayor(user)) {
    const city = getUserCity(user);
    return {
      scope: 'city',
      label: city || 'No city assigned',
      description: city ? `${city} and all barangays` : 'No city assigned'
    };
  }

  return {
    scope: 'none',
    label: 'No administrative access',
    description: 'Public user'
  };
};

// Get role display badge
export const getRoleBadge = (user) => {
  // Admin role (same permissions as governor but with special badge)
  if (user?.role === 'admin' || user?.role === 'super_admin') {
    return {
      label: 'Admin',
      icon: '🛡️',
      color: 'red',
      fullLabel: `Admin • ${getUserProvince(user)}`
    };
  }
  if (isGovernor(user)) {
    return {
      label: 'Governor',
      icon: '👑',
      color: 'purple',
      fullLabel: `Governor • ${getUserProvince(user)}`
    };
  }
  if (isMayor(user)) {
    const city = getUserCity(user);
    return {
      label: 'Mayor',
      icon: '🏛️',
      color: 'blue',
      fullLabel: `Mayor • ${city || 'Unassigned'}`
    };
  }
  if (isTestRole(user)) {
    return {
      label: 'Test',
      icon: '🧪',
      color: 'green',
      fullLabel: 'Test Role • UI/UX Testing'
    };
  }
  return {
    label: 'User',
    icon: '👤',
    color: 'gray',
    fullLabel: 'Community Member'
  };
};

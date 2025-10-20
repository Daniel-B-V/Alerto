import React, { createContext, useContext, useState } from 'react';

// Firebase provides real-time listeners through Firestore, so we no longer need Socket.io
// This context now only manages notifications state

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const connected = true; // Firebase is always "connected" when online

  // Add notification to the list
  const addNotification = (notification) => {
    setNotifications(prev => {
      const newNotifications = [notification, ...prev];
      // Keep only the last 50 notifications
      return newNotifications.slice(0, 50);
    });
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    connected,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    // Legacy compatibility - these do nothing now
    joinRoom: () => {},
    leaveRoom: () => {},
    emit: () => {},
    on: () => {},
    off: () => {},
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

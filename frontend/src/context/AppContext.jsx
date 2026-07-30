import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [autoStream, setAutoStream] = useState(false);

  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Toggle backend live traffic background generator
  const toggleLiveStream = async () => {
    try {
      if (autoStream) {
        await api.post('/usage/live-stream/stop');
        setAutoStream(false);
        addToast('Real-Time Stream Paused', 'Background AI traffic simulation paused.', 'info');
      } else {
        await api.post('/usage/live-stream/start');
        setAutoStream(true);
        addToast('Real-Time Telemetry Streaming Active', 'Generating live enterprise AI traffic every ~3s...', 'success');
      }
    } catch (e) {
      addToast('Error', 'Failed to toggle real-time stream', 'critical');
    }
  };

  // Real-time auto-polling interval when autoStream is active
  useEffect(() => {
    let interval = null;
    if (autoStream) {
      interval = setInterval(() => {
        triggerRefresh();
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoStream]);

  return (
    <AppContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        globalSearch,
        setGlobalSearch,
        simulatorOpen,
        setSimulatorOpen,
        refreshTrigger,
        triggerRefresh,
        autoStream,
        toggleLiveStream,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import NotificationCenter from './components/Layout/NotificationCenter';
import LiveSimulatorModal from './components/Simulators/LiveSimulatorModal';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Organizations from './pages/Organizations';
import Teams from './pages/Teams';
import AIAgents from './pages/AIAgents';
import Sessions from './pages/Sessions';
import APIUsage from './pages/APIUsage';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F19]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/agents" element={<AIAgents />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/usage" element={<APIUsage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <LiveSimulatorModal />
      <NotificationCenter />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

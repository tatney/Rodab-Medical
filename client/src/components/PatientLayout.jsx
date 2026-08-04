import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const PatientLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 900 : true;
  });

  if (user?.role !== 'user') {
    return <Outlet />;
  }

  return (
    <div className="patient-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} topOffset={52} />
      <div className="patient-layout-main">
        <div className="patient-layout-toolbar">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default PatientLayout;

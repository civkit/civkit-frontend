import React from 'react';
import Dashboard from '../components/Dashboard';

const DashboardPage: React.FC<{ darkMode: boolean; toggleDarkMode: () => void }> = ({
  darkMode,
  toggleDarkMode,
}) => {
  return <Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
};

export default DashboardPage;

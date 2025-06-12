// frontend/src/components/layout/Layout.jsx

import { Outlet } from 'react-router-dom';
import { SubscriptionProvider } from '../../contexts/SubscriptionContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PrivateRoute from '../PrivateRoute'; // Assuming PrivateRoute handles loading/auth checks
import { useState } from 'react';

const Layout = () => {
  // PrivateRoute will handle redirection, so we can simplify this component.
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <SubscriptionProvider>
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex h-screen bg-[var(--light)] overflow-hidden">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 md:relative md:translate-x-0 md:transform-none ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
          <Navbar onSidebarToggle={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SubscriptionProvider>
  );
};

export default Layout;
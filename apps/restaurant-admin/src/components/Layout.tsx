import React from 'react';
import Sidebar from './sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { activeRestaurantStatus } = useAuth();
  const status = (activeRestaurantStatus || 'pending').toLowerCase();
  
  const hideSidebar = status === 'rejected';

  return (
    <div className="flex min-h-screen bg-tk-bg relative">
      <style>{`
        /* Dynamic Main Content Margin */
        @media (min-width: 769px) {
          body:not(.sidebar-collapsed) .tk-main-content { margin-left: ${hideSidebar ? '0' : '240px'}; }
          body.sidebar-collapsed .tk-main-content { margin-left: ${hideSidebar ? '0' : '64px'}; }
        }
        @media (max-width: 768px) {
          .tk-main-content { margin-left: 0; padding-top: ${hideSidebar ? '0' : '72px'}; }
        }
      `}</style>

      {!hideSidebar && <Sidebar />}

      <main className={`tk-main-content flex-1 min-w-0 pt-6 px-6 pb-6 transition-all duration-300 max-md:!px-4 max-md:!pb-4 ${hideSidebar ? '!ml-0' : ''} bg-tk-bg-surface`}>
        {children}
      </main>
    </div>
  );
}
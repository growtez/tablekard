import React from 'react';
import Sidebar from './sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-tk-bg relative">
      <style>{`
        /* Dynamic Main Content Margin */
        @media (min-width: 769px) {
          body:not(.sidebar-collapsed) .tk-main-content { margin-left: 240px; }
          body.sidebar-collapsed .tk-main-content { margin-left: 64px; }
        }
        @media (max-width: 768px) {
          .tk-main-content { margin-left: 0; padding-top: 72px; }
        }
      `}</style>

      <Sidebar />

      <main className="tk-main-content flex-1 min-w-0 pt-6 px-6 pb-6 transition-all duration-300 max-md:!px-4 max-md:!pb-4 bg-tk-bg-surface">
        {children}
      </main>
    </div>
  );
}
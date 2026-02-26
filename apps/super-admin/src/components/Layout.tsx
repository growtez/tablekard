import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="app-layout">
            <Sidebar collapsed={sidebarCollapsed} />
            <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <TopBar onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Breadcrumbs from './Breadcrumbs';
import { PageHeaderProvider } from '../context/PageHeaderContext';

export default function Layout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <PageHeaderProvider>
            <div className="app-layout">
                <Sidebar collapsed={sidebarCollapsed} />
                <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    <TopBar onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
                    <div className="px-8 pt-6 pb-2">
                        <Breadcrumbs />
                    </div>
                    <main className="main-content">
                        <Outlet />
                    </main>
                </div>
            </div>
        </PageHeaderProvider>
    );
}

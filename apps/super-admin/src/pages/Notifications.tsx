import { Bell } from 'lucide-react';

export default function Notifications() {
    return (
        <>
            <header className="page-header">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Notifications</h1>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                    System alerts and messages
                </p>
            </header>

            <div className="page-content animate-fadeIn">
                <div className="card text-center p-12">
                    <div className="flex justify-center mb-4 text-purple-200">
                        <Bell size={64} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No new notifications</h2>
                    <p className="text-secondary max-w-md mx-auto">
                        You're all caught up! System alerts and important updates will appear here.
                    </p>
                </div>
            </div>
        </>
    );
}

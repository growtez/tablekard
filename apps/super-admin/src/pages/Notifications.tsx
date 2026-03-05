import { Bell } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

export default function Notifications() {
    return (
        <>
            <PageHeader title="Notifications" />

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

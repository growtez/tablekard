import { BarChart3 } from 'lucide-react';

export default function Analytics() {
    return (
        <>
            <header className="page-header">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Analytics</h1>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                    Platform performance reports
                </p>
            </header>

            <div className="page-content animate-fadeIn">
                <div className="card text-center p-12">
                    <div className="flex justify-center mb-4 text-purple-200">
                        <BarChart3 size={64} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Detailed Reports Coming Soon</h2>
                    <p className="text-secondary max-w-md mx-auto">
                        We are building advanced analytics to give you deeper insights into platform usage, revenue trends, and user growth.
                    </p>
                </div>
            </div>
        </>
    );
}

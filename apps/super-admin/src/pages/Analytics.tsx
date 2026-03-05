import { BarChart3 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

export default function Analytics() {
    return (
        <>
            <PageHeader title="Analytics" />

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

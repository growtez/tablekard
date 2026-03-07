import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

export default function SecurityBackups() {
    return (
        <>
            <PageHeader title="Security & Backups" />
            <div className="page-content">
                <Card>
                    <CardHeader>
                        <CardTitle>Security Configuration</CardTitle>
                    </CardHeader>
                    <div className="p-6 text-center text-[var(--color-text-muted)]">
                        Security & backup management interface
                    </div>
                </Card>
            </div>
        </>
    );
}

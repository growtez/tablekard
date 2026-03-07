import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

export default function EmailTemplates() {
    return (
        <>
            <PageHeader title="Email Templates" />
            <div className="page-content">
                <Card>
                    <CardHeader>
                        <CardTitle>Email Template Management</CardTitle>
                    </CardHeader>
                    <div className="p-6 text-center text-[var(--color-text-muted)]">
                        Email templates configuration interface
                    </div>
                </Card>
            </div>
        </>
    );
}

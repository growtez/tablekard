import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

export default function IntegrationsAPI() {
    return (
        <>
            <PageHeader title="Integrations & API" description="Manage third-party integrations and API access." />
            <div className="page-content">
                <Card>
                    <CardHeader>
                        <CardTitle>API Integrations</CardTitle>
                    </CardHeader>
                    <div className="p-6 text-center text-[var(--color-text-muted)]">
                        Integrations & API management interface
                    </div>
                </Card>
            </div>
        </>
    );
}

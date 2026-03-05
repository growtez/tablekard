import React, { createContext, useContext, useState } from 'react';

interface PageHeaderState {
    title: React.ReactNode;
    actions?: React.ReactNode;
}

interface PageHeaderContextType {
    header: PageHeaderState | null;
    setHeader: (header: PageHeaderState | null) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
    const [header, setHeader] = useState<PageHeaderState | null>(null);

    return (
        <PageHeaderContext.Provider value={{ header, setHeader }}>
            {children}
        </PageHeaderContext.Provider>
    );
}

export function usePageHeader() {
    const context = useContext(PageHeaderContext);
    if (context === undefined) {
        throw new Error('usePageHeader must be used within a PageHeaderProvider');
    }
    return context;
}

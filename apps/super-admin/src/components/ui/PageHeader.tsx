import { useEffect } from 'react';
import { usePageHeader } from '../../context/PageHeaderContext';

interface PageHeaderProps {
    title: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
    const { setHeader } = usePageHeader();

    useEffect(() => {
        setHeader({ title, actions });
        return () => setHeader(null);
    }, [title, actions, setHeader]);

    return null;
}

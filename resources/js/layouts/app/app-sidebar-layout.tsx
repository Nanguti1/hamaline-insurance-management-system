import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { FlashAlerts } from '@/components/flash-alerts';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <div className="pointer-events-none absolute right-4 top-20 z-50 flex w-full max-w-md justify-end px-2 md:right-6 md:px-0">
                    <div className="pointer-events-auto w-full sm:w-auto">
                        <FlashAlerts />
                    </div>
                </div>
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}

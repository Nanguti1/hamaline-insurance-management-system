import { Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    BadgePercent,
    BookOpen,
    FileCheck,
    FileText,
    FolderGit2,
    LayoutGrid,
    RefreshCw,
    Shield,
    Wallet,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Clients',
        href: '/clients',
        icon: Users,
    },
    {
        title: 'Underwriters',
        href: '/underwriters',
        icon: Shield,
    },
    {
        title: 'Quotations',
        href: '/quotations',
        icon: FileText,
    },
    {
        title: 'Policies',
        href: '/policies',
        icon: FileCheck,
    },
    {
        title: 'Payments',
        href: '/payments',
        icon: Wallet,
    },
    {
        title: 'Claims',
        href: '/claims',
        icon: AlertTriangle,
    },
    {
        title: 'Commissions',
        href: '/commissions',
        icon: BadgePercent,
    },
    {
        title: 'Renewals',
        href: '/renewals',
        icon: RefreshCw,
    },
    {
        title: 'Reports',
        href: '/reports/dashboard',
        icon: BarChart3,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const permissions = ((usePage().props as { auth?: { permissions?: string[] } }).auth?.permissions ?? []);

    const can = (permission: string) => permissions.includes(permission);
    const filteredItems = mainNavItems.filter((item) => {
        switch (item.title) {
            case 'Clients':
                return can('clients.view');
            case 'Underwriters':
                return can('underwriters.view');
            case 'Quotations':
                return can('quotations.view');
            case 'Policies':
                return can('policies.view');
            case 'Payments':
                return can('payments.view');
            case 'Claims':
                return can('claims.view');
            case 'Commissions':
                return can('commissions.view');
            case 'Renewals':
                return can('renewals.view');
            case 'Reports':
                return can('reports.view');
            default:
                return true;
        }
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

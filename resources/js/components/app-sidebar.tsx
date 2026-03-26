import { Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    BadgePercent,
    FileCheck,
    FileText,
    LayoutGrid,
    RefreshCw,
    ShieldCheck,
    Shield,
    Wallet,
    UserCog,
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

type NavItemWithPermission = NavItem & {
    requiredPermission?: string;
};

type NavGroupWithPermission = {
    title: string;
    icon?: NavItem['icon'];
    items: NavItemWithPermission[];
};

const navGroups: NavGroupWithPermission[] = [
    {
        title: 'Overview',
        icon: LayoutGrid,
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        title: 'Administration',
        icon: UserCog,
        items: [
            {
                id: 'm-users',
                title: 'Users',
                href: '/users',
                icon: UserCog,
                requiredPermission: 'users.manage',
            },
            {
                id: 'm-rbac',
                title: 'Roles & Permissions',
                href: '/roles-permissions',
                icon: ShieldCheck,
                requiredPermission: 'users.manage',
            },
        ],
    },
    {
        title: 'Clients & Underwriting',
        icon: Users,
        items: [
            {
                title: 'Clients',
                href: '/clients',
                icon: Users,
                requiredPermission: 'clients.view',
            },
            {
                title: 'Underwriters',
                href: '/underwriters',
                icon: Shield,
                requiredPermission: 'underwriters.view',
            },
            {
                title: 'Quotations',
                href: '/quotations',
                icon: FileText,
                requiredPermission: 'quotations.view',
            },
            {
                title: 'Policies',
                href: '/policies',
                icon: FileCheck,
                requiredPermission: 'policies.view',
            },
        ],
    },
    {
        title: 'Risk Notes',
        icon: FileText,
        items: [
            {
                title: 'Medical Risks',
                href: '/medical-risks',
                icon: FileText,
                requiredPermission: 'medical_risks.view',
            },
            {
                title: 'Motor Risks',
                href: '/motor-risks',
                icon: FileText,
                requiredPermission: 'motor_risks.view',
            },
            {
                title: 'WIBA Risks',
                href: '/wiba-risks',
                icon: FileText,
                requiredPermission: 'wiba_risks.view',
            },
        ],
    },
    {
        title: 'Operations',
        icon: AlertTriangle,
        items: [
            {
                title: 'Claims',
                href: '/claims',
                icon: AlertTriangle,
                requiredPermission: 'claims.view',
            },
            {
                title: 'Payments',
                href: '/payments',
                icon: Wallet,
                requiredPermission: 'payments.view',
            },
            {
                title: 'Commissions',
                href: '/commissions',
                icon: BadgePercent,
                requiredPermission: 'commissions.view',
            },
            {
                title: 'Renewals',
                href: '/renewals',
                icon: RefreshCw,
                requiredPermission: 'renewals.view',
            },
        ],
    },
    {
        title: 'Reports',
        icon: BarChart3,
        items: [
            {
                title: 'Reports',
                href: '/reports/dashboard',
                icon: BarChart3,
                requiredPermission: 'reports.view',
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: FolderGit2,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    const permissions = ((usePage().props as { auth?: { permissions?: string[] } }).auth?.permissions ?? []);

    const can = (permission: string) => permissions.includes(permission);
    const visibleGroups = navGroups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
                if (!item.requiredPermission) return true;
                return can(item.requiredPermission);
            }),
        }))
        .filter((group) => group.items.length > 0)
        .map((group) => ({
            title: group.title,
            icon: group.icon,
            items: group.items.map(({ requiredPermission: _rp, ...item }) => item),
        }));

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
                <NavMain groups={visibleGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

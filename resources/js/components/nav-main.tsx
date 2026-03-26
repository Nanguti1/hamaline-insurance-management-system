import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';
import { toUrl } from '@/lib/utils';

export type NavGroup = {
    title: string;
    icon?: LucideIcon | null;
    items: NavItem[];
};

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarMenu>
                {groups.map((group) => {
                    const groupIsActive = group.items.some((item) =>
                        isCurrentUrl(item.href),
                    );

                    if (group.items.length === 1) {
                        const item = group.items[0];
                        const itemKey = toUrl(item.href);
                        return (
                            <SidebarMenuItem key={itemKey}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={groupIsActive}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch id={item.id}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }

                    return (
                        <Collapsible
                            key={group.title}
                            defaultOpen={groupIsActive}
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        isActive={groupIsActive}
                                        tooltip={{ children: group.title }}
                                        className={
                                            '[&[data-state=open]_.nav-chev]:rotate-180'
                                        }
                                    >
                                        {group.icon && <group.icon />}
                                        <span>{group.title}</span>
                                        <ChevronDown className="nav-chev ml-auto size-4 shrink-0 opacity-50 transition-transform" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {group.items.map((item) => (
                                            <SidebarMenuSubItem
                                                key={toUrl(item.href)}
                                            >
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isCurrentUrl(item.href)}
                                                    size="sm"
                                                >
                                                    <Link
                                                        href={item.href}
                                                        prefetch
                                                        id={item.id}
                                                    >
                                                        {item.icon && <item.icon />}
                                                        <span>{item.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

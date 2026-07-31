"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { userCan } from "@/src/services/auth/authService";
import { useAuth } from "../../../../auth/hooks/useAuth";
import appIcon from "../../../../icon.png";
import { NavItem } from "./NavItem";
import { NavItems } from "./NavItems";
import type { NavItemProps } from "./NavItem";

type SideNavBarProps = {
  effectiveCollapsed: boolean;
  isPinned: boolean;
  mobile?: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTogglePin: () => void;
  onCloseMobile?: () => void;
};

type NavGroup = {
  title: string;
  icon: NavItemProps["icon"];
  items: NavItemProps[];
};

function SidebarHeader({
  effectiveCollapsed,
  isPinned,
  onTogglePin,
  onCloseMobile,
}: {
  effectiveCollapsed: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
  onCloseMobile?: () => void;
}) {
  return (
    <div
      className={`flex items-center py-4 text-xl font-bold text-primary-700 transition-all duration-300 ${effectiveCollapsed ? "justify-center px-1" : "gap-2 px-3"}`}
    >
      <Link href="/dash" prefetch={false} className="flex items-center gap-2" onClick={onCloseMobile}>
        <span className="flex size-8 shrink-0 items-center justify-center">
          <Image src={appIcon} alt="" className="h-full w-full object-contain" priority />
        </span>
        {!effectiveCollapsed && <span className="flex-1 overflow-hidden whitespace-nowrap">Marketia</span>}
      </Link>

      {!effectiveCollapsed && (
        <button
          onClick={onTogglePin}
          className={`ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-1 transition-colors ${isPinned ? "text-accent-700 hover:bg-accent-100" : "text-main-500 hover:bg-main-300 hover:text-main-700"}`}
          title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
          type="button"
        >
          <i className={`bi ${isPinned ? "bi-pin-fill" : "bi-pin-angle"} animation-zoom-in text-sm`} />
        </button>
      )}
    </div>
  );
}

function SidebarFooter({ effectiveCollapsed }: { effectiveCollapsed: boolean }) {
  return (
    <div className={`space-y-1 py-3 ${effectiveCollapsed ? "px-1" : "px-3"}`}>
      <NavItem className="rounded-md" collapsed={effectiveCollapsed} label="Logout" icon={<i className="bi bi-box-arrow-right" />} />
    </div>
  );
}

function filterNavItems(items: NavItemProps[], user: ReturnType<typeof useAuth>["user"]): NavItemProps[] {
  const filtered: NavItemProps[] = [];

  for (const item of items) {
    const subItems = item.subItems ? filterNavItems(item.subItems, user) : undefined;
    const allowed = userCan(user, item.requiredPermission);

    if (!allowed && (!subItems || subItems.length === 0)) {
      continue;
    }

    if (item.subItems && (!subItems || subItems.length === 0) && !item.to) {
      continue;
    }

    filtered.push({ ...item, subItems });
  }

  return filtered;
}

function stripNavItemIcons(items: NavItemProps[]): NavItemProps[] {
  return items.map(({ subItems, ...item }) => ({
    ...item,
    icon: undefined,
    subItems: subItems ? stripNavItemIcons(subItems) : undefined,
  }));
}

export function Sidebar({
  effectiveCollapsed,
  isPinned,
  mobile = false,
  onMouseEnter,
  onMouseLeave,
  onTogglePin,
  onCloseMobile,
}: SideNavBarProps) {
  const { user } = useAuth();
  const groups = useMemo<NavGroup[]>(
    () => [
      {
        title: "Overview",
        icon: <i className="bi bi-grid-1x2" />,
        items: [
          {
            label: "Dashboard",
            to: "/dash",
          },
          {
            label: "Market Data",
            to: "/market-data",
          },
          {
            label: "Validation",
            to: "/validations",
          },
        ],
      },
      {
        title: "Trade",
        icon: <i className="bi bi-tags" />,
        items: [
          {
            label: "Listings",
            to: "/listings",
          },
          {
            label: "Orders",
            to: "/orders",
          },
        ],
      },
      {
        title: "Data Ops",
        icon: <i className="bi bi-hdd-network" />,
        items: [
          {
            label: "Scrapers",
            to: "/scrapers",
          },
          {
            label: "Data Sources",
            to: "/data-sources",
          },
          {
            label: "Commodities",
            to: "/commodities",
            requiredPermission: ["commodities.list", "commodities.categories.list", "commodities.units.list"],
          },
          {
            label: "Markets",
            to: "/markets",
          },
          {
            label: "Areas",
            to: "/areas",
            requiredPermission: "areas.list",
          },
          {
            label: "USSD",
            to: "/ussd",
          },
        ],
      },
      {
        title: "Insights",
        icon: <i className="bi bi-graph-up-arrow" />,
        items: [
          {
            label: "Forecasting",
            to: "/ai-forecasting",
          },
          {
            label: "Reports",
            to: "/reports",
          },
        ],
      },
      {
        title: "Admin",
        icon: <i className="bi bi-people" />,
        items: [
          {
            label: "Access",
            requiredPermission: ["users.list", "roles.list", "permissions.list"],
            subItems: [
              { label: "Users", to: "/users", requiredPermission: "users.list" },
              { label: "Roles", to: "/rbac", requiredPermission: ["roles.list", "roles.create", "roles.update", "roles.delete", "permissions.list", "roles.permissions.update"] },
            ],
          },
        ],
      },
    ],
    [],
  );
  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => ({ ...group, items: filterNavItems(group.items, user) }))
        .filter((group) => group.items.length > 0),
    [groups, user],
  );
  const visibleGroupItems = useMemo<NavItemProps[]>(
    () =>
      visibleGroups.map((group) => ({
        label: group.title,
        icon: group.icon,
        subItems: stripNavItemIcons(group.items),
      })),
    [visibleGroups],
  );

  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden border-r border-main-300 bg-main-200 transition-all duration-300 ease-in-out ${effectiveCollapsed ? "w-16" : "w-64"} ${mobile ? "" : ""}`}
    >
      <div className="sticky top-0 z-10 border-b border-main-300 bg-main-200">
        <SidebarHeader
          effectiveCollapsed={effectiveCollapsed}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
          onCloseMobile={onCloseMobile}
        />
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="space-y-3 pb-4">
          {effectiveCollapsed ? (
            <NavItems collapsed items={visibleGroupItems} />
          ) : (
            <NavItems items={visibleGroupItems} />
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-main-300 bg-main-200">
        <SidebarFooter effectiveCollapsed={effectiveCollapsed} />
      </div>
    </aside>
  );
}

export { Sidebar as SideNavBar };

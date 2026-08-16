"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { userCan } from "@/src/services/auth/authService";
import { useAuth } from "@/src/app/(public)/auth/hooks/useAuth";
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
        title: "Dashboard",
        icon: <i className="bi bi-grid-1x2" />,
        items: [
          {
            label: "Dashboard",
            to: "/dash",
          },
        ],
      },
      {
        title: "Catalogs",
        icon: <i className="bi bi-collection" />,
        items: [
          {
            label: "Catalogs",
            to: "/catalogs",
            requiredPermission: ["commodities.list", "commodities.categories.list", "commodities.units.list"],
          },
        ],
      },
      {
        title: "Trade",
        icon: <i className="bi bi-tags" />,
        items: [
          {
            label: "Marketplace",
            to: "/market",
          },
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
            label: "Market Integrations",
            to: "/market-integrations",
            requiredPermission: "market_integrations.read",
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
        ],
      },
      {
        title: "Insights",
        icon: <i className="bi bi-graph-up-arrow" />,
        items: [
          {
            label: "Visualization",
            to: "/insights/visualization",
          },
          {
            label: "Reporting",
            to: "/insights/reporting",
          },
          {
            label: "Decision Support",
            to: "/insights/decision-support",
          },
        ],
      },
      {
        title: "ML Management",
        icon: <i className="bi bi-cpu" />,
        items: [
          {
            label: "Overview",
            to: "/ml",
            requiredPermission: ["ml.manage", "analytics.manage"],
          },
          {
            label: "Models",
            to: "/ml/models",
            requiredPermission: ["ml.manage", "analytics.manage"],
          },
          {
            label: "Training",
            to: "/ml/training",
            requiredPermission: ["ml.manage", "analytics.manage"],
          },
          {
            label: "Predictions",
            to: "/ml/predictions",
            requiredPermission: ["ml.manage", "analytics.manage"],
          },
          {
            label: "Evaluation",
            to: "/ml/evaluation",
            requiredPermission: ["ml.manage", "analytics.manage"],
          },
        ],
      },
      {
        title: "Admin",
        icon: <i className="bi bi-people" />,
        items: [
          {
            label: "Users",
            to: "/users",
            requiredPermission: "users.list",
          },
          {
            label: "Roles & Permissions",
            to: "/rbac",
            requiredPermission: [
              "roles.list",
              "roles.create",
              "roles.update",
              "roles.delete",
              "permissions.list",
              "roles.permissions.update",
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
      visibleGroups.map((group) => {
        if (group.items.length === 1) {
          const firstItem = group.items[0];
          return {
            label: group.title,
            icon: group.icon,
            to: firstItem.to,
            requiredPermission: firstItem.requiredPermission,
          };
        }
        return {
          label: group.title,
          icon: group.icon,
          subItems: stripNavItemIcons(group.items),
        };
      }),
    [visibleGroups],
  );

  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden border-r bg-main-50  text-main-950 border-main-200 transition-all duration-300 ease-in-out ${effectiveCollapsed ? "w-16" : "w-64"} ${mobile ? "" : ""}`}
    >
      <div className="sticky top-0 z-10 border-b bg-main-50 text-main-950 border-main-100">
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

      <div className="sticky bottom-0 z-10 border-t bg-main-50 text-main-950 border-main-100">
        <SidebarFooter effectiveCollapsed={effectiveCollapsed} />
      </div>
    </aside>
  );
}

export { Sidebar as SideNavBar };

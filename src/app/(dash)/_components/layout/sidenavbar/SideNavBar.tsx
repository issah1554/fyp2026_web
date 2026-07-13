"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { AuthRole, AuthUser } from "@/src/services/auth/authService";
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

function isAdminUser(user: AuthUser | null) {
  const role = user?.role;
  if (!role) {
    return false;
  }

  if (typeof role === "string") {
    return role.toLowerCase() === "admin";
  }

  const normalizedRole = role as AuthRole;
  return normalizedRole.id === 1 || normalizedRole.name?.toLowerCase() === "admin" || normalizedRole.code === "admin";
}

function userCan(permissions: string[], requiredPermission?: string | string[], isAdmin = false) {
  if (!requiredPermission) {
    return true;
  }

  if (isAdmin || permissions.includes("*")) {
    return true;
  }

  const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  return required.some((permission) => {
    if (permissions.includes(permission)) {
      return true;
    }

    const dotPosition = permission.indexOf(".");
    if (dotPosition === -1) {
      return false;
    }

    return permissions.includes(`${permission.slice(0, dotPosition)}.*`);
  });
}

function filterNavItems(items: NavItemProps[], permissions: string[], isAdmin = false): NavItemProps[] {
  const filtered: NavItemProps[] = [];

  for (const item of items) {
    const subItems = item.subItems ? filterNavItems(item.subItems, permissions, isAdmin) : undefined;
    const allowed = userCan(permissions, item.requiredPermission, isAdmin);

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
  const permissions = useMemo(() => user?.permissions ?? [], [user?.permissions]);
  const isAdmin = isAdminUser(user);
  const items = useMemo<NavItemProps[]>(
    () => [
      {
        label: "Dashboard",
        to: "/dash",
        icon: <i className="bi bi-grid-1x2" />,
      },
      {
        label: "Companies Management",
        icon: <i className="bi bi-buildings" />,
        requiredPermission: "*",
        subItems: [
          {
            label: "All Companies",
            to: "/companies",
            icon: <i className="bi bi-list-ul" />,
            requiredPermission: "*",
          },
          {
            label: "Registration Settings",
            to: "/companies/registration/settings",
            icon: <i className="bi bi-sliders" />,
            requiredPermission: "*",
          },
          {
            label: "Pending Applications",
            to: "/companies/applications",
            icon: <i className="bi bi-hourglass-split" />,
            requiredPermission: "*",
          },
        ],
      },
      {
        label: "System Access Control",
        icon: <i className="bi bi-shield-lock" />,
        subItems: [
          {
            label: "System Users",
            to: "/system/users",
            icon: <i className="bi bi-people" />,
            requiredPermission: "users.list",
          },
          {
            label: "System Roles",
            to: "/system/access-control/roles",
            icon: <i className="bi bi-person-badge" />,
            requiredPermission: ["roles.list", "roles.create", "roles.update", "roles.delete"],
          },
          {
            label: "System Permissions",
            to: "/system/access-control/permissions",
            icon: <i className="bi bi-key" />,
            requiredPermission: ["permissions.list", "roles.permissions.update"],
          },
        ],
      },
      {
        label: "Reports",
        to: "/reports",
        icon: <i className="bi bi-bar-chart" />,
        requiredPermission: "projects.read",
      },
      {
        label: "Settings",
        to: "/settings",
        icon: <i className="bi bi-gear-wide" />,
      },
    ],
    [],
  );
  const visibleItems = useMemo(() => filterNavItems(items, permissions, isAdmin), [items, permissions, isAdmin]);

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
          <NavItems
            collapsed={effectiveCollapsed}
            items={visibleItems}
          />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-main-300 bg-main-200">
        <SidebarFooter effectiveCollapsed={effectiveCollapsed} />
      </div>
    </aside>
  );
}

export { Sidebar as SideNavBar };

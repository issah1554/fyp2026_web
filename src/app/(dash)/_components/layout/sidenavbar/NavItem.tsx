"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

export type NavItemProps = {
  label: string;
  icon?: ReactNode;
  to?: string;
  subItems?: NavItemProps[];
  requiredPermission?: string | string[];
  badge?: number;
  depth?: number;
  className?: string;
  collapsed?: boolean;
};

export function NavItem({
  label,
  icon,
  to,
  subItems,
  badge,
  depth = 0,
  className,
  collapsed = false,
}: NavItemProps) {
  const pathname = usePathname();
  const isSubItem = depth > 0;
  const hasSubItems = Boolean(subItems?.length);
  const [manualOpen, setManualOpen] = useState(false);

  const isActive = Boolean(to && pathname === to);
  const isChildActive = Boolean(hasSubItems && subItems?.some((item) => item.to === pathname));
  const isOpen = !collapsed && (manualOpen || isChildActive);

  const depthPadding = ["pl-3", "pl-8", "pl-12", "pl-16"][depth] ?? "pl-16";

  const content = (
    <div
      className={`relative flex cursor-pointer items-center py-2 pr-1 text-sm text-main-600 hover:bg-main-300 hover:text-primary-700 ${collapsed ? "pl-0" : depthPadding} ${className ?? ""}
                ${isActive || isChildActive ? "bg-main-300 text-primary-700" : ""} ${isOpen && hasSubItems ? "bg-main-200" : ""}
                ${collapsed ? "justify-center" : "justify-between"}
            `}
      onClick={() => hasSubItems && !collapsed && setManualOpen((current) => !current)}
      title={collapsed ? label : undefined}
    >
      {isOpen && hasSubItems && !collapsed && (
        <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-primary-600" />
      )}

      {(isActive || isChildActive) && <span className="absolute bottom-0 left-0 top-0 w-1 bg-primary-600" />}

      <div className={`relative z-10 flex items-center gap-2 ${collapsed ? "" : "truncate"}`}>
        {icon && <span className={collapsed ? "text-lg" : ""}>{icon}</span>}
        {!collapsed && <span className="truncate">{label}</span>}
      </div>

      {!collapsed && badge ? (
        <span className="z-10 rounded-full bg-main-300 px-2 py-0.5 text-xs text-primary-700">{badge}</span>
      ) : null}

      {collapsed && badge ? <span className="absolute right-1 top-1 size-2 rounded-full bg-primary-600" /> : null}

      {!collapsed && hasSubItems ? (
        <span className="float-end text-xs">
          {isOpen ? <i className="bi bi-chevron-up" /> : <i className="bi bi-chevron-right" />}
        </span>
      ) : null}

      {isSubItem && !collapsed && <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-primary-600" />}
    </div>
  );

  return (
    <div className="relative">
      {to && !hasSubItems ? (
        <Link href={to} prefetch={false}>
          {content}
        </Link>
      ) : (
        content
      )}

      {hasSubItems && isOpen && !collapsed && (
        <div className="bg-main-200">
          {subItems?.map((item, index) => (
            <NavItem key={`${label}-${index}`} {...item} collapsed={collapsed} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

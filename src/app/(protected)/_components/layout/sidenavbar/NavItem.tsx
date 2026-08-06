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
  parentActive?: boolean;
  /** Accordion support: the key of the currently open sibling (top-level only) */
  openKey?: string;
  /** Accordion support: called with this item's key when it opens (top-level only) */
  onOpen?: (key: string | null) => void;
  /** Unique key for accordion tracking */
  itemKey?: string;
};

function navItemContainsPath(item: NavItemProps, pathname: string): boolean {
  return item.to === pathname || Boolean(item.subItems?.some((subItem) => navItemContainsPath(subItem, pathname)));
}

export function NavItem({
  label,
  icon,
  to,
  subItems,
  badge,
  depth = 0,
  className,
  collapsed = false,
  parentActive = false,
  openKey,
  onOpen,
  itemKey,
}: NavItemProps) {
  const pathname = usePathname();
  const isSubItem = depth > 0;
  const hasSubItems = Boolean(subItems?.length);
  const [manualOpen, setManualOpen] = useState(false);

  const isActive = Boolean(to && pathname === to);
  const isChildActive = Boolean(hasSubItems && subItems?.some((item) => navItemContainsPath(item, pathname)));

  // Accordion: if accordion control is provided, use it for top-level items.
  // Always stay open when a child is active (isChildActive).
  const isAccordionControlled = depth === 0 && onOpen !== undefined && itemKey !== undefined;
  const isAccordionOpen = isAccordionControlled ? (openKey === itemKey || isChildActive) : manualOpen;
  const isOpen = !collapsed && (isAccordionOpen || (!isAccordionControlled && manualOpen) || isChildActive);
  const openParentClasses = ["bg-main-300 text-main-0 hover:text-primary-400", "bg-main-300 text-primary-700 hover:bg-main-400", "bg-main-200 text-primary-700 hover:bg-main-300"][depth] ?? "bg-main-200 text-primary-700 hover:bg-main-300";
  const parentFocusClass = hasSubItems && (isChildActive || isOpen) ? openParentClasses : "";
  const activeParentChildClass = parentActive && isSubItem ? "bg-main-200 hover:bg-main-300" : "";

  const depthPadding = ["pl-3", "pl-8", "pl-12", "pl-16"][depth] ?? "pl-16";

  const content = (
    <div
      className={`relative flex cursor-pointer items-center py-2 pr-1 text-sm text-main-600 hover:bg-main-300 hover:text-primary-700 ${collapsed ? "pl-0" : depthPadding} ${className ?? ""}
                ${activeParentChildClass} ${isActive ? " text-primary-700" : ""} ${parentFocusClass}
                ${collapsed ? "justify-center" : "justify-between"}
            `}
      onClick={() => {
        if (!hasSubItems || collapsed) return;
        if (isAccordionControlled) {
          // If already open (and not forced open by active child), close it; otherwise open it
          const willOpen = !(openKey === itemKey);
          onOpen(willOpen ? (itemKey ?? null) : null);
        } else {
          setManualOpen((current) => !current);
        }
      }}
      title={collapsed ? label : undefined}
    >
      {hasSubItems && !collapsed && (
        <span
          className={`absolute bottom-0 left-0 top-0 w-0.5 bg-primary-600 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
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
        <span
          className={`float-end text-xs transition-transform duration-300 ${
            isOpen ? "rotate-90" : "rotate-0"
          }`}
        >
          <i className="bi bi-chevron-right" />
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

      {hasSubItems && !collapsed && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="bg-main-200">
              {subItems?.map((item, index) => (
                <NavItem key={`${label}-${index}`} {...item} collapsed={collapsed} depth={depth + 1} parentActive={isChildActive} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { NavItem, type NavItemProps } from "./NavItem";

type NavItemsProps = {
  title?: string;
  items: NavItemProps[];
  collapsed?: boolean;
};

export function NavItems({ title, items, collapsed = false }: NavItemsProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (!items.length) {
    return null;
  }

  return (
    <div>
      {title && !collapsed && (
        <div className="px-3 py-2 text-xs font-semibold uppercase text-main-500">{title}</div>
      )}
      <div className="space-y-0">
        {items.map((item, index) => {
          const key = `nav-${index}-${item.label}`;
          return (
            <NavItem
              key={index}
              {...item}
              collapsed={collapsed}
              itemKey={key}
              openKey={openKey ?? undefined}
              onOpen={setOpenKey}
            />
          );
        })}
      </div>
    </div>
  );
}

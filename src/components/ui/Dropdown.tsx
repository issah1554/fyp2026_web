import { useState, useRef, useEffect, type ReactNode } from "react";

/* =======================
   Types
======================= */

export type DropdownItem = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  subItems?: DropdownItem[];
};

export type DropdownMenuProps = {
  toggler: ReactNode;
  items: DropdownItem[];
  openMode: "hover" | "click";
};

/* =======================
   Public Component
======================= */

export function DropdownMenu({ toggler, items, openMode }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hoverProps =
    openMode === "hover"
      ? {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
      }
      : {};

  return (
    <div className="relative inline-block text-left" {...hoverProps} ref={menuRef}>
      {/* Toggler */}
      <div
        className="cursor-pointer"
        onClick={openMode === "click" ? () => setOpen((v) => !v) : undefined}
      >
        {toggler}
      </div>

      {/* Menu */}
      {open && (
        <div className="absolute left-0 mt-0.5 w-56 rounded-sm border border-main-300 bg-main-200 shadow-lg z-20">
          <DropdownList items={items} openMode={openMode} />
        </div>
      )}
    </div>
  );
}

/* =======================
   Internal Components
======================= */

type DropdownListProps = {
  items: DropdownItem[];
  openMode: "hover" | "click";
};

function DropdownList({ items, openMode }: DropdownListProps) {
  return (
    <ul className="py-1">
      {items.map((item, index) => (
        <DropdownItemRow key={index} item={item} openMode={openMode} />
      ))}
    </ul>
  );
}

type DropdownItemRowProps = {
  item: DropdownItem;
  openMode: "hover" | "click";
};

function DropdownItemRow({ item, openMode }: DropdownItemRowProps) {
  const hasSubItems = !!item.subItems?.length;
  const [subOpen, setSubOpen] = useState(false);
  const itemRef = useRef<HTMLLIElement>(null);

  // Click outside to close submenu (click mode only)
  useEffect(() => {
    if (openMode !== "click") return;

    function handleClickOutside(event: MouseEvent) {
      if (itemRef.current && !itemRef.current.contains(event.target as Node)) {
        setSubOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMode]);

  const hoverProps =
    openMode === "hover" && hasSubItems
      ? {
        onMouseEnter: () => setSubOpen(true),
        onMouseLeave: () => setSubOpen(false),
      }
      : {};

  const clickProps =
    openMode === "click" && hasSubItems
      ? {
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          setSubOpen((v) => !v);
        },
      }
      : {};

  return (
    <li
      className={`relative ${openMode === "hover" && hasSubItems ? "group" : ""}`}
      ref={itemRef}
      {...hoverProps}
    >
      {/* Item */}
      <div
        {...clickProps}
        onClick={item.onClick}
        className="flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-main-300 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {item.icon && <span className="text-main-600">{item.icon}</span>}
          <span>{item.label}</span>
        </div>
        {hasSubItems && (
          <span className="text-xs text-main-600">
            <i className="bi bi-chevron-right" />
          </span>
        )}
      </div>

      {/* Submenu */}
      {hasSubItems && (
        <div
          className={`absolute top-0 left-full ml-0.5 min-w-56 rounded-sm border border-main-300 bg-main-200 shadow-lg z-20
        ${subOpen ? "block" : "hidden"} transition-all duration-150`}
        >
          <DropdownList items={item.subItems!} openMode={openMode} />
        </div>
      )}
    </li>
  );
}

"use client";

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

type PreferredPlacement = "bottom" | "top";

type PopoverProps = {
    trigger: ReactNode;
    children: ReactNode;
    preferredPlacement?: PreferredPlacement;
    className?: string;
};

export function Popover({
    trigger,
    children,
    preferredPlacement = "bottom",
    className = "",
}: PopoverProps) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const rootRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const updatePosition = useCallback(() => {
        const triggerEl = triggerRef.current;
        const contentEl = contentRef.current;

        if (!triggerEl || !contentEl) return;

        const gap = 8;
        const padding = 12;

        const triggerRect = triggerEl.getBoundingClientRect();
        const contentRect = contentEl.getBoundingClientRect();

        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        const openTop =
            preferredPlacement === "top"
                ? spaceAbove >= contentRect.height || spaceBelow < contentRect.height
                : spaceBelow < contentRect.height && spaceAbove > spaceBelow;

        let top = openTop
            ? triggerRect.top - contentRect.height - gap
            : triggerRect.bottom + gap;

        let left = triggerRect.left;

        if (left + contentRect.width > window.innerWidth - padding) {
            left = window.innerWidth - contentRect.width - padding;
        }

        if (left < padding) left = padding;
        if (top < padding) top = padding;

        setPosition({
            top: top + window.scrollY,
            left: left + window.scrollX,
        });
    }, [preferredPlacement]);

    useLayoutEffect(() => {
        if (open) updatePosition();
    }, [open, children, updatePosition]);

    useEffect(() => {
        if (!open) return;

        function handleClickOutside(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open, updatePosition]);

    return (
        <div ref={rootRef} className="inline-block">
            <button
                ref={triggerRef}
                type="button"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={() => setOpen((prev) => !prev)}
                className="contents"
            >
                {trigger}
            </button>

            {open ? (
                <div
                    ref={contentRef}
                    style={{
                        top: position.top,
                        left: position.left,
                    }}
                    className={`absolute z-50 min-w-56 rounded-xl border border-gray-200 bg-white p-4 shadow-xl ${className}`}
                >
                    {children}
                </div>
            ) : null}
        </div>
    );
}
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* =======================
   Types
======================= */

export type ModalPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;

  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  position?: ModalPosition;

  blur?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;

  className?: string; // modal panel
  backdropClassName?: string;
};

/* =======================
   Config
======================= */

const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-5xl",
  full: "w-full h-full max-w-none",
};

const positionClasses: Record<ModalPosition, string> = {
  center: "items-center justify-center",
  top: "items-start justify-center",
  bottom: "items-end justify-center",
  left: "items-center justify-start",
  right: "items-center justify-end",
  "top-left": "items-start justify-start",
  "top-right": "items-start justify-end",
  "bottom-left": "items-end justify-start",
  "bottom-right": "items-end justify-end",
};

/* =======================
   Component
======================= */

export function Modal({
  open,
  onClose,
  children,
  size = "md",
  position = "center",
  blur = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className = "",
  backdropClassName = "",
}: ModalProps) {
  /* ESC handling */
  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEsc, onClose]);

  /* Scroll lock */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex  ${positionClasses[position]}`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-main-950/35 ${blur ? "backdrop-blur-sm" : ""
          } ${backdropClassName}`}
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${sizeClasses[size]} ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

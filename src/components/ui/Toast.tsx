"use client";

import { useEffect, useRef, useState } from "react";

type ToastVariant = "success" | "error" | "warning" | "info";
export type ToastPosition =
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";

type ToastInput =
    | string
    | {
        title?: string;
        description?: string;
        duration?: number;
        position?: ToastPosition;
    };

type ToastRecord = {
    id: number;
    title: string;
    description?: string;
    duration: number;
    exiting?: boolean;
    position?: ToastPosition;
    variant: ToastVariant;
};

type ToastAction =
    | { type: "add"; toast: ToastRecord }
    | { type: "dismiss"; id: number };

type ToastListener = (action: ToastAction) => void;

const listeners = new Set<ToastListener>();
let toastId = 0;

const toastPositions: ToastPosition[] = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
];

const variantConfig: Record<
    ToastVariant,
    { icon: string; className: string; iconClassName: string }
> = {
    success: {
        icon: "bi-check-circle",
        className: "border-success-200 bg-success-50 text-success-900",
        iconClassName: "text-success-700",
    },
    error: {
        icon: "bi-x-circle",
        className: "border-danger-200 bg-danger-50 text-danger-900",
        iconClassName: "text-danger-700",
    },
    warning: {
        icon: "bi-exclamation-triangle",
        className: "border-warning-200 bg-warning-50 text-warning-900",
        iconClassName: "text-warning-700",
    },
    info: {
        icon: "bi-info-circle",
        className: "border-info-200 bg-info-50 text-info-900",
        iconClassName: "text-info-700",
    },
};

function subscribe(listener: ToastListener) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

function publish(action: ToastAction) {
    listeners.forEach((listener) => listener(action));
}

function normalizeToast(variant: ToastVariant, input: ToastInput): ToastRecord {
    const id = ++toastId;

    if (typeof input === "string") {
        return {
            id,
            title: input,
            duration: 3000,
            variant,
        };
    }

    return {
        id,
        title: input.title || defaultTitle(variant),
        description: input.description,
        duration: input.duration ?? 3000,
        position: input.position,
        variant,
    };
}

function defaultTitle(variant: ToastVariant) {
    const titles: Record<ToastVariant, string> = {
        success: "Success",
        error: "Error",
        warning: "Warning",
        info: "Info",
    };

    return titles[variant];
}

function showToast(variant: ToastVariant, input: ToastInput) {
    const nextToast = normalizeToast(variant, input);
    publish({ type: "add", toast: nextToast });

    return nextToast.id;
}

export const toast = {
    success: (input: ToastInput) => showToast("success", input),
    error: (input: ToastInput) => showToast("error", input),
    warning: (input: ToastInput) => showToast("warning", input),
    info: (input: ToastInput) => showToast("info", input),
    dismiss: (id: number) => publish({ type: "dismiss", id }),
};

export function Toaster({
    defaultPosition = "top-right",
}: Readonly<{
    defaultPosition?: ToastPosition;
}>) {
    const [items, setItems] = useState<ToastRecord[]>([]);
    const removeTimers = useRef(new Map<number, number>());

    useEffect(() => {
        return subscribe((action) => {
            if (action.type === "add") {
                setItems((current) => [action.toast, ...current].slice(0, 5));
                return;
            }

            setItems((current) =>
                current.map((item) =>
                    item.id === action.id ? { ...item, exiting: true } : item
                )
            );

            if (!removeTimers.current.has(action.id)) {
                const timer = window.setTimeout(() => {
                    setItems((current) => current.filter((item) => item.id !== action.id));
                    removeTimers.current.delete(action.id);
                }, 420);

                removeTimers.current.set(action.id, timer);
            }
        });
    }, []);

    useEffect(() => {
        const timers = removeTimers.current;

        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
            timers.clear();
        };
    }, []);

    if (!items.length) {
        return null;
    }

    return (
        <>
            {toastPositions.map((position) => {
                const positionedItems = items.filter((item) => (item.position ?? defaultPosition) === position);

                if (!positionedItems.length) {
                    return null;
                }

                return (
                    <div
                        aria-live="polite"
                        aria-relevant="additions removals"
                        className={`pointer-events-none fixed z-80 w-[calc(100vw-2rem)] max-w-sm ${positionClasses[position]}`}
                        key={position}
                    >
                        <div className="relative min-h-24">
                            {positionedItems.map((item, index) => (
                                <ToastItem
                                    index={index}
                                    key={item.id}
                                    item={item}
                                    onDismiss={() => toast.dismiss(item.id)}
                                    position={position}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </>
    );
}

const positionClasses: Record<ToastPosition, string> = {
    "top-left": "left-4 top-4 sm:left-5",
    "top-center": "left-1/2 top-4 -translate-x-1/2",
    "top-right": "right-4 top-4 sm:right-5",
    "bottom-left": "bottom-4 left-4 sm:left-5",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4 sm:right-5",
};

function ToastItem({
    index,
    item,
    onDismiss,
    position,
}: Readonly<{
    index: number;
    item: ToastRecord;
    onDismiss: () => void;
    position: ToastPosition;
}>) {
    const config = variantConfig[item.variant];
    const isBottom = position.startsWith("bottom");
    const offset = isBottom ? index * -10 : index * 10;
    const exitOffset = isBottom ? 26 : -26;

    useEffect(() => {
        if (item.duration <= 0) {
            return;
        }

        const timer = window.setTimeout(onDismiss, item.duration);
        return () => window.clearTimeout(timer);
    }, [item.duration, onDismiss]);

    return (
        <div
            className={`absolute inset-x-0 ${isBottom ? "bottom-0" : "top-0"} flex min-h-16 gap-3 rounded-md border px-4 py-3 shadow-lg ${item.description ? "items-start" : "items-center"} ${index === 0 && !item.exiting ? "pointer-events-auto" : "pointer-events-none"} ${config.className}`}
            role={item.variant === "error" ? "alert" : "status"}
            style={{
                filter: item.exiting ? "blur(1px)" : "blur(0)",
                opacity: item.exiting ? 0 : Math.max(1 - index * 0.12, 0.5),
                transform: `translateY(${item.exiting ? offset + exitOffset : offset}px) scale(${item.exiting ? 0.92 : 1 - index * 0.035})`,
                transition: "opacity 380ms ease, transform 420ms cubic-bezier(0.22, 1, 0.36, 1), filter 380ms ease",
                zIndex: 10 - index,
            }}
        >
            <i className={`bi ${config.icon} shrink-0 text-lg ${item.description ? "mt-0.5" : ""} ${config.iconClassName}`} />

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.title}</p>
                {item.description ? (
                    <p className="mt-0.5 line-clamp-2 text-sm opacity-80">
                        {item.description}
                    </p>
                ) : null}
            </div>

            <button
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-1 opacity-70 transition hover:bg-main-0/40 hover:opacity-100"
                onClick={onDismiss}
                type="button"
            >
                <i className="bi bi-x-lg text-xs" />
            </button>
        </div>
    );
}

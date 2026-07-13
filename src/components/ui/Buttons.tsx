import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    color: "primary" | "secondary" | "accent" | "neutral" | "success" | "warning" | "error" | "info" | "light" | "dark";
    size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    variant?: "solid" | "outline" | "text";
    rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
}

export function Button({
    color,
    size,
    variant = "solid",
    rounded = "sm",
    className = "",
    children,
    type,
    ...props
}: ButtonProps) {
    const roundedClasses = {
        none: "rounded-none",
        sm: "rounded",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
    };

    const baseClasses =
        "font-sans font-medium  inline-flex items-center justify-center gap-2 focus:outline-none  transition disabled:opacity-50 disabled:cursor-not-allowed";

    const sizes = {
        xs: "text-xs px-2 py-1",
        sm: "text-sm px-3 py-1.5",
        md: "text-base px-4 py-2",
        lg: "text-lg px-5 py-2.5",
        xl: "text-xl px-6 py-3",
        "2xl": "text-2xl px-7 py-3.5",
    };

    const colorClasses = {
        primary: {
            solid: "bg-primary-600 text-main-0 hover:bg-primary-700 focus:ring-primary-400",
            outline: "border border-primary-600 text-primary-700 bg-transparent hover:bg-primary-100 focus:ring-primary-400",
            text: "text-primary-700 bg-transparent hover:bg-primary-100 focus:ring-primary-400",
        },
        secondary: {
            solid: "bg-secondary-600 text-main-0 hover:bg-secondary-700 focus:ring-secondary-400",
            outline: "border border-secondary-600 text-secondary-700 bg-transparent hover:bg-secondary-100 focus:ring-secondary-400",
            text: "text-secondary-700 bg-transparent hover:bg-secondary-100 focus:ring-secondary-400",
        },
        accent: {
            solid: "bg-accent-600 text-main-0 hover:bg-accent-700 focus:ring-accent-400",
            outline: "border border-accent-600 text-accent-700 bg-transparent hover:bg-accent-100 focus:ring-accent-400",
            text: "text-accent-700 bg-transparent hover:bg-accent-100 focus:ring-accent-400",
        },
        neutral: {
            solid: "bg-main-700 text-main-0 hover:bg-main-800 focus:ring-main-400",
            outline: "border border-main-600 text-main-700 bg-transparent hover:bg-main-100 focus:ring-main-400",
            text: "text-main-700 bg-transparent hover:bg-main-100 focus:ring-main-400",
        },
        success: {
            solid: "bg-success-600 text-main-0 hover:bg-success-700 focus:ring-success-400",
            outline: "border border-success-600 text-success-700 bg-transparent hover:bg-success-100 focus:ring-success-400",
            text: "text-success-700 bg-transparent hover:bg-success-100 focus:ring-success-400",
        },
        warning: {
            solid: "bg-warning-600 text-main-0 hover:bg-warning-700 focus:ring-warning-400",
            outline: "border border-warning-600 text-warning-700 bg-transparent hover:bg-warning-100 focus:ring-warning-400",
            text: "text-warning-700 bg-transparent hover:bg-warning-100 focus:ring-warning-400",
        },
        error: {
            solid: "bg-danger-600 text-main-0 hover:bg-danger-700 focus:ring-danger-400",
            outline: "border border-danger-600 text-danger-700 bg-transparent hover:bg-danger-100 focus:ring-danger-400",
            text: "text-danger-700 bg-transparent hover:bg-danger-100 focus:ring-danger-400",
        },
        info: {
            solid: "bg-info-600 text-main-0 hover:bg-info-700 focus:ring-info-400",
            outline: "border border-info-600 text-info-700 bg-transparent hover:bg-info-100 focus:ring-info-400",
            text: "text-info-700 bg-transparent hover:bg-info-100 focus:ring-info-400",
        },
        light: {
            solid: "bg-main-50 text-main-950 hover:bg-main-100 focus:ring-main-300",
            outline: "border border-main-200 text-main-50 bg-transparent hover:bg-main-100 focus:ring-main-300",
            text: "text-main-50 bg-transparent hover:bg-main-100 focus:ring-main-300",
        },
        dark: {
            solid: "bg-main-900 text-main-0 hover:bg-main-800 focus:ring-main-500",
            outline: "border border-main-900 text-main-900 bg-transparent hover:bg-main-100 focus:ring-main-500",
            text: "text-main-900 bg-transparent hover:bg-main-100 focus:ring-main-500",
        },
    };

    const classes = [
        baseClasses,
        roundedClasses[rounded],
        sizes[size],
        colorClasses[color][variant],
        className,
    ].join(" ");

    return (
        <button
            {...props}
            type={type ?? "button"}
            className={classes}
        >
            {children}
        </button>
    );
}

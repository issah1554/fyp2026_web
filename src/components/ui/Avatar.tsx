import React, { useState } from "react";

interface AvatarProps {
    src?: string;
    alt: string;
    size?: number;
    initials?: string;
    className?: string;
    status?: "online" | "offline" | "disabled" | "pending";
    statusBorderColor?: string;
    rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
    showEditButton?: boolean;
    onEdit?: () => void;
    style?: React.CSSProperties;
}

const statusColor: Record<NonNullable<AvatarProps["status"]>, string> = {
    online: "bg-success-600",
    offline: "bg-secondary-500",
    disabled: "bg-danger-600",
    pending: "bg-warning-600",
};

const roundedMap: Record<NonNullable<AvatarProps["rounded"]>, string> = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
};

const Avatar: React.FC<AvatarProps> = ({
    src,
    alt,
    size = 40,
    initials,
    className = "",
    status = "offline",
    statusBorderColor = "border-main-100",
    rounded = "full",
    showEditButton = false,
    onEdit,
    style = {},
}) => {
    const [imgError, setImgError] = useState(false);

    const displayInitials = (initials || alt)
        .trim()
        .split(" ")
        .map(w => w[0]?.toUpperCase())
        .slice(0, 2)
        .join("");

    const radiusClass = roundedMap[rounded];
    const cornerSize = size / 4;

    return (
        <div
            className={`relative inline-block overflow-hidden  ${className}`}
            style={{ width: size, height: size, ...style }}
            title={alt}
        >
            {src && !imgError ? (
                <img
                    src={src}
                    alt={alt}
                    onError={() => setImgError(true)}
                    className={`w-full h-full object-cover border-2 border-main-300 ${radiusClass}`}
                />
            ) : (
                <div
                        className={`flex items-center justify-center bg-main-500 text-main-100 border-2 border-main-300 font-semibold ${radiusClass}`}
                    style={{ width: "100%", height: "100%", fontSize: size / 2.5 }}
                >
                    {displayInitials}
                </div>
            )}

            {showEditButton ? (
                <button
                    type="button"
                    onClick={onEdit}
                    className={`
                        absolute bottom-0 right-0
                        flex items-center justify-center
                        rounded-full border-2 border-main-0
                        ${statusColor[status]}
                        transition
                        hover:scale-105
                        hover:shadow-md
                        focus:outline-none
                    `}
                    style={{ width: cornerSize, height: cornerSize }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3 text-main-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5h2m2 0h.01M17.586 3.586a2 2 0 112.828 2.828L7 19l-4 1 1-4L17.586 3.586z"
                        />
                    </svg>
                </button>
            ) : (
                <span
                    className={`
                        absolute bottom-0 right-0
                        rounded-full border-2 ${statusBorderColor}
                        ${statusColor[status]}
                    `}
                    style={{ width: cornerSize, height: cornerSize }}
                    title={status.charAt(0).toUpperCase() + status.slice(1)}
                />
            )}
        </div>
    );
};

export default Avatar;

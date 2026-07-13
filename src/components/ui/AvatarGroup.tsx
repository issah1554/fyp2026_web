import React from "react";
import Avatar from "./Avatar";

interface AvatarItem {
    id: string | number;
    src?: string;
    alt: string;
    initials?: string;
    status?: "online" | "offline" | "disabled" | "pending";
}

interface AvatarGroupProps {
    avatars: AvatarItem[];
    size?: number;
    max?: number;
    overlap?: number; // px
    rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
    className?: string;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
    avatars,
    size = 40,
    max = 5,
    overlap = 12,
    rounded = "full",
    className = "",
}) => {
    const visible = avatars.slice(0, max);
    const extraCount = avatars.length - max;

    return (
        <div className={`flex items-center ${className}`}>
            {visible.map((avatar, index) => (
                <div
                    key={avatar.id}
                    className={`relative cursor-pointer  transition-transform  hover:scale-110 `}
                    style={{ marginLeft: index === 0 ? 0 : -overlap, zIndex: visible.length - index, }} >
                    <div className="rounded-full transition">
                        <Avatar
                            src={avatar.src}
                            alt={avatar.alt}
                            initials={avatar.initials}
                            status={avatar.status}
                            size={size}
                            rounded={rounded}
                        />
                    </div>
                </div>
            ))}

            {extraCount > 0 && (
                <div
                    className="relative flex items-center justify-center hover:scale-110 transition-transform
                               bg-main-200 text-main-800 border-2 border-main-300 mb-1.5 hover:z-30 cursor-pointer
                               font-semibold"
                    style={{
                        width:  size - 0,
                        height: size - 0,
                        marginLeft: -overlap,
                        borderRadius: rounded === "full" ? "9999px" : undefined,
                        fontSize: size / 2.5,
                        // zIndex: 0,
                    }}
                    // names
                    title={avatars.slice(max).map(avatar => avatar.alt).join(", ")}
                >
                    +{extraCount}
                </div>
            )}
        </div>
    );
};

export default AvatarGroup;

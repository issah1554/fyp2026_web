"use client";

import { useState } from "react";

type PasswordInputProps = {
  id: string;
  name: string;
  autoComplete: string;
  placeholder: string;
  className?: string;
};

export default function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder,
  className = "",
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={isVisible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={[
          "w-full rounded-md border border-main-300 bg-main-100 px-4 pr-12 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <button
        type="button"
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        onClick={() => setIsVisible((current) => !current)}
        className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-main-600 hover:bg-main-200 hover:text-main-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <i className={`bi ${isVisible ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
      </button>
    </div>
  );
}

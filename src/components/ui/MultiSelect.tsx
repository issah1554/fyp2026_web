"use client";

import { useEffect, useRef, useState } from "react";

export type MultiSelectOption = {
  label: string;
  value: string;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options",
  label,
  disabled = false,
  className = "",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
      return;
    }

    onChange([...value, optionValue]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {label ? <label className="mb-2 block text-sm font-medium text-main-700">{label}</label> : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between border border-main-600 bg-main-100 px-4 py-2.5 text-left text-base transition disabled:cursor-not-allowed disabled:bg-main-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-main-400"
      >
        <span className={value.length === 0 ? "text-main-400" : "text-main-700"}>
          {value.length === 0 ? placeholder : `${value.length} selected`}
        </span>

        <i className={`bi bi-chevron-down text-main-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto border border-main-200 bg-main-50 p-2 shadow-xl">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 p-3 text-sm text-main-700 transition hover:bg-main-100"
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => toggleOption(option.value)}
                className="size-4 accent-primary-700"
              />

              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}

      {value.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedLabels.map((item) => (
            <span key={item} className="rounded bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

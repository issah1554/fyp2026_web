import React from "react";

// Inject a global keyframe once so the autofill animation trick works.
// The browser fires animationstart with name "autofill-detect" whenever
// :-webkit-autofill matches, giving us a reliable cross-browser signal.
const AUTOFILL_STYLE_ID = "__text-input-autofill-style__";
if (typeof document !== "undefined" && !document.getElementById(AUTOFILL_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = AUTOFILL_STYLE_ID;
    style.textContent = `
        @keyframes autofill-detect { from {} to {} }
        input:-webkit-autofill { animation-name: autofill-detect; animation-duration: 1ms; }
    `;
    document.head.appendChild(style);
}

interface TextInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "pattern" | "required"> {
    label?: string;
    inputBgColor?: string;
    helperText?: string;
    validateOnBlur?: boolean;
    color: "primary" | "secondary" | "accent" | "neutral" | "success" | "warning" | "error" | "info" | "light" | "dark";
    size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
    type?: React.HTMLInputTypeAttribute;
    placeholder?: string;
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    disabled?: boolean;
    id?: string;
    name?: string;
    pattern?: string;
    required?: boolean;
    min?: number | string;
    max?: number | string;
    step?: number | string;
}

// --- Internal SVGs ---

const EyeOpenIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="w-full h-full"
    >
        <path d="M2 12s3.636-7 10-7 10 7 10 7-3.636 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeClosedIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="w-full h-full"
    >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
        <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
);

// --- Size maps ---

const sizes = {
    xs: { input: "text-xs px-2 py-1.5", icon: "w-3.5 h-3.5", iconRight: "right-2" },
    sm: { input: "text-sm px-3 py-2", icon: "w-4 h-4", iconRight: "right-2.5" },
    md: { input: "text-base px-4 py-2.5", icon: "w-4.5 h-4.5", iconRight: "right-3" },
    lg: { input: "text-lg px-5 py-3", icon: "w-5 h-5", iconRight: "right-3.5" },
    xl: { input: "text-xl px-6 py-3.5", icon: "w-5.5 h-5.5", iconRight: "right-4" },
    "2xl": { input: "text-2xl px-7 py-4", icon: "w-6 h-6", iconRight: "right-5" },
};

const roundedClasses = {
    none: { input: "rounded-none", label: "rounded-none" },
    sm: { input: "rounded", label: "rounded-sm" },
    md: { input: "rounded-md", label: "rounded-md" },
    lg: { input: "rounded-lg", label: "rounded-lg" },
    xl: { input: "rounded-xl", label: "rounded-xl" },
    full: { input: "rounded-full", label: "rounded-full" },
};

const colorClasses = {
    primary: {
        input: "bg-transparent border border-primary-600 text-primary-700 placeholder-primary-400 focus:ring-primary-400",
        label: "bg-main-0",
        text: "text-primary-700",
        toggle: "text-primary-500 hover:text-primary-700",
    },
    secondary: {
        input: "bg-transparent border border-secondary-600 text-secondary-700 placeholder-secondary-400 focus:ring-secondary-400",
        label: "bg-main-0",
        text: "text-secondary-700",
        toggle: "text-secondary-500 hover:text-secondary-700",
    },
    accent: {
        input: "bg-transparent border border-accent-600 text-accent-700 placeholder-accent-400 focus:ring-accent-400",
        label: "bg-main-0",
        text: "text-accent-700",
        toggle: "text-accent-500 hover:text-accent-700",
    },
    neutral: {
        input: "bg-transparent border border-main-600 text-main-700 placeholder-main-400 focus:ring-main-400",
        label: "bg-main-0",
        text: "text-main-700",
        toggle: "text-main-500 hover:text-main-700",
    },
    success: {
        input: "bg-transparent border border-success-600 text-success-700 placeholder-success-400 focus:ring-success-400",
        label: "bg-main-0",
        text: "text-success-700",
        toggle: "text-success-500 hover:text-success-700",
    },
    warning: {
        input: "bg-transparent border border-warning-600 text-warning-700 placeholder-warning-400 focus:ring-warning-400",
        label: "bg-main-0",
        text: "text-warning-700",
        toggle: "text-warning-500 hover:text-warning-700",
    },
    error: {
        input: "bg-transparent border border-danger-600 text-danger-700 placeholder-danger-400 focus:ring-danger-400",
        label: "bg-main-0",
        text: "text-danger-700",
        toggle: "text-danger-500 hover:text-danger-700",
    },
    info: {
        input: "bg-transparent border border-info-600 text-info-700 placeholder-info-400 focus:ring-info-400",
        label: "bg-main-0",
        text: "text-info-700",
        toggle: "text-info-500 hover:text-info-700",
    },
    light: {
        input: "bg-transparent border border-main-200 text-main-50 placeholder-main-300 focus:ring-main-300",
        label: "bg-main-0",
        text: "text-main-50",
        toggle: "text-main-300 hover:text-main-100",
    },
    dark: {
        input: "bg-transparent border border-main-900 text-main-900 placeholder-main-500 focus:ring-main-500",
        label: "bg-main-0",
        text: "text-main-900",
        toggle: "text-main-600 hover:text-main-900",
    },
};

type TextInputStyle = React.CSSProperties & {
    "--text-input-autofill-bg"?: string;
};

const resolveBgColorValue = (bgClass?: string) => {
    if (!bgClass || bgClass === "bg-transparent") return "transparent";

    const themeColorMatch = bgClass.match(/^bg-([a-z]+)-(\d+)$/);
    if (themeColorMatch) {
        const [, colorName, shade] = themeColorMatch;
        return `var(--color-${colorName}-${shade})`;
    }

    const arbitraryColorMatch = bgClass.match(/^bg-\[(.+)\]$/);
    if (arbitraryColorMatch) {
        return arbitraryColorMatch[1].replaceAll("_", " ");
    }

    return undefined;
};

// --- Email validation ---
const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function TextInput({
    label,
    inputBgColor,
    helperText,
    validateOnBlur = true,
    color,
    size,
    rounded = "sm",
    type = "text",
    placeholder,
    value,
    onChange,
    disabled = false,
    id,
    name,
    pattern,
    required,
    min,
    max,
    step,
    style,
    ...rest
}: TextInputProps) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    const [touched, setTouched] = React.useState(false);
    const [invalid, setInvalid] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    // Password visibility toggle
    const [showPassword, setShowPassword] = React.useState(false);
    // Tracks whether the browser has autofilled this input
    const [isAutofilled, setIsAutofilled] = React.useState(false);

    // Ref used to poll for autofill on mount (catches refresh-restored autofill
    // that fires before React attaches the animationstart listener).
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Detect browser autofill via CSS animation trick.
    // Browsers apply :-webkit-autofill which triggers animationstart with
    // name "autofill-detect" (injected globally above the component).
    const handleAnimationStart: React.AnimationEventHandler<HTMLInputElement> = (e) => {
        if (e.animationName === "autofill-detect") {
            setIsAutofilled(true);
        }
    };

    // On refresh the browser restores autofill synchronously before React
    // attaches listeners, so the animationstart event is missed. We poll
    // via rAF + a 500ms safety-net timeout to catch that window.
    React.useEffect(() => {
        const check = () => {
            try {
                if (inputRef.current?.matches(":-webkit-autofill")) {
                    setIsAutofilled(true);
                }
            } catch {
                // :-webkit-autofill unsupported — animationstart is the fallback
            }
        };
        const raf = requestAnimationFrame(check);
        const timer = setTimeout(check, 500);
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(timer);
        };
    }, []);

    // Derived: what <input type> to actually render
    const resolvedInputType = React.useMemo(() => {
        if (type === "password") return showPassword ? "text" : "password";
        if (type === "number") return "number";
        if (type === "date") return "date";
        if (type === "email") return "email";
        return type;
    }, [type, showPassword]);

    // Whether right-side padding must be wider to avoid overlapping toggle button
    const hasRightAdornment = type === "password";

    const rightPaddingClass = hasRightAdornment ? "pr-10" : "";

    // --- Validation logic ---
    const validate = React.useCallback(
        (inputEl: HTMLInputElement) => {
            if (type === "email") {
                const customPattern = pattern ? new RegExp(pattern) : EMAIL_REGEX;
                return customPattern.test(inputEl.value);
            }
            if (type === "password") {
                return inputEl.value.length >= 8;
            }
            return inputEl.validity.valid;
        },
        [type, pattern]
    );

    const handleFocus = () => setIsFocused(true);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (!validateOnBlur) {
            return;
        }
        setTouched(true);
        setInvalid(!validate(e.currentTarget));
    };

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        onChange?.(e);
        if (validateOnBlur && touched) {
            setInvalid(!validate(e.currentTarget));
        }
    };

    // Number: block non-numeric keystrokes (allow control keys)
    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (type !== "number") return;
        const allowed = [
            "Backspace", "Delete", "Tab", "Escape", "Enter",
            "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            "Home", "End", ".", "-",
        ];
        if (allowed.includes(e.key)) return;
        if (e.ctrlKey || e.metaKey) return; // allow copy/paste/undo
        if (!/^\d$/.test(e.key)) {
            e.preventDefault();
        }
    };

    // Number: strip non-numeric characters on paste
    const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
        if (type !== "number") return;
        const pasted = e.clipboardData.getData("text");
        if (!/^-?\d*\.?\d*$/.test(pasted)) {
            e.preventDefault();
        }
    };

    const effectiveColor = invalid ? "error" : color;
    const theme = colorClasses[effectiveColor];
    const inputBgClass = inputBgColor ?? "bg-transparent";
    const labelBgClass = inputBgClass;
    const inputClass = theme.input.replace("bg-transparent", inputBgClass);
    const autofillBgColor = resolveBgColorValue(inputBgClass);
    const inputStyle: TextInputStyle = {
        ...style,
        ...(autofillBgColor ? { "--text-input-autofill-bg": autofillBgColor } : {}),
    };

    const shouldFloat = isFocused || !!value || isAutofilled;
    const labelBgApplied = shouldFloat ? `${labelBgClass} ${roundedClasses[rounded].label}` : "bg-transparent";

    const sizeConfig = sizes[size];

    return (
        <div className="flex flex-col gap-1 items-start text-left w-full my-3">
            <div className="relative w-full">
                {/* --- Input --- */}
                <input
                    {...rest}
                    id={inputId}
                    name={name}
                    type={resolvedInputType}
                    pattern={type === "email" ? undefined : pattern} // email pattern handled in JS
                    required={required}
                    min={min}
                    max={max}
                    step={step}
                    placeholder={label ? (isFocused ? placeholder : "") : placeholder}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    ref={inputRef}
                    onAnimationStart={handleAnimationStart}
                    disabled={disabled}
                    aria-invalid={invalid}
                    aria-describedby={helperText ? `${inputId}-help` : undefined}
                    inputMode={type === "number" ? "numeric" : undefined}
                    style={inputStyle}
                    // Date inputs need explicit width so the native picker chrome fits
                    className={[
                        "peer font-sans shadow-none focus:outline-none focus:ring-2 transition",
                        "disabled:opacity-60 disabled:cursor-not-allowed w-full",
                        "[&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_var(--text-input-autofill-bg)_inset]",
                        "[&:-webkit-autofill]:[-webkit-text-fill-color:currentColor]",
                        "[&:-webkit-autofill]:caret-current",
                        roundedClasses[rounded].input,
                        sizeConfig.input,
                        rightPaddingClass,
                        inputClass,
                        // Hide native number spinners for a cleaner look
                        type === "number" ? "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" : "",
                        // Style native date picker icon to match the color theme
                        type === "date" ? "[&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer" : "",
                    ].join(" ")}
                />

                {/* --- Floating Label --- */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className={[
                            "absolute left-3 px-1 pointer-events-none transition-all duration-200 origin-left",
                            shouldFloat
                                ? `-translate-y-1/2 scale-75 top-0 z-10 ${labelBgApplied}`
                                : "top-1/2 -translate-y-1/2 scale-100 bg-transparent",
                            theme.text,
                        ].join(" ")}
                    >
                        {label}
                        {required && <span className="ml-0.5 text-danger-600">*</span>}
                    </label>
                )}

                {/* --- Password Toggle Button --- */}
                {type === "password" && (
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((v) => !v)}
                        disabled={disabled}
                        className={[
                            "absolute top-1/2 -translate-y-1/2",
                            sizeConfig.iconRight,
                            "flex items-center justify-center",
                            "transition-colors duration-150 focus:outline-none",
                            "disabled:opacity-40 disabled:cursor-not-allowed",
                            theme.toggle,
                        ].join(" ")}
                    >
                        <span className={sizeConfig.icon}>
                            {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                        </span>
                    </button>
                )}
            </div>

            {/* --- Helper / Error text --- */}
            {helperText && (
                <p
                    id={`${inputId}-help`}
                    className={`text-xs ml-2 ${theme.text}`}
                >
                    {helperText}
                </p>
            )}
        </div>
    );
}

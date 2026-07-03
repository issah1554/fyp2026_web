<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Styling Rules

- Use Tailwind CSS utilities for all application styling.
- Do not add inline styles, CSS modules, styled-jsx, component-level CSS files, or external styling libraries.
- Do not add new styling rules to `app/globals.css` for page or component design. Keep `app/globals.css` limited to Tailwind imports, semantic token definitions, theme mapping, and truly global primitives already present in the file.
- Use only the semantic color tokens defined in `app/globals.css` through Tailwind utilities, such as `bg-main-50`, `text-main-900`, `border-main-200`, `bg-primary-600`, `text-accent-700`, `text-danger-600`, and related token shades.
- Do not use raw palette utilities such as `bg-green-500`, `text-slate-900`, `border-gray-200`, raw hex values, `rgb(...)`, `oklch(...)`, or arbitrary color values in component markup.
- If a needed semantic color is missing, update `app/globals.css` token definitions first instead of using a raw color in the component.

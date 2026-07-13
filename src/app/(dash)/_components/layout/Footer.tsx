export default function Footer() {
  return (
    <footer
      className="mt-auto border-t border-main-200 bg-main-100 py-2 text-center text-xs text-main-700 sm:py-3 sm:text-sm"
    >
      © {new Date().getFullYear()}{" "}
      <a
        href="https://databenki.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-700 underline hover:text-accent-700"
      >
        DataBENKI
      </a>
      . All rights reserved.
    </footer>
  );
}

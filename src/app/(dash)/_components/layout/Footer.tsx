export default function Footer() {
  return (
    <footer className="mt-auto border-t border-main-200 bg-main-100 py-2 text-center text-xs text-main-700 sm:py-3 sm:text-sm">
      &copy; {new Date().getFullYear()} <span className="text-primary-700">Marketia</span>. All rights reserved.
    </footer>
  );
}

export default function Footer() {
  return (
    <footer className="mt-auto bg-main-0 text-main-1000 border-main-50 border-t border-main-200 py-2 text-center text-xs text-main-700 sm:py-3 sm:text-sm">
      &copy; {new Date().getFullYear()} <span className="text-primary-700">Marketia</span>. All rights reserved.
    </footer>
  );
}

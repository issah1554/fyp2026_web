import Image from "next/image";
import Link from "next/link";

type AuthShellProps = {
  children: React.ReactNode;
  contentClassName?: string;
};

export default function AuthShell({ children, contentClassName = "" }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/rice-field.jpg')] bg-cover bg-center px-4 text-main-900">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-lg lg:grid-cols-[0.95fr_1.05fr]">
        
        <div className="flex min-h-72 items-center justify-center bg-primary-700/80 px-5 py-8 text-main-0 lg:min-h-124">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-main-0 p-3 shadow-lg shadow-primary-900">
              <Image
                src="/logo.png"
                alt=""
                width={574}
                height={597}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-normal text-main-0 sm:text-5xl">
              Marketia
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-center bg-main-0 px-5 py-7 lg:px-10">
          <div className={["w-full max-w-xl", contentClassName].filter(Boolean).join(" ")}>
            {children}

            <div className="mt-5 border-t border-main-200 pt-4">
              <Link
                href="/"
                className="flex items-center gap-3 text-sm font-bold text-main-800 hover:text-primary-700"
              >
                <i className="bi bi-arrow-left" aria-hidden="true" />
                Back to site
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

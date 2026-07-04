import Image from "next/image";
import Link from "next/link";

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/rice-field.jpg')] bg-cover bg-center px-6 text-main-900">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-lg lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex min-h-80 items-center justify-center bg-primary-700/80 px-8 py-12 text-main-0 lg:min-h-140">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-28 items-center justify-center rounded-full bg-main-0 p-4 shadow-lg shadow-primary-900">
              <Image
                src="/logo.png"
                alt=""
                width={574}
                height={597}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <h1 className="mt-8 text-4xl font-bold tracking-normal text-main-0 sm:text-5xl">
              Smart Market
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 lg:px-16 bg-main-0">
          <div className="w-full max-w-xl">
            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-bold text-main-900">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@smartmarket.test"
                  className="mt-3 w-full rounded-md border border-main-300 bg-main-100 px-4 py-4 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-bold text-main-900">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="mt-3 w-full rounded-md border border-main-300 bg-main-100 px-4 py-4 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
                />
              </div>

              <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 font-semibold text-main-800">
                  <input
                    type="checkbox"
                    name="remember"
                    className="size-5 rounded border-main-300 accent-primary-600"
                  />
                  Keep me signed in
                </label>
                <a href="#" className="font-semibold text-primary-700 hover:text-primary-800">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-md bg-primary-700 px-5 py-4 text-sm font-bold uppercase text-main-0 shadow-sm hover:bg-primary-800"
              >
                <i className="bi bi-box-arrow-in-right text-lg" aria-hidden="true" />
                Sign in
              </button>
            </form>

            <div className="mt-10 border-t border-main-200 pt-8">
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

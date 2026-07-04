import Link from "next/link";
import AuthShell from "../_components/auth-shell";

function LoginForm() {
  return (
    <>
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
            className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-3 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
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
            className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-3 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
          />
        </div>

        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 font-semibold text-main-800">
            <input
              type="checkbox"
              name="remember"
              className="size-5 rounded border-main-300 accent-primary-600"
            />
            Keep me signed in
          </label>
          <Link
            href="/auth/forgot-password"
            className="font-semibold text-primary-700 hover:text-primary-800"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-md bg-primary-700 px-5 py-3 text-sm font-bold uppercase text-main-0 shadow-sm hover:bg-primary-800"
        >
          <i className="bi bi-box-arrow-in-right text-lg" aria-hidden="true" />
          Sign in
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-semibold text-main-700">
        New to Smart Market?{" "}
        <Link href="/auth/register" className="text-primary-700 hover:text-primary-800">
          Create account
        </Link>
      </p>
    </>
  );
}

export function AuthLoginRoute() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}

export { AuthLoginRoute as default };

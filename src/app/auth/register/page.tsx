import Link from "next/link";
import AuthShell from "../_components/auth-shell";
import PasswordInput from "../_components/password-input";

export default function RegisterPage() {
  return (
    <AuthShell contentClassName="py-2 sm:px-2">
      <form className="space-y-3">
        <div>
          <label htmlFor="name" className="text-sm font-bold text-main-900">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className="mt-1.5 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
          />
        </div>

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
            className="mt-1.5 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-bold text-main-900">
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            className="mt-1.5 py-2.5"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="text-sm font-bold text-main-900">
            Confirm password
          </label>
          <PasswordInput
            id="confirm-password"
            name="confirm-password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            className="mt-1.5 py-2.5"
          />
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-md bg-primary-700 px-5 py-2.5 text-sm font-bold uppercase text-main-0 shadow-sm hover:bg-primary-800"
        >
          <i className="bi bi-person-plus text-lg" aria-hidden="true" />
          Create account
        </button>
      </form>

      <p className="mt-4 text-center text-sm font-semibold text-main-700">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary-700 hover:text-primary-800">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

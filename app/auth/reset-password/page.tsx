import Link from "next/link";
import AuthShell from "../_components/auth-shell";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <form className="space-y-4">
        <div>
          <label htmlFor="password" className="text-sm font-bold text-main-900">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a new password"
            className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-3 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="text-sm font-bold text-main-900">
            Confirm password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-3 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
          />
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-md bg-primary-700 px-5 py-3 text-sm font-bold uppercase text-main-0 shadow-sm hover:bg-primary-800"
        >
          <i className="bi bi-shield-lock text-lg" aria-hidden="true" />
          Reset password
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-semibold text-main-700">
        Back to{" "}
        <Link href="/auth/login" className="text-primary-700 hover:text-primary-800">
          sign in
        </Link>
      </p>
    </AuthShell>
  );
}

import Link from "next/link";
import AuthShell from "../_components/auth-shell";
import PasswordInput from "../_components/password-input";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <form className="space-y-4">
        <div>
          <label htmlFor="password" className="text-sm font-bold text-main-900">
            New password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a new password"
            className="mt-2 py-3"
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
            placeholder="Repeat your new password"
            className="mt-2 py-3"
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

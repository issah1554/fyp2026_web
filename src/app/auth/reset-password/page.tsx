"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AuthShell from "../_components/auth-shell";
import PasswordInput from "../_components/password-input";
import { confirmPasswordReset } from "@/src/services/auth/authService";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const token = searchParams.get("token")?.trim() ?? "";
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm-password") ?? "");

    if (!token) {
      setError("Password reset link is invalid or missing a token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await confirmPasswordReset(token, password);
      setSuccess(result.message);
      window.setTimeout(() => router.replace("/auth/login"), 1200);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Password reset failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="text-sm font-bold text-main-900">
            New password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a new password"
            required
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
            required
            className="mt-2 py-3"
          />
        </div>

        {error && (
          <div className="rounded-md border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-success-300 bg-success-100 px-4 py-3 text-sm font-semibold text-success-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-3 rounded-md bg-primary-700 px-5 py-3 text-sm font-bold uppercase text-main-0 shadow-sm hover:bg-primary-800"
        >
          <i
            className={`bi ${isSubmitting ? "bi-arrow-repeat animate-spin" : "bi-shield-lock"} text-lg`}
            aria-hidden="true"
          />
          {isSubmitting ? "Resetting..." : "Reset password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

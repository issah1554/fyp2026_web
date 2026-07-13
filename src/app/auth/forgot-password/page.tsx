"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "../_components/auth-shell";
import { requestPasswordReset } from "@/src/services/auth/authService";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      const result = await requestPasswordReset(email);
      setSuccess(result.message);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Password reset request failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="text-sm font-bold text-main-900">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@marketia.test"
            required
            className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-3 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
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
            className={`bi ${isSubmitting ? "bi-arrow-repeat animate-spin" : "bi-envelope-arrow-up"} text-lg`}
            aria-hidden="true"
          />
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-semibold text-main-700">
        Remembered your password?{" "}
        <Link href="/auth/login" className="text-primary-700 hover:text-primary-800">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

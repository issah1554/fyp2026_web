"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "../_components/auth-shell";
import PasswordInput from "../_components/password-input";
import { useAuth } from "../hooks/useAuth";

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      await login({ username, password });
      router.replace("/dash");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="text-sm font-bold text-main-900">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Enter your username"
            required
            className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-3 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-bold text-main-900">
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            className="mt-2 py-3"
          />
        </div>

        {error && (
          <div className="rounded-md border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700">
            {error}
          </div>
        )}

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
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-3 rounded-md bg-primary-700 px-5 py-3 text-sm font-bold uppercase text-main-0 shadow-sm hover:bg-primary-800"
        >
          <i
            className={`bi ${isSubmitting ? "bi-arrow-repeat animate-spin" : "bi-box-arrow-in-right"} text-lg`}
            aria-hidden="true"
          />
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-semibold text-main-700">
        New to Marketia?{" "}
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

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AuthShell from "../_components/auth-shell";
import { resendEmailVerification, verifyEmail } from "@/src/services/auth/authService";

function EmailVerificationContent() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("Enter the verification code sent to your email address.");
  const [resendError, setResendError] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendError("");
    setResendSuccess("");
    setIsVerifying(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const code = String(formData.get("code") ?? "").replace(/\D/g, "");

    try {
      const result = await verifyEmail(email, code);
      setStatus("success");
      setMessage(result.message);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Email verification failed. The code may be invalid or expired.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.form;
    const formData = form ? new FormData(form) : new FormData();
    const email = String(formData.get("email") ?? emailFromQuery).trim();
    if (!email) {
      setResendError("Enter your email address before requesting a new code.");
      return;
    }

    setResendError("");
    setResendSuccess("");
    setIsResending(true);

    try {
      const result = await resendEmailVerification(email);
      setResendSuccess(result.message);
    } catch (error) {
      setResendError(error instanceof Error ? error.message : "Could not resend the verification code. Try again.");
    } finally {
      setIsResending(false);
    }
  };

  const isSuccess = status === "success";

  return (
    <AuthShell>
      <div className="space-y-5">
        <div className="text-center">
          <div
            className={[
              "mx-auto flex size-16 items-center justify-center rounded-full border",
              isSuccess
                ? "border-success-300 bg-success-100 text-success-700"
                : status === "error"
                  ? "border-warning-300 bg-warning-100 text-warning-700"
                  : "border-info-300 bg-info-100 text-info-700",
            ].join(" ")}
          >
            <i className={`bi ${isSuccess ? "bi-check2" : "bi-shield-lock"} text-3xl`} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-main-900">Email verification</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-main-700">{message}</p>
        </div>

        {!isSuccess && (
          <form className="space-y-4" onSubmit={handleVerify}>
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
                defaultValue={emailFromQuery}
                required
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-3 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-100"
              />
            </div>

            <div>
              <label htmlFor="code" className="text-sm font-bold text-main-900">
                Verification code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                required
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 6);
                }}
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-3 text-center text-xl font-bold tracking-[0.35em] text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-100"
              />
            </div>

            {resendError && (
              <div className="rounded-md border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700">
                {resendError}
              </div>
            )}

            {resendSuccess && (
              <div className="rounded-md border border-success-300 bg-success-100 px-4 py-3 text-sm font-semibold text-success-700">
                {resendSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-primary-700 px-5 py-3 text-sm font-bold uppercase text-main-0 shadow-sm hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-main-400"
            >
              <i
                className={`bi ${isVerifying ? "bi-arrow-repeat animate-spin" : "bi-shield-check"} text-lg`}
                aria-hidden="true"
              />
              {isVerifying ? "Verifying..." : "Verify email"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-main-300 px-5 py-3 text-sm font-bold uppercase text-main-800 hover:bg-main-100 disabled:cursor-not-allowed disabled:text-main-500"
            >
              <i
                className={`bi ${isResending ? "bi-arrow-repeat animate-spin" : "bi-envelope-arrow-up"} text-lg`}
                aria-hidden="true"
              />
              {isResending ? "Sending..." : "Resend verification code"}
            </button>
          </form>
        )}

        <p className="text-center text-sm font-semibold text-main-700">
          Back to{" "}
          <Link href="/auth/login" className="text-primary-700 hover:text-primary-800">
            sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={null}>
      <EmailVerificationContent />
    </Suspense>
  );
}

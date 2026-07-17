"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthShell from "../_components/auth-shell";
import { resendEmailVerification, verifyEmail } from "@/src/services/auth/authService";

type VerificationStatus = "checking" | "success" | "error" | "idle";

function EmailVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const emailFromLink = searchParams.get("email")?.trim() ?? "";
  const [status, setStatus] = useState<VerificationStatus>(token ? "checking" : "idle");
  const [message, setMessage] = useState(
    token ? "Checking your verification link..." : "Enter your email address to receive a fresh verification link.",
  );
  const [resendError, setResendError] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    async function confirmEmail() {
      try {
        const result = await verifyEmail(token);
        if (!isMounted) {
          return;
        }
        setStatus("success");
        setMessage(result.message);
        window.setTimeout(() => router.replace("/auth/login"), 1400);
      } catch (verificationError) {
        if (!isMounted) {
          return;
        }
        setStatus("error");
        setMessage(
          verificationError instanceof Error
            ? verificationError.message
            : "Email verification failed. The link may be invalid or expired.",
        );
      }
    }

    confirmEmail();

    return () => {
      isMounted = false;
    };
  }, [router, token]);

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendError("");
    setResendSuccess("");
    setIsResending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      const result = await resendEmailVerification(email);
      setResendSuccess(result.message);
    } catch (error) {
      setResendError(error instanceof Error ? error.message : "Could not resend the verification link. Try again.");
    } finally {
      setIsResending(false);
    }
  };

  const isSuccess = status === "success";
  const isChecking = status === "checking";

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
            <i
              className={[
                "bi text-3xl",
                isChecking ? "bi-arrow-repeat animate-spin" : isSuccess ? "bi-check2" : "bi-envelope-exclamation",
              ].join(" ")}
              aria-hidden="true"
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-main-900">Email verification</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-main-700">{message}</p>
        </div>

        {!isSuccess && (
          <form className="space-y-4" onSubmit={handleResend}>
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
                defaultValue={emailFromLink}
                required
                className="mt-2 w-full rounded-md border border-main-300 bg-main-100 px-4 py-3 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
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
              disabled={isResending}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-primary-700 px-5 py-3 text-sm font-bold uppercase text-main-0 shadow-sm hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-main-400"
            >
              <i
                className={`bi ${isResending ? "bi-arrow-repeat animate-spin" : "bi-envelope-arrow-up"} text-lg`}
                aria-hidden="true"
              />
              {isResending ? "Sending..." : "Resend verification link"}
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

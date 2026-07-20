"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "../_components/auth-shell";
import PasswordInput from "../_components/password-input";
import { registerUser } from "@/src/services/auth/authService";
import { PHONE_NUMBER_ERROR, validateInternationalPhoneNumber } from "@/src/utils/phoneValidation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("name") ?? "").trim();
    const [firstName = "", ...lastNameParts] = fullName.split(/\s+/).filter(Boolean);
    const lastName = lastNameParts.join(" ");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm-password") ?? "");
    const phoneNumber = String(formData.get("phone_number") ?? "").trim();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!validateInternationalPhoneNumber(phoneNumber)) {
      setError(PHONE_NUMBER_ERROR);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerUser({
        username: String(formData.get("username") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        password,
        first_name: firstName,
        last_name: lastName,
        role: String(formData.get("role") ?? "farmer"),
        phone_number: phoneNumber,
      });

      setSuccess(result.message);
      window.setTimeout(() => router.replace("/auth/login"), 1200);
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Registration failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell contentClassName="py-2 sm:px-2">
      <form className="space-y-3" onSubmit={handleSubmit}>
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
            required
            className="mt-1.5 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
          />
        </div>

        <div>
          <label htmlFor="username" className="text-sm font-bold text-main-900">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Choose a username"
            required
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
            placeholder="name@marketia.test"
            required
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
            required
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
            required
            className="mt-1.5 py-2.5"
          />
        </div>

        <div>
          <label htmlFor="role" className="text-sm font-bold text-main-900">
            Account type
          </label>
          <select
            id="role"
            name="role"
            defaultValue="farmer"
            className="mt-1.5 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-base text-main-900 outline-none focus:border-primary-500 focus:bg-main-0"
          >
            <option value="farmer">Farmer</option>
            <option value="entrepreneur">Entrepreneur</option>
            <option value="buyer">Buyer</option>
            <option value="market_officer">Market officer</option>
            <option value="researcher">Researcher</option>
          </select>
        </div>

        <div>
          <label htmlFor="phone_number" className="text-sm font-bold text-main-900">
            Phone
          </label>
          <input
            id="phone_number"
            name="phone_number"
            type="tel"
            autoComplete="tel"
            placeholder="+255..."
            pattern="^\+[1-9][0-9]{7,14}$"
            inputMode="tel"
            title={PHONE_NUMBER_ERROR}
            className="mt-1.5 w-full rounded-md border border-main-300 bg-main-100 px-4 py-2.5 text-base text-main-900 outline-none placeholder:text-main-500 focus:border-primary-500 focus:bg-main-0"
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
          className="flex w-full items-center justify-center gap-3 rounded-md bg-primary-700 px-5 py-2.5 text-sm font-bold uppercase text-main-0 shadow-sm hover:bg-primary-800"
        >
          <i
            className={`bi ${isSubmitting ? "bi-arrow-repeat animate-spin" : "bi-person-plus"} text-lg`}
            aria-hidden="true"
          />
          {isSubmitting ? "Creating account..." : "Create account"}
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

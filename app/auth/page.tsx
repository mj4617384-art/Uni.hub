"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CampusSkyline from "@/components/CampusSkyline";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="relative flex h-screen flex-col bg-hub-bg">
      {/* Top campus banner */}
      <div className="relative h-56 shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#16244a] to-hub-bg" />
        <CampusSkyline className="absolute bottom-0 h-32 w-full" />
        <button
          onClick={() => router.back()}
          aria-label="Close"
          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white"
        >
          ✕
        </button>
      </div>

      {/* Sheet */}
      <div className="flex-1 rounded-t-xl2 bg-hub-card px-6 pt-6 pb-8 -mt-6 relative">
        {mode === "login" ? (
          <>
            <h2 className="text-2xl font-semibold">
              Uni<span className="text-hub-accentLight">.hub</span> 👋
            </h2>
            <h3 className="mt-1 text-lg font-medium">Welcome back</h3>
            <p className="mt-1 text-sm text-hub-textDim">Sign in to continue to your campus.</p>

            <form className="mt-6 flex flex-col gap-4">
              <Field label="University Email" type="email" placeholder="name@university.edu" />
              <PasswordField
                label="Password"
                show={showPassword}
                onToggle={() => setShowPassword((s) => !s)}
              />
              <div className="text-right">
                <button type="button" className="text-sm text-hub-accentLight">
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                className="mt-2 rounded-xl bg-hub-accent py-3.5 text-center font-medium text-white"
              >
                Log In
              </button>
            </form>

            <Divider />

            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-hub-border py-3.5 text-sm font-medium">
              🏛️ Continue with University SSO
            </button>

            <p className="mt-6 text-center text-sm text-hub-textDim">
              Don&apos;t have an account?{" "}
              <button className="text-hub-accentLight" onClick={() => setMode("signup")}>
                Create account
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold">
              Uni<span className="text-hub-accentLight">.hub</span>
            </h2>
            <h3 className="mt-1 text-lg font-medium">Create your account</h3>
            <p className="mt-1 text-sm text-hub-textDim">
              Use your university email to join your campus community.
            </p>

            <form className="mt-6 flex flex-col gap-4">
              <div className="flex gap-3">
                <Field label="First Name" placeholder="Enter first name" />
                <Field label="Last Name" placeholder="Enter last name" />
              </div>
              <Field label="University Email" type="email" placeholder="name@university.edu" />
              <PasswordField
                label="Password"
                show={showPassword}
                onToggle={() => setShowPassword((s) => !s)}
                placeholder="At least 6 characters"
              />
              <button
                type="submit"
                className="mt-2 rounded-xl bg-hub-accent py-3.5 text-center font-medium text-white"
              >
                Create Account
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-hub-textDim">
              Already have an account?{" "}
              <button className="text-hub-accentLight" onClick={() => setMode("login")}>
                Log in
              </button>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
}: {
  label: string;
  type?: string;
  placeholder: string;
}) {
  return (
    <label className="flex-1 text-sm">
      <span className="mb-1.5 block text-hub-textDim">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-hub-border bg-hub-card2 px-4 py-3 text-white outline-none focus:border-hub-accentLight"
      />
    </label>
  );
}

function PasswordField({
  label,
  show,
  onToggle,
  placeholder = "Enter your password",
}: {
  label: string;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1.5 block text-hub-textDim">{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className="w-full rounded-xl border border-hub-border bg-hub-card2 px-4 py-3 pr-11 text-white outline-none focus:border-hub-accentLight"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-hub-textDim"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </label>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-hub-textDim">
      <div className="h-px flex-1 bg-hub-border" />
      or
      <div className="h-px flex-1 bg-hub-border" />
    </div>
  );
}

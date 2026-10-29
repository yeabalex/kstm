"use client";

import { ArrowRight, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import ApiClient from "@/lib/ApiClient";
import { AUTH_BASE_URL } from "@/const";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader } from "./ui/loader";
import { ErrorMessage } from "./ui/toast";

export const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const apiClient = new ApiClient(AUTH_BASE_URL);
    try {
      await apiClient.post(
        "/api/v1/users/register",
        {
          firstname: firstName,
          lastname: lastName,
          email,
          password,
        },
        { withCredentials: true }
      );

      router.push("/login");
    } catch (e: any) {
      const apiMsg = e?.response?.data?.message;
      setError(
        Array.isArray(apiMsg)
          ? apiMsg[0]
          : apiMsg || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-zinc-50 flex flex-col justify-between px-4 py-8">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center font-mono text-xs font-semibold">
            K
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-950">
            KSTM
          </span>
        </Link>
        <Link
          href="/login"
          className="text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
        >
          Sign in →
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto my-auto py-10">
        <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs p-7">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 mb-1">
              Create your workspace account
            </h1>
            <p className="text-xs text-zinc-500">
              Start building and deploying knowledge-grounded AI assistants
            </p>
          </div>

          {error && (
            <ErrorMessage
              message={error}
              type="error"
              className="mb-5"
              icon={false}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-medium text-zinc-700 mb-1.5"
                >
                  First name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                    placeholder="Ada"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-medium text-zinc-700 mb-1.5"
                >
                  Last name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                    placeholder="Lovelace"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-zinc-700 mb-1.5"
              >
                Work email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-zinc-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Minimum 8 characters with uppercase, lowercase, and a number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white text-xs font-medium py-2.5 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors mt-2"
            >
              {loading ? (
                <Loader color="#fff" size="small" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-zinc-900 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] font-mono text-zinc-400">
        KSTM WORKSPACE REGISTRATION
      </div>
    </section>
  );
};

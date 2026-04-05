"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { register, login, ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const username = fd.get("username") as string;
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;
    try {
      await register({ username, email, password });
      await login(username, password);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        try {
          const body = JSON.parse(err.message);
          const first = Object.values(body)[0];
          setError(Array.isArray(first) ? first[0] : String(first));
        } catch {
          setError("Registration failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#faf1e3" }}
    >
      <div className="flex flex-col items-center w-96">
        <Image
          src="/images/register-cat.png"
          alt="Cat illustration"
          width={188}
          height={134}
          priority
        />

        <h1
          className="font-serif font-bold text-5xl mt-6 mb-8 whitespace-nowrap"
          style={{ color: "#88642a" }}
        >
          Yay, New Friend!
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
          <input
            name="username"
            type="text"
            placeholder="Username"
            required
            autoComplete="username"
            className="h-[39px] px-4 rounded-[6px] text-xs outline-none bg-transparent border w-full"
            style={{ borderColor: "#957139" }}
          />

          <input
            name="email"
            type="email"
            placeholder="Email address"
            required
            autoComplete="email"
            className="h-[39px] px-4 rounded-[6px] text-xs outline-none bg-transparent border w-full"
            style={{ borderColor: "#957139" }}
          />

          <div className="relative w-full">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              autoComplete="new-password"
              className="h-[39px] px-4 pr-12 rounded-[6px] text-xs outline-none bg-transparent border w-full"
              style={{ borderColor: "#957139" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold cursor-pointer"
              style={{ color: "#957139" }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-[43px] rounded-[46px] border font-bold text-base mt-1 cursor-pointer disabled:opacity-50"
            style={{ borderColor: "#957139", color: "#957139" }}
          >
            {loading ? "Signing up…" : "Sign Up"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-4 text-xs underline"
          style={{ color: "#957139" }}
        >
          We&apos;re already friends!
        </Link>
      </div>
    </main>
  );
}

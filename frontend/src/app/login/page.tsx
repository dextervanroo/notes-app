"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login(fd.get("username") as string, fd.get("password") as string);
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Invalid username or password."
          : "Something went wrong. Please try again.",
      );
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
          src="/images/login-cactus.png"
          alt="Cactus illustration"
          width={95}
          height={114}
          priority
        />

        <h1
          className="font-serif font-bold text-5xl mt-6 mb-8 whitespace-nowrap"
          style={{ color: "#88642a" }}
        >
          Yay, You&apos;re Back!
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 w-full"
        >
          <input
            name="username"
            type="text"
            placeholder="Username"
            required
            autoComplete="username"
            className="h-[39px] px-4 rounded-[6px] text-xs outline-none bg-transparent border w-full"
            style={{ borderColor: "#957139" }}
          />

          <div className="relative w-full">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              autoComplete="current-password"
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

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-[43px] rounded-[46px] border font-bold text-base mt-1 cursor-pointer disabled:opacity-50"
            style={{ borderColor: "#957139", color: "#957139" }}
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <Link
          href="/register"
          className="mt-4 text-xs underline"
          style={{ color: "#957139" }}
        >
          Oops! I&apos;ve never been here before
        </Link>
      </div>
    </main>
  );
}

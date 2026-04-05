"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      startTransition(() => setReady(true));
    }
  }, [router]);

  if (!ready) {
    return <div className="min-h-screen" style={{ backgroundColor: "#faf1e3" }} />;
  }

  return <>{children}</>;
}

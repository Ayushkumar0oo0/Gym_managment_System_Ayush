"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DashboardRouter() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    const role = session?.user?.role;

    if (role === "admin") {
      router.replace("/admin");
      return;
    }

    if (role === "member") {
      router.replace("/member");
      return;
    }

    // Unknown or invalid role
    router.replace("/login");
  }, [status, session, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />

        <p className="mt-4 text-sm text-zinc-400">
          Loading your dashboard...
        </p>
      </div>
    </main>
  );
}
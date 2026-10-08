"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/membership/purchase");
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-black text-2xl">
          🏋️
        </div>

        <h1 className="text-2xl font-bold">
          Let's get you started
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          Taking you to membership plans...
        </p>

        <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-white" />
        </div>
      </div>
    </main>
  );
}
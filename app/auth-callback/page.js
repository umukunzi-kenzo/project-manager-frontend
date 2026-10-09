"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const user = searchParams.get("user");

    if (token && user) {
      try {
        localStorage.setItem("token", token);
        localStorage.setItem("user", decodeURIComponent(user));
        toast.success("Signed in with Google!");
        router.replace("/dashboard");
      } catch {
        toast.error("Something went wrong. Please try again.");
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#4B0082] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
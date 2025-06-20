"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthButton from "@/components/AuthButton";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 text-gray-900 px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold mb-6">Sign up / Log in</h1>
        <p className="mb-8 text-lg text-gray-600">Sign in with Google to access the platform.</p>
        <AuthButton />
      </div>
    </main>
  );
} 
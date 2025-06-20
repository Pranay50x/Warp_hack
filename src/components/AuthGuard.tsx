"use client";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Only protect routes that are not /auth or /
  const isPublic = pathname === "/" || pathname === "/auth";

  useEffect(() => {
    if (status === "unauthenticated" && !isPublic) {
      router.replace("/auth");
    }
  }, [status, pathname, router, isPublic]);

  if (status === "loading" && !isPublic) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === "authenticated" || isPublic) {
    return <>{children}</>;
  }

  return null;
} 
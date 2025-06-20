"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <button disabled>Loading...</button>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <span>Signed in as {session.user?.email}</span>
        <button
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          onClick={() => signOut()}
        >
          Sign out
        </button>
      </div>
    );
  }
  return (
    <button
      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      onClick={() => signIn("google")}
    >
      Sign in with Google
    </button>
  );
} 
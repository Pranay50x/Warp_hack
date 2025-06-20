"use client";
import Link from "next/link";
import { BookOpen, Video, Brain, Map, Home, User } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Navigation() {
  const { data: session, status } = useSession();
  return (
    <nav className="w-full bg-[#181C2A]/90 backdrop-blur sticky top-0 z-30 shadow-lg border-b border-[#23263A]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center gap-2 text-teal-300 font-extrabold text-xl">
          <span className="inline-block">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#6C63FF" /><ellipse cx="16" cy="22" rx="10" ry="5" fill="#00C9A7" fillOpacity="0.7" /></svg>
          </span>
          WarpAI
        </Link>
        {/* Nav Links */}
        <ul className="flex items-center gap-4 md:gap-8 text-gray-200 font-medium text-base">
          <li>
            <Link href="/" className="flex items-center gap-1 hover:text-teal-300 transition"><Home size={18} /> Home</Link>
          </li>
          <li>
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-teal-300 transition"><BookOpen size={18} /> Dashboard</Link>
          </li>
          <li>
            <Link href="/mindmap" className="flex items-center gap-1 hover:text-purple-300 transition"><Map size={18} /> Mind Map</Link>
          </li>
          <li>
            <Link href="/video-generation" className="flex items-center gap-1 hover:text-blue-300 transition"><Video size={18} /> Video Lectures</Link>
          </li>
          <li>
            <Link href="/multi_agent" className="flex items-center gap-1 hover:text-orange-300 transition"><Brain size={18} /> Quizzes</Link>
          </li>
        </ul>
        {/* Auth/Profile */}
        <div className="flex items-center gap-4 ml-4">
          {status === "loading" ? (
            <span className="text-gray-400">Loading...</span>
          ) : session ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-sm text-gray-200">{session.user?.email}</span>
              <button
                className="rounded-full bg-gradient-to-br from-teal-400 via-purple-500 to-blue-500 w-9 h-9 flex items-center justify-center text-white font-bold shadow hover:scale-105 transition-all focus:outline-none"
                title="Sign out"
                onClick={() => signOut()}
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </button>
            </div>
          ) : (
            <button
              className="bg-gradient-to-r from-teal-400 via-purple-500 to-blue-500 text-white px-4 py-2 rounded-xl font-bold shadow hover:scale-105 transition-all"
              onClick={() => signIn("google")}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
} 
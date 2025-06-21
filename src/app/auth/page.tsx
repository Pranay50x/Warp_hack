"use client";
import Navigation from "../../components/Navigation";
import { User, Sparkles, ShieldCheck, Languages, BookOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthButton from "@/components/AuthButton";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

const perks = [
  {
    icon: <Sparkles size={24} className="text-yellow-300" />, text: "AI-powered personalized learning"
  },
  {
    icon: <BookOpen size={24} className="text-teal-300" />, text: "Upload your own study material"
  },
  {
    icon: <Languages size={24} className="text-purple-300" />, text: "Multilingual & voice support"
  },
  {
    icon: <ShieldCheck size={24} className="text-green-300" />, text: "Safe, private, and secure"
  },
];

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasUploadedMaterials, isLoading: onboardingLoading } = useOnboardingStatus();

  useEffect(() => {
    if (status === "authenticated" && !onboardingLoading) {
      // If user has uploaded materials, go to dashboard
      // Otherwise, go to onboarding
      if (hasUploadedMaterials) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [status, hasUploadedMaterials, onboardingLoading, router]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen w-full bg-gradient-to-br from-[#181C2A] via-[#23263A] to-[#23263A] text-gray-100 px-4 md:px-8 pt-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg bg-[#23263A] rounded-3xl shadow-2xl p-12 flex flex-col items-center text-center border border-[#2c2f4a] relative overflow-hidden">
          {/* Playful Mascot Illustration */}
          <div className="mb-6 animate-float">
            <svg width="90" height="90" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="90" cy="90" r="80" fill="#6C63FF" />
              <ellipse cx="90" cy="120" rx="55" ry="30" fill="#00C9A7" fillOpacity="0.7" />
              <circle cx="70" cy="80" r="12" fill="#fff" />
              <circle cx="110" cy="80" r="12" fill="#fff" />
              <circle cx="70" cy="80" r="6" fill="#23263A" />
              <circle cx="110" cy="80" r="6" fill="#23263A" />
              <ellipse cx="90" cy="110" rx="18" ry="8" fill="#fff" />
              <ellipse cx="90" cy="112" rx="10" ry="4" fill="#23263A" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-teal-200 drop-shadow animate-fade-in">Join WarpAI</h1>
          <p className="mb-6 text-lg text-gray-300 animate-fade-in delay-200">Sign in with Google to unlock your personalized AI study buddy!</p>
          <div className="w-full flex flex-col items-center mb-8 animate-fade-in delay-300">
            <AuthButton />
          </div>
          <ul className="w-full flex flex-col gap-3 items-start mb-2 animate-fade-in delay-400">
            {perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-3 text-base text-gray-200">
                {perk.icon}
                <span>{perk.text}</span>
              </li>
            ))}
          </ul>
          {/* Glow effect */}
          <div className="absolute -z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[180px] bg-gradient-to-br from-teal-400/20 via-purple-500/20 to-blue-500/20 rounded-full blur-2xl opacity-70 animate-pulse" />
        </div>
        <style jsx>{`
          .animate-float {
            animation: floaty 3s ease-in-out infinite alternate;
          }
          @keyframes floaty {
            0% { transform: translateY(0); }
            100% { transform: translateY(-12px); }
          }
          .animate-fade-in {
            animation: fadeIn 1.2s ease-in-out both;
          }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
          .delay-400 { animation-delay: 0.4s; }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </main>
    </>
  );
} 

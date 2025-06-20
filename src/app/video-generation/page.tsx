"use client";
import Navigation from "../../components/Navigation";
import { Video } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VideoGeneration() {
  const router = useRouter();
  return (
    <>
      <Navigation />
      <main className="min-h-screen w-full bg-gradient-to-br from-[#181C2A] via-[#23263A] to-[#23263A] text-gray-100 px-4 md:px-8 pt-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-xl bg-[#23263A] rounded-2xl shadow-xl p-10 flex flex-col items-center text-center border border-[#2c2f4a]">
          <Video size={48} className="text-blue-300 mb-4" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-teal-200 drop-shadow">AI Video Generation</h2>
          <p className="text-lg text-gray-300 mb-8">
            Generate custom video lectures from your study material. (Coming soon)
          </p>
          <button
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-400 via-purple-500 to-blue-500 text-white text-lg font-bold shadow-lg hover:scale-105 hover:from-teal-300 hover:to-purple-400 transition-all duration-200"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </>
  );
} 
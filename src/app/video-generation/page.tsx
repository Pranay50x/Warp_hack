"use client";
import { useRouter } from "next/navigation";

export default function VideoGeneration() {
  const router = useRouter();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-900 text-white">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 futuristic-glow">Video Generation</h2>
        <p className="text-lg text-gray-300 max-w-xl mx-auto mb-8">
          This feature will allow you to generate videos from your content. (Coming soon)
        </p>
        <button
          className="px-6 py-2 rounded-full bg-blue-700 hover:bg-blue-900 text-white text-lg font-semibold shadow-lg transition-all duration-200 futuristic-glow"
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    </main>
  );
} 
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const typewriterText = "Warp Hackathon";
const TYPING_SPEED = 100;
const PAUSE_AFTER_DONE = 2000;

export default function LandingPage() {
  const router = useRouter();
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);
  const [looping, setLooping] = useState(false);

  useEffect(() => {
    if (index < typewriterText.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + typewriterText[index]);
        setIndex((prev) => prev + 1);
      }, TYPING_SPEED);
      return () => clearTimeout(timeout);
    } else if (!looping) {
      setLooping(true);
      const timeout = setTimeout(() => {
        setDisplayed("");
        setIndex(0);
        setLooping(false);
      }, PAUSE_AFTER_DONE);
      return () => clearTimeout(timeout);
    }
  }, [index, looping]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 text-gray-900 px-6">
      <div className="text-center max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-6 animate-fade-in">
          {displayed}
          <span className="blinking-cursor">|</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
          Warp Hackathon is your portal to the future of collaborative learning and creativity. Harness the power of AI to generate mindmaps, interactive videos, and intuitive visual tools—all designed to boost productivity and spark innovation.
        </p>
        <button
          className="px-6 py-3 rounded-lg bg-gray-900 text-white text-lg font-medium hover:bg-gray-700 transition-all duration-200"
          onClick={() => router.push("/dashboard")}
        >
          Enter Dashboard
        </button>
      </div>

      <style jsx>{`
        .blinking-cursor {
          display: inline-block;
          margin-left: 2px;
          width: 1ch;
          animation: blink 1s steps(2, start) infinite;
        }

        @keyframes blink {
          to {
            visibility: hidden;
          }
        }

        .animate-fade-in {
          animation: fadeIn 1.2s ease-in-out both;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

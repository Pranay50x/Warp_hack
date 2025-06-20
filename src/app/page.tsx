"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Video, Brain, Languages, Mic } from "lucide-react";
import Navigation from "../components/Navigation";

const typewriterText = "Warp Hackathon";
const TYPING_SPEED = 100;
const PAUSE_AFTER_DONE = 2000;

const features = [
  {
    icon: <BookOpen size={36} className="text-teal-300" />,
    title: "Ingest Your Course Material",
    desc: "Upload PDFs, docs, slides, or audio. The AI learns from your material to personalize your experience.",
  },
  {
    icon: <Video size={36} className="text-purple-300" />,
    title: "AI Video Lectures",
    desc: "Get custom video lectures on any topic, generated just for you in your preferred language.",
  },
  {
    icon: <Brain size={36} className="text-blue-300" />,
    title: "Quizzes & Tests",
    desc: "Practice with AI-generated quizzes and tests based on your own study material.",
  },
  {
    icon: <Mic size={36} className="text-orange-300" />,
    title: "Text & Voice Access",
    desc: "Interact with the platform using text or voice, in multiple languages.",
  },
  {
    icon: <Languages size={36} className="text-lime-300" />,
    title: "Multilingual Support",
    desc: "Study in your language! The platform supports multilingual content and communication.",
  },
];

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
    <>
      <Navigation />
      <main className="min-h-screen w-full bg-gradient-to-br from-[#181C2A] via-[#23263A] to-[#23263A] text-gray-100 px-4 md:px-8">
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-12 w-full max-w-6xl mx-auto py-16">
          {/* Mascot/Illustration */}
          <div className="flex-shrink-0 mb-8 md:mb-0">
            <svg width="200" height="200" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          {/* Main Content */}
          <div className="text-center md:text-left max-w-xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 animate-fade-in">
              {displayed}
              <span className="blinking-cursor">|</span>
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold text-teal-300 mb-6 animate-fade-in delay-200">
              Your AI Study Buddy for Smarter, Fun Learning
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed animate-fade-in delay-300">
              Upload your course material, generate video lectures, take quizzes, and explore interactive mind maps—all in your language, with text and voice. Join a vibrant community of learners and make studying easy and fun!
            </p>
            <button
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-400 via-purple-500 to-blue-500 text-white text-lg font-bold shadow-lg hover:scale-105 hover:from-teal-300 hover:to-purple-400 transition-all duration-200"
              onClick={() => router.push("/auth")}
            >
              Get Started
            </button>
          </div>
        </section>
        {/* Features Section */}
        <section className="w-full max-w-6xl mx-auto py-10 md:py-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-purple-200">Features & Perks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="bg-[#23263A] rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border border-[#2c2f4a] hover:border-teal-400 transition group"
              >
                <div className="mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h4 className="text-lg font-bold mb-2 text-teal-200">{f.title}</h4>
                <p className="text-gray-300 text-base">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
        {/* Call to Action Section */}
        <section className="w-full max-w-4xl mx-auto py-10 flex flex-col items-center">
          <h4 className="text-xl md:text-2xl font-semibold text-center mb-4 text-blue-200">Ready to make learning fun and easy?</h4>
          <button
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-teal-400 via-purple-500 to-blue-500 text-white text-xl font-bold shadow-lg hover:scale-105 hover:from-teal-300 hover:to-purple-400 transition-all duration-200"
            onClick={() => router.push("/auth")}
          >
            Join Now
          </button>
        </section>
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
          .delay-200 {
            animation-delay: 0.2s;
          }
          .delay-300 {
            animation-delay: 0.3s;
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
    </>
  );
}

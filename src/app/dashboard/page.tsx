"use client";
import Navigation from "../../components/Navigation";
import { BookOpen, Video, Brain, Map, Users } from "lucide-react";
import AuthButton from "@/components/AuthButton";

const features = [
  {
    label: "Video Generation",
    icon: <Video size={32} className="text-blue-300" />,
    color: "from-blue-500 to-blue-700",
    href: "/video-generation",
    desc: "Create custom video lectures from your material."
  },
  {
    label: "Mindmap Generation",
    icon: <Map size={32} className="text-green-300" />,
    color: "from-green-500 to-green-700",
    href: "/mindmap",
    desc: "Visualize your notes and topics as interactive mind maps."
  },
  {
    label: "Translation",
    icon: <BookOpen size={32} className="text-purple-300" />,
    color: "from-purple-500 to-purple-700",
    href: "/translation",
    desc: "Translate your study material into multiple languages."
  },
  {
    label: "Multi-Agent PDF QA",
    icon: <Brain size={32} className="text-orange-300" />,
    color: "from-orange-500 to-orange-700",
    href: "/multi_agent",
    desc: "Quiz, breakdown, and Q&A from your PDFs."
  },
];

export default function Dashboard() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen w-full bg-gradient-to-br from-[#181C2A] via-[#23263A] to-[#23263A] text-gray-100 px-4 md:px-8 pt-8">
        <div className="flex justify-end mb-4"><AuthButton /></div>
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 animate-fade-in text-teal-200 drop-shadow">Welcome to your Dashboard</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Choose a feature to get started and supercharge your learning journey!
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 w-full max-w-6xl mx-auto">
          {features.map((f) => (
            <button
              key={f.label}
              onClick={() => window.location.href = f.href}
              className={`rounded-2xl bg-gradient-to-br ${f.color} hover:scale-105 text-white font-bold py-8 px-6 shadow-xl flex flex-col items-center gap-4 transition-all duration-200 group`}
            >
              <div className="mb-2 group-hover:scale-110 transition-transform">{f.icon}</div>
              <div className="text-xl mb-1">{f.label}</div>
              <div className="text-sm text-gray-100 opacity-80">{f.desc}</div>
            </button>
          ))}
        </div>
        <style jsx>{`
          .animate-fade-in {
            animation: fadeIn 1s ease-in-out both;
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

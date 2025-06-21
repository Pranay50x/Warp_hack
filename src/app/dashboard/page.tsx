"use client";
import Navigation from "../../components/Navigation";
import { BookOpen, Video, Brain, Map, Users, Upload } from "lucide-react";
import AuthButton from "@/components/AuthButton";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const { materialsCount, hasUploadedMaterials } = useOnboardingStatus();

  return (
    <>
      <Navigation />
      <main className="min-h-screen w-full bg-gradient-to-br from-[#181C2A] via-[#23263A] to-[#23263A] text-gray-100 px-4 md:px-8 pt-8">
        <div className="flex justify-end mb-4"><AuthButton /></div>
        
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 animate-fade-in text-teal-200 drop-shadow">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Learner'}!
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-6">
            Ready to continue your learning journey? Choose a feature to get started!
          </p>
          
          {/* Materials Status */}
          {hasUploadedMaterials ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-300">
              <Upload size={16} />
              <span>You have {materialsCount} study material{materialsCount !== 1 ? 's' : ''} uploaded</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300">
              <Upload size={16} />
              <span>No study materials uploaded yet</span>
            </div>
          )}
        </div>

        {/* Features Grid */}
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

        {/* Quick Actions */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8 text-purple-200">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => window.location.href = '/onboarding'}
              className="flex items-center gap-4 p-6 rounded-xl bg-[#23263A] border border-[#2c2f4a] hover:border-teal-400 transition-all duration-200 group"
            >
              <div className="p-3 rounded-lg bg-teal-500/20 group-hover:bg-teal-500/30 transition-colors">
                <Upload size={24} className="text-teal-400" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-lg">Upload More Materials</h4>
                <p className="text-gray-400">Add more study materials to improve your AI experience</p>
              </div>
            </button>
            
            <button
              onClick={() => window.location.href = '/mindmap'}
              className="flex items-center gap-4 p-6 rounded-xl bg-[#23263A] border border-[#2c2f4a] hover:border-teal-400 transition-all duration-200 group"
            >
              <div className="p-3 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <Map size={24} className="text-green-400" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-lg">Create Mind Map</h4>
                <p className="text-gray-400">Visualize your study materials as interactive mind maps</p>
              </div>
            </button>
          </div>
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

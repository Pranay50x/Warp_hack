"use client";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 text-gray-900 px-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 animate-fade-in">
          Dashboard
        </h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
          Choose a feature to get started.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3 w-full max-w-4xl">
        <DashboardButton
          label="Video Generation"
          color="bg-blue-600"
          onClick={() => router.push("/video-generation")}
        />
        <DashboardButton
          label="Mindmap Generation"
          color="bg-green-600"
          onClick={() => router.push("/mindmap/")}
        />
        <DashboardButton
          label="Translation"
          color="bg-purple-600"
          onClick={() => router.push("/translation")}
        />
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
  );
}

function DashboardButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg ${color} hover:brightness-110 text-white text-lg md:text-xl font-medium py-5 px-6 shadow-md transition-all duration-200 w-full`}
    >
      {label}
    </button>
  );
}

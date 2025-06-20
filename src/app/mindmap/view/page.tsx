"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ReactFlowProvider } from "reactflow";
import MindmapEditor from "../../../components/MindmapEditor";

export default function MindmapViewPage() {
  const router = useRouter();
  const [mindmap, setMindmap] = useState<any>(null);

  useEffect(() => {
    // Try to get mindmap from localStorage
    const data = localStorage.getItem("latestMindmap");
    if (data) {
      setMindmap(JSON.parse(data));
    }
  }, []);

  if (!mindmap) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#181a20] text-white">
        <h2 className="text-2xl font-bold mb-4">No mindmap found</h2>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#181a20] flex flex-col">
      <div className="flex items-center justify-between px-8 py-4 bg-[#23272f] shadow-md">
        <button
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700"
          onClick={() => router.back()}
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold tracking-wide">Mindmap Viewer</h1>
        <div>
          {/* Download button is inside MindmapEditor */}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full h-[80vh]">
          <ReactFlowProvider>
            <MindmapEditor mindmap={mindmap} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
} 
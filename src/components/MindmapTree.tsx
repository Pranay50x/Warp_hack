"use client";
import dynamic from "next/dynamic";
import React, { useRef, useEffect, useState } from "react";

const Tree = dynamic(() => import("react-d3-tree").then(mod => mod.Tree), {
  ssr: false,
});

type MindmapNode = {
  title?: string;
  name?: string;
  children?: MindmapNode[];
  text?: string;
  [key: string]: any;
};

type Props = {
  data: MindmapNode | null;
};

function convertToD3Tree(node: MindmapNode): any {
  if (!node) return null;
  return {
    name: node.title || node.name || "Root",
    text: node.text || undefined,
    children: node.children ? node.children.map(convertToD3Tree) : [],
  };
}

const renderCustomNode = ({ nodeDatum }: any) => {
  const maxTextWidth = 140;
  const paddingX = 20;
  const paddingY = 18;
  const lineHeight = 15;

  const name = nodeDatum.name || "Node";
  const text = nodeDatum.text || "";

  // Split long text into lines
  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";

    words.forEach((word) => {
      const testLine = line + word + " ";
      if (testLine.length * 7 < maxWidth) {
        line = testLine;
      } else {
        lines.push(line.trim());
        line = word + " ";
      }
    });

    if (line) lines.push(line.trim());
    return lines;
  };

  const wrappedTextLines = wrapText(text, maxTextWidth);
  const boxWidth = Math.max(name.length * 8, maxTextWidth) + paddingX * 2;
  const boxHeight =
    32 + (wrappedTextLines.length > 0 ? wrappedTextLines.length * lineHeight + paddingY : 0);

  return (
    <g>
      {/* Card Background */}
      <rect
        x={-boxWidth / 2}
        y={-boxHeight / 2}
        width={boxWidth}
        height={boxHeight}
        rx={18}
        fill="url(#node-gradient)"
        stroke="#1976d2"
        strokeWidth={1}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(30,136,229,0.10))' }}
      />

      {/* Title */}
      <text
        x={0}
        y={-boxHeight / 2 + 20}
        textAnchor="middle"
        fontSize="15"
        fontWeight={600}
        fill="#fff"
        fontFamily="'Segoe UI', sans-serif"
        style={{ textShadow: '0 1px 2px #1976d2' }}
      >
        {name}
      </text>

      {/* Body Text */}
      {wrappedTextLines.length > 0 &&
        wrappedTextLines.map((line, idx) => (
          <text
            key={idx}
            x={0}
            y={-boxHeight / 2 + 38 + idx * lineHeight}
            textAnchor="middle"
            fontSize="12"
            fontWeight={400}
            fill="#f3f3f3"
            fontFamily="'Segoe UI', sans-serif"
            style={{ textShadow: '0 1px 2px #1976d2' }}
          >
            {line}
          </text>
        ))}

      {/* Gradient Definition */}
      <defs>
        <linearGradient id="node-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2196f3" />
          <stop offset="100%" stopColor="#1e88e5" />
        </linearGradient>
      </defs>
    </g>
  );
};

const MindmapTree: React.FC<Props> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 500, y: 100 });
  const [zoom, setZoom] = useState(0.7);

  useEffect(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 100 });
    }
  }, [containerRef.current]);

  if (!data) return null;
  const treeData = convertToD3Tree(data);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "80vh",
        minHeight: 600,
        background: "#eef4fb",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        overflow: "auto",
        padding: "1rem",
      }}
    >
      <div style={{ marginBottom: 12, textAlign: 'right' }}>
        <button
          onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
          style={{ marginRight: 8, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
        >
          -
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
        >
          +
        </button>
      </div>
      <Tree
        data={treeData}
        orientation="vertical"
        translate={translate}
        collapsible={true}
        renderCustomNodeElement={renderCustomNode}
        pathFunc="diagonal"
        nodeSize={{ x: 200, y: 200 }}
        separation={{ siblings: 2, nonSiblings: 3 }}
        pathClassFunc={() => 'custom-link'}
        zoom={zoom}
      />
      <style jsx global>{`
        .custom-link {
          stroke: #90caf9;
          stroke-width: 1.5;
          filter: drop-shadow(0 2px 6px rgba(33,150,243,0.08));
          fill: none;
        }
      `}</style>
    </div>
  );
};

export default MindmapTree;

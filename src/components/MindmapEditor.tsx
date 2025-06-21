import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Node,
  Edge,
  Connection,
  MarkerType,
  Handle,
  Position,
  useReactFlow,
} from "reactflow";
import domtoimage from "dom-to-image";
import * as d3 from "d3-hierarchy";
import "reactflow/dist/style.css";

// Helper: Convert mindmap JSON to d3 hierarchy
function mindmapToD3Tree(mindmap: any) {
  return d3.hierarchy(mindmap, (d: any) => d.children || []);
}

// Helper: Convert d3 tree to React Flow nodes/edges (radial layout)
function d3TreeToFlow(tree: any, center = { x: 800, y: 350 }, radiusStep = 250) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const descendants = tree.descendants();
  const leaves = tree.leaves();
  const maxDepth = Math.max(...descendants.map((d: any) => d.depth));
  
  // Calculate optimal spacing based on number of nodes at each level
  const nodesAtDepth = new Map<number, any[]>();
  descendants.forEach((d: any) => {
    const depth = d.depth;
    if (!nodesAtDepth.has(depth)) {
      nodesAtDepth.set(depth, []);
    }
    nodesAtDepth.get(depth)!.push(d);
  });
  
  // Improved radial layout with better spacing
  descendants.forEach((d: any, i: number) => {
    const depth = d.depth;
    const nodesAtThisDepth = nodesAtDepth.get(depth) || [];
    const nodeIndex = nodesAtThisDepth.findIndex(node => node.data._id === d.data._id);
    
    // Calculate angle based on position within the level
    let angle;
    if (depth === 0) {
      // Root node at center
      angle = 0;
    } else {
      // Distribute nodes evenly around the circle at each level
      const totalNodesAtLevel = nodesAtThisDepth.length;
      angle = (nodeIndex / totalNodesAtLevel) * 2 * Math.PI;
    }
    
    const r = depth * radiusStep;
    const x = center.x + r * Math.cos(angle - Math.PI / 2);
    const y = center.y + r * Math.sin(angle - Math.PI / 2);
    
    nodes.push({
      id: d.data._id,
      data: {
        label: d.data.title || d.data.name || "Node",
        text: d.data.text || "",
        color: d.data.color || "#23272f",
        tags: d.data.tags || [],
        icon: d.data.icon || "",
      },
      position: { x, y },
      type: "customNode",
      style: {
        width: 200,
        minHeight: 60,
        background: d.data.color || "#23272f",
        color: "#fff",
        borderRadius: 16,
        border: "2px solid #3b82f6",
        boxShadow: "0 2px 16px #0006",
      },
      draggable: true,
    });
    
    if (d.parent) {
      edges.push({
        id: `${d.parent.data._id}->${d.data._id}`,
        source: d.parent.data._id,
        target: d.data._id,
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: false,
        style: { stroke: "#60a5fa", strokeWidth: 2, strokeDasharray: "0" },
        label: d.data.edgeLabel || "",
        labelStyle: { fill: "#fff", fontWeight: 500 },
      });
    }
  });
  return { nodes, edges };
}

// Helper: Assign unique IDs to mindmap tree
function assignIds(tree: any, prefix = "root", idx = 0) {
  tree._id = `${prefix}_${idx}`;
  if (tree.children && Array.isArray(tree.children)) {
    tree.children.forEach((child: any, i: number) => assignIds(child, tree._id, i));
  }
  return tree;
}

interface MindmapEditorProps {
  mindmap: any;
}

const CustomNode = ({ id, data, selected, setEditingNodeId, setEditValue, onAddChild, onDelete, isRoot, setSidebarNode, hideButtons }: any) => {
  return (
    <div
      style={{
        background: data.color || "#23272f",
        border: selected ? "2px solid #facc15" : "2px solid #3b82f6",
        borderRadius: 16,
        padding: 12,
        minWidth: 140,
        color: "#fff",
        boxShadow: selected ? "0 2px 16px #facc1533" : "0 2px 8px #0001",
        cursor: "pointer",
        position: "relative",
        fontFamily: "Inter, sans-serif",
      }}
      onClick={() => setSidebarNode(id)}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {data.icon && <span style={{ fontSize: 20 }}>{data.icon}</span>}
        <div
          style={{ fontWeight: 700, fontSize: 16, flex: 1 }}
          onDoubleClick={() => {
            setEditingNodeId(id);
            setEditValue(data.label);
          }}
          title="Double-click to edit title"
        >
          {data.label}
        </div>
      </div>
      {data.tags && data.tags.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
          {data.tags.map((tag: string, i: number) => (
            <span key={i} style={{ background: "#3b82f6", color: "#fff", borderRadius: 8, fontSize: 11, padding: "2px 8px" }}>{tag}</span>
          ))}
        </div>
      )}
      {data.text && <div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 4 }}>{data.text}</div>}
      {!hideButtons && (
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <button
            style={{ fontSize: 13, color: "#22d3ee", background: "#0e7490", border: "none", borderRadius: 6, padding: "2px 10px", cursor: "pointer" }}
            onClick={() => onAddChild(id)}
            title="Add child node"
          >+
          </button>
          {!isRoot && (
            <button
              style={{ fontSize: 13, color: "#c00", background: "#fee2e2", border: "none", borderRadius: 6, padding: "2px 10px", cursor: "pointer" }}
              onClick={() => onDelete(id)}
              title="Delete node"
            >
              ×
            </button>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  customNode: (props: any) => <CustomNode {...props} {...props.data.customProps} />,
};

const MindmapEditor: React.FC<MindmapEditorProps> = ({ mindmap }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [sidebarNodeId, setSidebarNodeId] = useState<string | null>(null);
  const [sidebarEdgeId, setSidebarEdgeId] = useState<string | null>(null);
  const [hideButtons, setHideButtons] = useState(false);
  const flowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  // Load mindmap JSON into nodes/edges with radial layout
  useEffect(() => {
    if (mindmap) {
      // FIX: d3tree is a hierarchy, not an array, so .sort is invalid. Remove .sort and assign x/y to d3tree as a hierarchy node.
      const treeWithIds = assignIds(JSON.parse(JSON.stringify(mindmap)));
      const d3tree = mindmapToD3Tree(treeWithIds);
      // @ts-expect-error: x and y are not typed on HierarchyNode, but d3.tree expects them
      d3tree.x = Math.PI;
      // @ts-expect-error: x and y are not typed on HierarchyNode, but d3.tree expects them
      d3tree.y = 0;
      d3.tree().size([2 * Math.PI, 3])(d3tree); // d3 radial
      const { nodes: initialNodes, edges: initialEdges } = d3TreeToFlow(d3tree);
      // Attach customProps for editing
      const withCustom = initialNodes.map((n, i) => ({
        ...n,
        data: {
          ...n.data,
          customProps: {
            setEditingNodeId,
            setEditValue,
            onAddChild: handleAddChild,
            onDelete: handleDeleteNode,
            isRoot: i === 0,
            setSidebarNode: setSidebarNodeId,
            hideButtons,
          },
        },
      }));
      setNodes(withCustom);
      setEdges(initialEdges);
    }
    // eslint-disable-next-line
  }, [mindmap, hideButtons]);

  // Add child node
  const handleAddChild = useCallback((parentId: string) => {
    setNodes((nds) => {
      const parent = nds.find((n) => n.id === parentId);
      if (!parent) return nds;
      const newId = `node_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const newNode: Node = {
        id: newId,
        data: {
          label: "New Node",
          text: "",
          color: "#23272f",
          tags: [],
          icon: "",
          customProps: {
            setEditingNodeId,
            setEditValue,
            onAddChild: handleAddChild,
            onDelete: handleDeleteNode,
            isRoot: false,
            setSidebarNode: setSidebarNodeId,
            hideButtons,
          },
        },
        position: {
          x: parent.position.x + 100,
          y: parent.position.y + 100,
        },
        type: "customNode",
        style: { width: 200, minHeight: 60, background: "#23272f" },
        draggable: true,
      };
      setEdges((eds) => eds.concat({
        id: `${parentId}->${newId}`,
        source: parentId,
        target: newId,
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: false,
        style: { stroke: "#60a5fa", strokeWidth: 2 },
      }));
      return nds.concat(newNode);
    });
  }, [setNodes, setEdges, hideButtons]);

  // Delete node (and its children)
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSidebarNodeId(null);
  }, [setNodes, setEdges]);

  // Double-click to edit node
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setEditingNodeId(node.id);
    setEditValue(node.data.label);
  }, []);

  // Save node edit
  const handleEditSave = () => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === editingNodeId
          ? {
              ...n,
              data: {
                ...n.data,
                label: editValue,
                customProps: n.data.customProps,
              },
            }
          : n
      )
    );
    setEditingNodeId(null);
    setEditValue("");
  };

  // Sidebar node/edge update handlers
  const handleSidebarNodeChange = (field: string, value: any) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === sidebarNodeId
          ? {
              ...n,
              data: {
                ...n.data,
                [field]: value,
                customProps: n.data.customProps,
              },
              style: field === "color" ? { ...n.style, background: value } : n.style,
            }
          : n
      )
    );
  };
  const handleSidebarEdgeChange = (field: string, value: any) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === sidebarEdgeId
          ? {
              ...e,
              [field]: value,
            }
          : e
      )
    );
  };

  // Node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSidebarNodeId(node.id);
    setSidebarEdgeId(null);
  }, []);
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSidebarEdgeId(edge.id);
    setSidebarNodeId(null);
  }, []);

  // Add edge on connect
  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Sidebar UI
  const sidebarNode = nodes.find((n) => n.id === sidebarNodeId);
  const sidebarEdge = edges.find((e) => e.id === sidebarEdgeId);

  // Download as SVG
  const handleDownloadSvg = async () => {
    if (!flowWrapper.current) return;
    
    // Temporarily hide buttons for SVG generation
    setHideButtons(true);
    
    // Wait for the next render cycle to ensure buttons are hidden
    setTimeout(async () => {
      const node = flowWrapper.current?.querySelector(".react-flow") as HTMLElement;
      if (!node) return;
      
      try {
        // Fit view to ensure all nodes are visible within canvas bounds
        reactFlowInstance.fitView({ 
          padding: 0.2, 
          includeHiddenNodes: false,
          minZoom: 0.3,
          maxZoom: 1.2
        });
        
        // Wait a bit for the fit view to complete
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const dataUrl = await domtoimage.toSvg(node, {
          width: 1400,
          height: 1000,
          style: {
            'transform': 'scale(1)',
            'transform-origin': 'top left',
            'background': '#181a20'
          },
          filter: (node: any) => {
            // Filter out any elements that might cause white patches
            const className = String(node.className || '');
            return !className.includes('react-flow__controls') && 
                   !className.includes('react-flow__minimap') &&
                   !className.includes('react-flow__panel');
          }
        });
        
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `mindmap-${Date.now()}.svg`;
        link.click();
      } catch (error) {
        console.error("Error generating SVG:", error);
      } finally {
        // Restore buttons after SVG generation
        setHideButtons(false);
      }
    }, 100);
  };

  return (
    <div style={{ width: "100%", height: 700, background: "#181a20", borderRadius: 12, position: "relative", display: "flex", fontFamily: "Inter, Arial, sans-serif" }}>
      {/* Sidebar */}
      {(sidebarNode || sidebarEdge) && (
        <div style={{ width: 260, background: "#23272f", color: "#fff", padding: 20, borderRadius: 12, margin: 12, boxShadow: "0 2px 16px #0006", zIndex: 20, position: "absolute", left: 0, top: 0, bottom: 0 }}>
          {sidebarNode && (
            <>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Node Settings</h3>
              <label style={{ fontSize: 13 }}>Label</label>
              <input
                value={sidebarNode.data.label}
                onChange={e => handleSidebarNodeChange("label", e.target.value)}
                style={{ width: "100%", marginBottom: 10, padding: 6, borderRadius: 6, border: "none", fontSize: 15 }}
              />
              <label style={{ fontSize: 13 }}>Text</label>
              <textarea
                value={sidebarNode.data.text}
                onChange={e => handleSidebarNodeChange("text", e.target.value)}
                style={{ width: "100%", marginBottom: 10, padding: 6, borderRadius: 6, border: "none", fontSize: 14, minHeight: 60 }}
              />
              <label style={{ fontSize: 13 }}>Color</label>
              <input
                type="color"
                value={sidebarNode.data.color}
                onChange={e => handleSidebarNodeChange("color", e.target.value)}
                style={{ width: 40, height: 30, marginBottom: 10, border: "none", background: "none" }}
              />
              <label style={{ fontSize: 13 }}>Icon (emoji)</label>
              <input
                value={sidebarNode.data.icon}
                onChange={e => handleSidebarNodeChange("icon", e.target.value)}
                style={{ width: "100%", marginBottom: 10, padding: 6, borderRadius: 6, border: "none", fontSize: 15 }}
                placeholder="e.g. 🔥"
              />
              <label style={{ fontSize: 13 }}>Tags (comma separated)</label>
              <input
                value={String(Array.isArray(sidebarNode.data.tags) ? sidebarNode.data.tags.join(", ") : (sidebarNode.data.tags || ""))}
                onChange={e => handleSidebarNodeChange("tags", e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean))}
                style={{ width: "100%", marginBottom: 10, padding: 6, borderRadius: 6, border: "none", fontSize: 15 }}
                placeholder="summary, irreversible"
              />
            </>
          )}
          {sidebarEdge && (
            <>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Edge Settings</h3>
              <label style={{ fontSize: 13 }}>Label</label>
              <input
                value={typeof sidebarEdge.label === "string" || typeof sidebarEdge.label === "number" ? sidebarEdge.label : ""}
                onChange={e => handleSidebarEdgeChange("label", e.target.value)}
                style={{ width: "100%", marginBottom: 10, padding: 6, borderRadius: 6, border: "none", fontSize: 15 }}
              />
              <label style={{ fontSize: 13 }}>Color</label>
              <input
                type="color"
                value={sidebarEdge.style?.stroke || "#60a5fa"}
                onChange={e => handleSidebarEdgeChange("style", { ...sidebarEdge.style, stroke: e.target.value })}
                style={{ width: 40, height: 30, marginBottom: 10, border: "none", background: "none" }}
              />
            </>
          )}
        </div>
      )}
      {/* Main Mindmap Canvas */}
      <div style={{ flex: 1, height: "100%" }}>
        {/* Download Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: 12 }}>
          <button
            onClick={handleDownloadSvg}
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 18px",
              fontWeight: 600,
              fontSize: 16,
              boxShadow: "0 2px 8px #0003",
              cursor: "pointer",
              marginBottom: 8,
            }}
          >
            Download
          </button>
        </div>
        <div ref={flowWrapper} style={{ width: "100%", height: 650, fontFamily: "Inter, Arial, sans-serif" }}>
          {editingNodeId && (
            <div style={{ position: "absolute", zIndex: 10, left: 40, top: 40, background: "#23272f", padding: 16, border: "1px solid #bbb", borderRadius: 8 }}>
              <input
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                style={{ fontSize: 16, padding: 4, width: 200 }}
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") handleEditSave(); }}
              />
              <button onClick={handleEditSave} style={{ marginLeft: 8 }}>Save</button>
              <button onClick={() => setEditingNodeId(null)} style={{ marginLeft: 8 }}>Cancel</button>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            onInit={() => {}}
            style={{ width: "100%", height: 650, background: "#181a20", fontFamily: "Inter, Arial, sans-serif" }}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
          >
            <Background color="#23272f" gap={32} />
            <MiniMap nodeColor={n => n.data.color || "#23272f"} maskColor="#181a20cc" />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default MindmapEditor; 

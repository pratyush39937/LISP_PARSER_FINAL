import React, { useMemo } from 'react';
import { ASTNode } from '../types/ast';
import { HighlightSpan } from './CodeEditor';

interface TreeVisualizerProps {
  ast: ASTNode | null;
  onSelectNode: (span: HighlightSpan) => void;
  activeSpan?: HighlightSpan | null;
}

interface VisualLayoutNode {
  id: string;
  name: string;
  type: string;
  badge: string;
  location: {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
  };
  x: number;
  y: number;
  children: VisualLayoutNode[];
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  ast,
  onSelectNode,
  activeSpan,
}) => {
  // Compute hierarchical layout
  const layoutRoot = useMemo(() => {
    if (!ast) return null;

    let nextX = 40;
    const levelHeight = 70;
    const nodeWidth = 110;

    function buildHierarchy(node: ASTNode, depth: number): VisualLayoutNode {
      let name: string = node.type;
      let badge: string = '';

      switch (node.type) {
        case 'Program':
          name = 'Program';
          badge = `${node.body.length} exprs`;
          break;
        case 'List':
          name = 'List';
          badge = `${node.elements.length} items`;
          break;
        case 'DottedList':
          name = 'DottedList';
          badge = `${node.head.length} + tail`;
          break;
        case 'Symbol':
          name = `Symbol: ${node.name}`;
          badge = node.name;
          break;
        case 'Number':
          name = `Number: ${node.value}`;
          badge = String(node.value);
          break;
        case 'String':
          name = `String: "${node.value}"`;
          badge = `"${node.value}"`;
          break;
        case 'Quote':
          name = 'Quote';
          badge = "'";
          break;
        case 'Error':
          name = 'Error Node';
          badge = 'Syntax Error';
          break;
      }

      let childNodes: ASTNode[] = [];
      if (node.type === 'Program') childNodes = node.body;
      else if (node.type === 'List') childNodes = node.elements;
      else if (node.type === 'DottedList') childNodes = [...node.head, node.tail];
      else if (node.type === 'Quote') childNodes = [node.inner];

      const children: VisualLayoutNode[] = [];
      for (const child of childNodes) {
        children.push(buildHierarchy(child, depth + 1));
      }

      // X position calculated based on children or nextX
      let x = nextX;
      if (children.length > 0) {
        x = (children[0].x + children[children.length - 1].x) / 2;
      } else {
        nextX += nodeWidth;
      }

      const y = 40 + depth * levelHeight;

      return {
        id: node.id,
        name,
        type: node.type,
        badge,
        location: {
          startLine: node.location.startLine,
          startCol: node.location.startCol,
          endLine: node.location.endLine,
          endCol: node.location.endCol,
        },
        x,
        y,
        children,
      };
    }

    return buildHierarchy(ast, 0);
  }, [ast]);

  if (!layoutRoot) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-mono text-xs">
        No AST available to visualize
      </div>
    );
  }

  // Flatten nodes and connections for SVG rendering
  const allNodes: VisualLayoutNode[] = [];
  const connections: { from: VisualLayoutNode; to: VisualLayoutNode }[] = [];

  function collect(node: VisualLayoutNode) {
    allNodes.push(node);
    for (const child of node.children) {
      connections.push({ from: node, to: child });
      collect(child);
    }
  }
  collect(layoutRoot);

  const maxX = Math.max(...allNodes.map((n) => n.x)) + 120;
  const maxY = Math.max(...allNodes.map((n) => n.y)) + 80;

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'Program':
        return { bg: '#1e293b', border: '#38bdf8', text: '#38bdf8' };
      case 'List':
      case 'DottedList':
        return { bg: '#1e1b4b', border: '#818cf8', text: '#c7d2fe' };
      case 'Symbol':
        return { bg: '#082f49', border: '#0284c7', text: '#7dd3fc' };
      case 'Number':
        return { bg: '#064e3b', border: '#059669', text: '#6ee7b7' };
      case 'String':
        return { bg: '#134e4a', border: '#0d9488', text: '#5eead4' };
      case 'Quote':
        return { bg: '#701a75', border: '#c026d3', text: '#f5d0fe' };
      case 'Error':
        return { bg: '#4c0519', border: '#e11d48', text: '#fda4af' };
      default:
        return { bg: '#1e293b', border: '#64748b', text: '#e2e8f0' };
    }
  };

  return (
    <div className="w-full h-full overflow-auto bg-slate-950 p-4 border border-slate-900 rounded-xl">
      <svg
        width={Math.max(650, maxX)}
        height={Math.max(380, maxY)}
        className="mx-auto block"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
          </marker>
        </defs>

        {/* Tree Connection Lines */}
        {connections.map((conn, idx) => (
          <path
            key={idx}
            d={`M ${conn.from.x} ${conn.from.y + 16} C ${conn.from.x} ${
              (conn.from.y + conn.to.y) / 2
            }, ${conn.to.x} ${(conn.from.y + conn.to.y) / 2}, ${conn.to.x} ${
              conn.to.y - 16
            }`}
            fill="none"
            stroke="#334155"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
        ))}

        {/* Tree Nodes */}
        {allNodes.map((node) => {
          const colors = getNodeColor(node.type);
          const isSelected =
            activeSpan &&
            activeSpan.startLine === node.location.startLine &&
            activeSpan.startCol === node.location.startCol;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => onSelectNode(node.location)}
              className="cursor-pointer group"
            >
              <rect
                x="-48"
                y="-16"
                width="96"
                height="32"
                rx="8"
                fill={isSelected ? '#0284c7' : colors.bg}
                stroke={isSelected ? '#38bdf8' : colors.border}
                strokeWidth={isSelected ? 2.5 : 1.5}
                className="transition-all hover:stroke-sky-300"
              />
              <text
                textAnchor="middle"
                y="3"
                fill={isSelected ? '#ffffff' : colors.text}
                fontSize="10"
                fontFamily="ui-monospace, monospace"
                fontWeight="600"
                className="pointer-events-none select-none"
              >
                {node.name.length > 13 ? node.name.slice(0, 11) + '..' : node.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

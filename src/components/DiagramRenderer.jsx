import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { DIAGRAM_TYPES } from '../utils/visualDataModel.js';

const NODE_COLORS = { independent: '#3498DB', dependent: '#27AE60', mediating: '#F39C12', moderating: '#E74C3C', default: '#3498DB' };

const DiagramRenderer = ({ diagramData, title, onEdit }) => {
  const { colors, isDarkMode } = useTheme();
  const canvasRef = useRef(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editData, setEditData] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [dragNode, setDragNode] = useState(null);
  const [nodePositions, setNodePositions] = useState({});

  const data = editData || diagramData;

  useEffect(() => {
    if (canvasRef.current && data) {
      drawDiagram();
    }
  }, [data, isDarkMode, zoom, nodePositions]);

  const getAutoLayout = useCallback(() => {
    if (!data) return {};

    if (data.diagramType === 'hierarchy' && data.hierarchy?.length > 0) {
      const hierarchy = data.hierarchy;
      const allNodes = [...new Set(hierarchy.flatMap(e => [e.from, e.to]))];
      const children = {};
      const parents = {};
      for (const edge of hierarchy) {
        (children[edge.from] = children[edge.from] || []).push(edge.to);
        parents[edge.to] = edge.from;
      }
      const roots = allNodes.filter(n => !parents[n]);
      const levels = [];
      const assignLevel = (node, depth) => {
        if (!levels[depth]) levels[depth] = [];
        levels[depth].push(node);
        for (const child of (children[node] || [])) assignLevel(child, depth + 1);
      };
      for (const root of roots) assignLevel(root, 0);

      const w = 180;
      const h = 50;
      const levelGap = 120;
      const startY = 30;
      const positions = {};

      for (let li = 0; li < levels.length; li++) {
        const nodes = levels[li];
        const totalW = nodes.length * w + (nodes.length - 1) * 30;
        let startX = Math.max(10, (800 - totalW) / 2);
        for (const node of nodes) {
          positions[`node_${node}`] = { x: startX, y: startY + li * levelGap, label: node, type: 'default', w, h };
          startX += w + 30;
        }
      }
      return positions;
    }

    const positions = {};
    const w = 200;
    const h = 50;
    const startY = 80;
    const gap = 70;

    const ivs = data.independent || [];
    const dvs = data.dependent || [];
    const meds = data.mediating || [];
    const mods = data.moderating || [];
    const maxNodes = Math.max(ivs.length, dvs.length, 1);

    ivs.forEach((name, i) => {
      const y = startY + i * (h + gap);
      positions[`iv_${i}`] = { x: 40, y, label: name, type: 'independent', w, h };
    });

    dvs.forEach((name, i) => {
      const y = startY + i * (h + gap);
      positions[`dv_${i}`] = { x: 520, y, label: name, type: 'dependent', w, h };
    });

    meds.forEach((name, i) => {
      const y = startY + maxNodes / 2 * (h + gap) + i * (h + gap);
      positions[`med_${i}`] = { x: 280, y, label: name, type: 'mediating', w, h };
    });

    mods.forEach((name, i) => {
      positions[`mod_${i}`] = { x: 120 + i * (w + 40), y: 10, label: name, type: 'moderating', w, h };
    });

    return positions;
  }, [data]);

  useEffect(() => {
    if (data && Object.keys(nodePositions).length === 0) {
      setNodePositions(getAutoLayout());
    }
  }, [data]);

  const drawDiagram = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = 600;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (title) {
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#2C3E50';
      ctx.font = 'bold 18px Times New Roman, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(title, canvas.width / 2, 8);
    }

    if (!data) return;
    const relationships = data.relationships || [];
    const positions = nodePositions;

    ctx.strokeStyle = isDarkMode ? '#6b7280' : '#666';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);

    const modPositions = Object.values(positions).filter(p => p.type === 'moderating');
    const dvPositions = Object.values(positions).filter(p => p.type === 'dependent');
    for (const mod of modPositions) {
      for (const dv of dvPositions) {
        const fromX = mod.x + mod.w / 2;
        const fromY = mod.y + mod.h;
        const toX = dv.x + dv.w / 2;
        const toY = dv.y;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
      }
    }

    ctx.setLineDash([]);
    ctx.strokeStyle = isDarkMode ? '#9ca3af' : '#666';
    ctx.lineWidth = 2;

    const drawArrow = (x1, y1, x2, y2) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.fillStyle = isDarkMode ? '#9ca3af' : '#666';
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 10 * Math.cos(angle - 0.4), y2 - 10 * Math.sin(angle - 0.4));
      ctx.lineTo(x2 - 10 * Math.cos(angle + 0.4), y2 - 10 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    };

    for (const rel of relationships) {
      const from = Object.values(positions).find(p => p.label === rel.from);
      const to = Object.values(positions).find(p => p.label === rel.to);
      if (from && to) drawArrow(from.x + from.w / 2, from.y + from.h / 2, to.x + to.w / 2, to.y + to.h / 2);
    }

    if (relationships.length === 0) {
      const ivPos = Object.values(positions).filter(p => p.type === 'independent');
      const dvPos = Object.values(positions).filter(p => p.type === 'dependent');
      const medPos = Object.values(positions).filter(p => p.type === 'mediating');
      for (const iv of ivPos) {
        for (const dv of dvPos) drawArrow(iv.x + iv.w / 2, iv.y + iv.h / 2, dv.x + dv.w / 2, dv.y + dv.h / 2);
      }
      for (const iv of ivPos) {
        for (const mv of medPos) drawArrow(iv.x + iv.w / 2, iv.y + iv.h / 2, mv.x + mv.w / 2, mv.y + mv.h / 2);
      }
      for (const mv of medPos) {
        for (const dv of dvPos) drawArrow(mv.x + mv.w / 2, mv.y + mv.h / 2, dv.x + dv.w / 2, dv.y + dv.h / 2);
      }
    }

    if (data.hierarchy?.length > 0) {
      for (const edge of data.hierarchy) {
        const from = Object.values(positions).find(p => p.label === edge.from);
        const to = Object.values(positions).find(p => p.label === edge.to);
        if (from && to) drawArrow(from.x + from.w / 2, from.y + from.h, to.x + to.w / 2, to.y);
      }
    }

    for (const pos of Object.values(positions)) {
      const color = NODE_COLORS[pos.type] || '#888';
      const x = pos.x;
      const y = pos.y;

      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, pos.w, pos.h, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Times New Roman, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayText = pos.label.length > 25 ? pos.label.substring(0, 23) + '..' : pos.label;
      ctx.fillText(displayText, x + pos.w / 2, y + pos.h / 2);

      ctx.fillStyle = isDarkMode ? '#9ca3af' : '#666';
      ctx.font = '10px Times New Roman, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const labels = { independent: 'IV', dependent: 'DV', mediating: 'Mediating', moderating: 'Moderating' };
      ctx.fillText(labels[pos.type] || '', x + pos.w / 2, y - 4);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!showEditor) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const [key, pos] of Object.entries(nodePositions)) {
      if (mx >= pos.x && mx <= pos.x + pos.w && my >= pos.y && my <= pos.y + pos.h) {
        setDragNode(key);
        return;
      }
    }
    setDragNode(null);
  };

  const handleCanvasMouseMove = (e) => {
    if (!dragNode || !showEditor) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setNodePositions(prev => ({
      ...prev,
      [dragNode]: { ...prev[dragNode], x: Math.max(0, mx - prev[dragNode].w / 2), y: Math.max(0, my - prev[dragNode].h / 2) }
    }));
  };

  const handleCanvasMouseUp = () => setDragNode(null);

  const handleEdit = () => {
    setEditData(diagramData);
    setShowEditor(true);
  };

  const handleSaveEdit = () => {
    setShowEditor(false);
    if (onEdit) onEdit(editData);
  };

  const handleDeleteNode = () => {
    if (!dragNode || !editData) return;
    const key = dragNode;
    const node = nodePositions[key];
    if (!node) return;
    const newData = { ...editData };
    const removeFrom = (arr) => arr.filter(n => n !== node.label);
    newData.independent = removeFrom(newData.independent);
    newData.dependent = removeFrom(newData.dependent);
    newData.mediating = removeFrom(newData.mediating);
    newData.moderating = removeFrom(newData.moderating);
    newData.relationships = newData.relationships.filter(r => r.from !== node.label && r.to !== node.label);
    setEditData(newData);
    setNodePositions(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setDragNode(null);
  };

  const handleResetLayout = () => {
    setNodePositions(getAutoLayout());
  };

  if (!data) {
    return <p style={{ textAlign: 'center', color: colors.textSecondary, padding: '40px' }}>No diagram data</p>;
  }

  const dragOverlay = dragNode && showEditor && nodePositions[dragNode] ? nodePositions[dragNode] : null;

  return (
    <div style={{
      backgroundColor: colors.surface, borderRadius: '12px', padding: '20px',
      marginBottom: '24px', border: `1px solid ${colors.border}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, margin: 0 }}>{title || 'Diagram'}</h4>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {onEdit && !showEditor && (
            <button onClick={handleEdit} style={{ padding: '5px 10px', backgroundColor: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.text, cursor: 'pointer', fontSize: '12px' }}>✏️ Edit</button>
          )}
          {showEditor && (
            <>
              <button onClick={handleResetLayout} style={{ padding: '5px 10px', backgroundColor: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.text, cursor: 'pointer', fontSize: '12px' }}>↺ Reset</button>
              <button onClick={handleDeleteNode} disabled={!dragNode} style={{ padding: '5px 10px', backgroundColor: dragNode ? '#E74C3C' : colors.border, border: 'none', borderRadius: '6px', color: 'white', cursor: dragNode ? 'pointer' : 'not-allowed', fontSize: '12px', opacity: dragNode ? 1 : 0.5 }}>🗑 Delete</button>
              <button onClick={handleSaveEdit} style={{ padding: '5px 10px', backgroundColor: colors.primary, border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>Done</button>
            </>
          )}
          <span style={{ fontSize: '12px', color: colors.textSecondary, marginLeft: '4px' }}>{zoom}%</span>
        </div>
      </div>

      <div
        style={{
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderRadius: '8px', padding: '4px', border: `1px solid ${colors.border}`,
          overflow: 'auto', position: 'relative', cursor: dragNode ? 'grabbing' : showEditor ? 'grab' : 'default',
          minHeight: '300px'
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '600px', display: 'block' }} />

        {dragOverlay && showEditor && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '4px 8px', backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
            fontSize: '11px', color: colors.textSecondary, textAlign: 'center',
            borderBottom: `1px solid ${colors.border}`
          }}>
            Dragging: {dragOverlay.label} — click Delete to remove
          </div>
        )}

        {showEditor && !dragNode && (
          <div style={{
            position: 'absolute', bottom: 4, left: 4,
            padding: '3px 8px', backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
            borderRadius: '4px', fontSize: '10px', color: colors.textSecondary
          }}>
            Drag boxes to reposition • Click Delete to remove
          </div>
        )}
      </div>
    </div>
  );
};

export const captureDiagramAsImage = (canvasRef) => {
  if (canvasRef?.current) return canvasRef.current.toDataURL('image/png');
  return null;
};

export default React.memo(DiagramRenderer);

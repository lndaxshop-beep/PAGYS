import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../contexts/ThemeContext';

// Initialize mermaid with default config
mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  },
  themeVariables: {
    primaryColor: '#7c3aed',
    primaryTextColor: '#1f2937',
    primaryBorderColor: '#7c3aed',
    lineColor: '#6b7280',
    secondaryColor: '#f3f4f6',
    tertiaryColor: '#f9fafb'
  }
});

const DiagramRenderer = ({ code, title, caption, onEdit }) => {
  const { colors, isDarkMode } = useTheme();
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState(code);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (code && containerRef.current) {
      renderDiagram(code);
    }
  }, [code, isDarkMode]);

  const renderDiagram = async (diagramCode) => {
    try {
      setError(null);
      
      // Update mermaid theme based on dark mode
      mermaid.initialize({
        theme: isDarkMode ? 'dark' : 'base',
        themeVariables: isDarkMode ? {
          primaryColor: '#7c3aed',
          primaryTextColor: '#f3f4f6',
          primaryBorderColor: '#7c3aed',
          lineColor: '#9ca3af',
          secondaryColor: '#374151',
          tertiaryColor: '#1f2937',
          background: '#1f2937',
          mainBkg: '#374151',
          textColor: '#f3f4f6'
        } : {
          primaryColor: '#7c3aed',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#7c3aed',
          lineColor: '#6b7280',
          secondaryColor: '#f3f4f6',
          tertiaryColor: '#f9fafb'
        }
      });
      
      const { svg } = await mermaid.render('mermaid-diagram', diagramCode);
      setSvg(svg);
    } catch (err) {
      console.error('Mermaid render error:', err);
      setError(err.message);
    }
  };

  const handleSaveEdit = () => {
    renderDiagram(editCode);
    setIsEditing(false);
    if (onEdit) {
      onEdit(editCode);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  const handleDownload = () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'diagram'}.svg`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div style={{
        backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2',
        border: `1px solid ${isDarkMode ? '#ef4444' : '#fecaca'}`,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <p style={{ color: isDarkMode ? '#fca5a5' : '#dc2626', fontWeight: '600', marginBottom: '8px' }}>
          ⚠️ Diagram Error
        </p>
        <p style={{ color: isDarkMode ? '#fecaca' : '#7f1d1d', fontSize: '14px', marginBottom: '12px' }}>
          {error}
        </p>
        {isEditing ? (
          <div>
            <textarea
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '13px',
                backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                marginBottom: '12px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSaveEdit}
                style={{
                  backgroundColor: colors.primary,
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Render Diagram
              </button>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: colors.text,
                  padding: '8px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              backgroundColor: colors.primary,
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Edit Diagram Code
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: colors.surface,
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      border: `1px solid ${colors.border}`
    }}>
      {/* Header with title and controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          {title && (
            <h4 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.text,
              marginBottom: '4px'
            }}>
              {title}
            </h4>
          )}
          {caption && (
            <p style={{
              fontSize: '14px',
              color: colors.textSecondary,
              fontStyle: 'italic'
            }}>
              {caption}
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            style={{
              padding: '4px 8px',
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              color: colors.text,
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            −
          </button>
          <span style={{ color: colors.textSecondary, fontSize: '13px', minWidth: '45px', textAlign: 'center' }}>
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            style={{
              padding: '4px 8px',
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              color: colors.text,
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            +
          </button>
          <button
            onClick={handleResetZoom}
            style={{
              padding: '4px 8px',
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              color: colors.text,
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Reset
          </button>
          
          {/* Edit button */}
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              color: colors.text,
              cursor: 'pointer',
              fontSize: '13px',
              marginLeft: '8px'
            }}
          >
            ✏️ Edit
          </button>
          
          {/* Download button */}
          <button
            onClick={handleDownload}
            style={{
              padding: '6px 12px',
              backgroundColor: colors.primary,
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            ⬇️ Download SVG
          </button>
        </div>
      </div>
      
      {/* Diagram container */}
      <div style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderRadius: '8px',
        padding: '20px',
        overflow: 'auto',
        border: `1px solid ${colors.border}`
      }}>
        {isEditing ? (
          <div>
            <textarea
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              style={{
                width: '100%',
                minHeight: '250px',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '13px',
                backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                marginBottom: '12px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSaveEdit}
                style={{
                  backgroundColor: colors.primary,
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Apply Changes
              </button>
              <button
                onClick={() => {
                  setEditCode(code);
                  setIsEditing(false);
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: colors.text,
                  padding: '10px 20px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              transition: 'transform 0.2s',
              minHeight: '200px',
              display: 'flex',
              justifyContent: 'center'
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
    </div>
  );
};

// Export diagram SVG as base64 image
export const captureDiagramAsImage = (containerRef) => {
  if (containerRef && containerRef.current) {
    const svgElement = containerRef.current.querySelector('svg');
    if (svgElement) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
  }
  return null;
};

export default DiagramRenderer;
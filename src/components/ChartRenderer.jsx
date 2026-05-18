import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { CHART_TYPES } from '../utils/visualDataModel.js';

const ACADEMIC_COLORS = ['#2C3E50', '#3498DB', '#27AE60', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E', '#16A085'];

let chartInstance = null;

const ChartRenderer = ({ chartType, data, title, caption, onEdit }) => {
  const { colors, isDarkMode } = useTheme();
  const canvasRef = useRef(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editType, setEditType] = useState(chartType || 'bar');
  const [editLabels, setEditLabels] = useState('');
  const [editValues, setEditValues] = useState('');

  useEffect(() => {
    if (canvasRef.current && data) {
      renderChart();
    }
    return () => { if (chartInstance) { chartInstance.destroy(); chartInstance = null; } };
  }, [data, chartType, isDarkMode]);

  const renderChart = async () => {
    try {
      const { Chart, BarController, BarElement, LineController, LineElement, PieController, ArcElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, Title } = await import('chart.js');
      Chart.register(BarController, BarElement, LineController, LineElement, PieController, ArcElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, Title);

      if (chartInstance) { chartInstance.destroy(); }

      const labels = data?.labels || [];
      const values = data?.values || [];
      const type = (chartType || 'bar').toLowerCase();
      const isHoriz = type === 'horizontalBar';

      const config = {
        type: isHoriz ? 'bar' : type,
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: type === 'pie' ? ACADEMIC_COLORS.slice(0, values.length) : (isHoriz || type === 'bar' ? ACADEMIC_COLORS.slice(0, values.length) : ACADEMIC_COLORS[0]),
            borderColor: type === 'pie' ? '#ffffff' : ACADEMIC_COLORS[0],
            borderWidth: type === 'pie' ? 2 : 0,
            pointBackgroundColor: ACADEMIC_COLORS[0],
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderRadius: isHoriz || type === 'bar' ? 4 : 0,
            barThickness: isHoriz || type === 'bar' ? 50 : undefined,
          }]
        },
        options: {
          indexAxis: isHoriz ? 'y' : 'x',
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: type === 'pie', position: 'right', labels: { font: { family: 'Times New Roman, serif', size: 13 }, usePointStyle: true, color: colors.text } },
            title: { display: false },
            tooltip: { backgroundColor: colors.surface, titleColor: colors.text, bodyColor: colors.text, borderColor: colors.border, borderWidth: 1 }
          },
          scales: type !== 'pie' ? {
            x: { grid: { display: true, color: isDarkMode ? '#374151' : '#e5e7eb' }, ticks: { font: { family: 'Times New Roman, serif', size: 12 }, color: colors.text } },
            y: { beginAtZero: true, grid: { display: true, color: isDarkMode ? '#374151' : '#e5e7eb' }, ticks: { font: { family: 'Times New Roman, serif', size: 12 }, color: colors.text } }
          } : {}
        }
      };

      chartInstance = new Chart(canvasRef.current, config);
    } catch (err) {
      console.error('Chart render error:', err);
    }
  };

  const handleEdit = () => {
    setEditType(chartType || 'bar');
    setEditLabels((data?.labels || []).join(', '));
    setEditValues((data?.values || []).join(', '));
    setShowEditor(true);
  };

  const handleSaveEdit = () => {
    const newLabels = editLabels.split(',').map(s => s.trim()).filter(Boolean);
    const newValues = editValues.split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v));
    const minLen = Math.min(newLabels.length, newValues.length);
    if (onEdit && minLen > 0) {
      onEdit({ chartType: editType, labels: newLabels.slice(0, minLen), values: newValues.slice(0, minLen), title, caption });
    }
    setShowEditor(false);
  };

  return (
    <div style={{
      backgroundColor: colors.surface, borderRadius: '12px', padding: '24px',
      marginBottom: '24px', border: `1px solid ${colors.border}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          {title && <h4 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{title}</h4>}
          {caption && <p style={{ fontSize: '14px', color: colors.textSecondary, fontStyle: 'italic' }}>{caption}</p>}
        </div>
        {onEdit && !showEditor && (
          <button onClick={handleEdit} style={{ padding: '6px 12px', backgroundColor: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.text, cursor: 'pointer', fontSize: '13px' }}>✏️ Edit</button>
        )}
      </div>

      {showEditor && (
        <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: colors.text, display: 'block', marginBottom: '4px' }}>Chart Type</label>
            <select value={editType} onChange={e => setEditType(e.target.value)} style={{ padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', backgroundColor: colors.input, color: colors.text }}>
              {Object.values(CHART_TYPES).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: colors.text, display: 'block', marginBottom: '4px' }}>Labels (comma-separated)</label>
            <input value={editLabels} onChange={e => setEditLabels(e.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', backgroundColor: colors.input, color: colors.text }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: colors.text, display: 'block', marginBottom: '4px' }}>Values (comma-separated)</label>
            <input value={editValues} onChange={e => setEditValues(e.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', backgroundColor: colors.input, color: colors.text }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSaveEdit} style={{ padding: '8px 16px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Apply</button>
            <button onClick={() => setShowEditor(false)} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.text, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100%', maxHeight: '400px' }} />
        {(!data || !data.labels || data.labels.length === 0) && (
          <p style={{ textAlign: 'center', color: colors.textSecondary, padding: '40px' }}>No chart data</p>
        )}
      </div>
    </div>
  );
};

export const captureChartAsImage = (canvasRef) => {
  if (canvasRef?.current) return canvasRef.current.toDataURL('image/png');
  return null;
};

export default ChartRenderer;

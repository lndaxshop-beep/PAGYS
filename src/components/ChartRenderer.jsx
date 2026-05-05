import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ChartRenderer = ({ type, data, title, caption }) => {
  const { colors, isDarkMode } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (data && canvasRef.current) {
      drawChart();
    }
  }, [data, type, isDarkMode]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set colors based on theme
    const textColor = isDarkMode ? '#f3f4f6' : '#1f2937';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
    const barColors = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
    
    if (type === 'bar' || type === 'column') {
      drawBarChart(ctx, width, height, padding, data, textColor, gridColor, barColors);
    } else if (type === 'line') {
      drawLineChart(ctx, width, height, padding, data, textColor, gridColor);
    } else if (type === 'pie') {
      drawPieChart(ctx, width, height, data, barColors);
    }
  };

  const drawBarChart = (ctx, width, height, padding, data, textColor, gridColor, colors) => {
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const labels = data.labels || [];
    const values = data.values || [];
    
    const maxValue = Math.max(...values) * 1.1;
    const barWidth = (chartWidth / values.length) * 0.7;
    const barSpacing = (chartWidth / values.length) * 0.3;
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    
    // X-axis
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw grid lines and Y-axis labels
    ctx.textAlign = 'right';
    ctx.fillStyle = textColor;
    ctx.font = '12px Inter, sans-serif';
    
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (i / 5) * chartHeight;
      const value = (i / 5) * maxValue;
      
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      ctx.fillText(value.toFixed(0), padding - 10, y + 4);
    }
    
    // Draw bars
    values.forEach((value, index) => {
      const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
      const barHeight = (value / maxValue) * chartHeight;
      const y = height - padding - barHeight;
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Bar value label
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(value, x + barWidth / 2, y - 5);
      
      // X-axis label
      ctx.fillStyle = textColor;
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(labels[index] || `Item ${index + 1}`, x + barWidth / 2, height - padding + 20);
    });
  };

  const drawLineChart = (ctx, width, height, padding, data, textColor, gridColor) => {
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const labels = data.labels || [];
    const values = data.values || [];
    
    const maxValue = Math.max(...values) * 1.1;
    const xStep = chartWidth / (values.length - 1);
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw grid
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (i / 5) * chartHeight;
      
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 3;
    
    values.forEach((value, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw points
    values.forEach((value, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (value / maxValue) * chartHeight;
      
      ctx.beginPath();
      ctx.fillStyle = '#7c3aed';
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Value label
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(value, x, y - 12);
    });
  };

  const drawPieChart = (ctx, width, height, data, colors) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;
    
    const labels = data.labels || [];
    const values = data.values || [];
    
    const total = values.reduce((sum, val) => sum + val, 0);
    let startAngle = 0;
    
    values.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Percentage label
      const percentage = ((value / total) * 100).toFixed(1);
      const labelAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${percentage}%`, labelX, labelY);
      
      startAngle += sliceAngle;
    });
    
    // Draw legend
    const legendX = width - 150;
    let legendY = 40;
    
    labels.forEach((label, index) => {
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(legendX, legendY, 15, 15);
      
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#1f2937';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${label} (${values[index]})`, legendX + 25, legendY + 7);
      
      legendY += 25;
    });
  };

  return (
    <div style={{
      backgroundColor: colors.surface,
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      border: `1px solid ${colors.border}`
    }}>
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
          fontStyle: 'italic',
          marginBottom: '20px'
        }}>
          {caption}
        </p>
      )}
      <div style={{ overflow: 'auto' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '400px',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
};

// Export chart as base64 image
export const captureChartAsImage = (canvasRef) => {
  if (canvasRef && canvasRef.current) {
    return canvasRef.current.toDataURL('image/png');
  }
  return null;
};

export default ChartRenderer;
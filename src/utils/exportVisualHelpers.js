import {
  Table, TableRow, TableCell, WidthType,
  Paragraph, TextRun, AlignmentType, ImageRun
} from 'docx';
import { sanitizeXmlText } from './sanitizeText.js';

const CHART_WIDTH = 600;
const CHART_HEIGHT = 400;
const EMUS_PER_INCH = 914400;
const TARGET_IMAGE_WIDTH_INCHES = 5.5;

const BAR_COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

const drawBarChart = (ctx, width, height, padding, data, textColor, gridColor) => {
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  const labels = data.labels || [];
  const values = data.values || [];
  const maxValue = Math.max(...values) * 1.1;
  const barWidth = (chartWidth / values.length) * 0.7;
  const barSpacing = (chartWidth / values.length) * 0.3;

  ctx.beginPath();
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 2;
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

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

  values.forEach((value, index) => {
    const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
    const barHeight = (value / maxValue) * chartHeight;
    const y = height - padding - barHeight;
    ctx.fillStyle = BAR_COLORS[index % BAR_COLORS.length];
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(value, x + barWidth / 2, y - 5);
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
  const xStep = chartWidth / Math.max(values.length - 1, 1);

  ctx.beginPath();
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 2;
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  for (let i = 0; i <= 5; i++) {
    const y = height - padding - (i / 5) * chartHeight;
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 3;
  values.forEach((value, index) => {
    const x = padding + index * xStep;
    const y = height - padding - (value / maxValue) * chartHeight;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

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
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(value, x, y - 12);
  });
};

const drawPieChart = (ctx, width, height, data) => {
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
    ctx.fillStyle = BAR_COLORS[index % BAR_COLORS.length];
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

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

  const legendX = width - 150;
  let legendY = 40;
  labels.forEach((label, index) => {
    ctx.fillStyle = BAR_COLORS[index % BAR_COLORS.length];
    ctx.fillRect(legendX, legendY, 15, 15);
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${label} (${values[index]})`, legendX + 25, legendY + 7);
    legendY += 25;
  });
};

const canvasToPngBuffer = (canvas) => {
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
};

export const renderChartToPng = (chartData) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = CHART_WIDTH;
    canvas.height = CHART_HEIGHT;
    const ctx = canvas.getContext('2d');

    const padding = 60;
    const textColor = '#1f2937';
    const gridColor = '#e5e7eb';

    ctx.clearRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

    if (chartData.title) {
      ctx.fillStyle = textColor;
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(chartData.title, CHART_WIDTH / 2, 25);
    }

    const type = (chartData.type || 'bar').toLowerCase();
    if (type === 'bar' || type === 'column') {
      drawBarChart(ctx, CHART_WIDTH, CHART_HEIGHT, padding, chartData.data || chartData, textColor, gridColor);
    } else if (type === 'line') {
      drawLineChart(ctx, CHART_WIDTH, CHART_HEIGHT, padding, chartData.data || chartData, textColor, gridColor);
    } else if (type === 'pie') {
      drawPieChart(ctx, CHART_WIDTH, CHART_HEIGHT, chartData.data || chartData);
    }

    return canvasToPngBuffer(canvas);
  } catch (err) {
    console.error('Chart render failed:', err);
    return null;
  }
};

export const renderMermaidToPng = async (code) => {
  try {
    const mod = await import('mermaid');
    const mermaid = mod.default || mod;
    await mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      themeVariables: {
        primaryColor: '#7c3aed',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#7c3aed',
        lineColor: '#6b7280',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#f9fafb'
      }
    });
    const { svg } = await mermaid.render('export-diagram', code);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    });

    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    ctx.scale(2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);

    return canvasToPngBuffer(canvas);
  } catch (err) {
    console.error('Mermaid render failed for export:', err);
    return null;
  }
};

export const buildDocxTable = (tableData, format) => {
  const headers = tableData.headers || [];
  const rows = tableData.rows || [];
  const fontFamily = format.fontFamily || 'Times New Roman';

  const headerCells = headers.map(h => new TableCell({
    shading: { type: 'clear', fill: 'F3F4F6' },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: sanitizeXmlText(String(h)), bold: true, size: 24, font: fontFamily })]
    })]
  }));

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map(cell => new TableCell({
      shading: ri % 2 === 1 ? { type: 'clear', fill: 'FAFAFA' } : undefined,
      children: [new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: sanitizeXmlText(String(cell)), size: 24, font: fontFamily })]
      })]
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headerCells
      }),
      ...dataRows
    ]
  });
};

export const buildImageParagraph = (pngBuffer, caption, format) => {
  const aspectRatio = CHART_HEIGHT / CHART_WIDTH;
  const targetWidthEmu = Math.round(TARGET_IMAGE_WIDTH_INCHES * EMUS_PER_INCH);
  const targetHeightEmu = Math.round(targetWidthEmu * aspectRatio);

  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [
        new ImageRun({
          data: pngBuffer,
          transformation: { width: targetWidthEmu, height: targetHeightEmu },
          type: 'png'
        })
      ]
    })
  );

  if (caption) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: sanitizeXmlText(caption), italics: true, size: 22, font: format.fontFamily })]
      })
    );
  }

  return children;
};

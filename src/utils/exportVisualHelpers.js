import {
  Table, TableRow, TableCell, WidthType,
  Paragraph, TextRun, AlignmentType, ImageRun
} from 'docx';
import { sanitizeXmlText } from './sanitizeText.js';

const CHART_WIDTH = 1200;
const CHART_HEIGHT = 800;
const PIXELS_PER_INCH = 96;
const TARGET_IMAGE_WIDTH_INCHES = 5.5;

const CHART_COLORS = ['#4F81BD', '#C0504D', '#9BBB59', '#8064A2', '#F79646', '#4BACC6', '#1F497D', '#953735', '#6B8F37', '#57398D'];

const drawBarChart = (ctx, width, height, padding, data, textColor, gridColor) => {
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  const labels = data.labels || [];
  const values = data.values || [];
  const maxValue = Math.max(...values) * 1.1;
  const barWidth = (chartWidth / values.length) * 0.7;
  const barSpacing = (chartWidth / values.length) * 0.3;

  ctx.beginPath();
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  ctx.textAlign = 'right';
  ctx.fillStyle = textColor;
  ctx.font = '22px Times New Roman, serif';
  for (let i = 0; i <= 5; i++) {
    const y = height - padding - (i / 5) * chartHeight;
    const value = (i / 5) * maxValue;
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(Number.isInteger(value) ? value.toString() : value.toFixed(1), padding - 12, y + 7);
  }

  values.forEach((value, index) => {
    const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
    const barHeight = (value / maxValue) * chartHeight;
    const y = height - padding - barHeight;
    ctx.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Times New Roman, serif';
    ctx.fillText(value.toString(), x + barWidth / 2, y - 8);
    ctx.fillStyle = textColor;
    ctx.font = '20px Times New Roman, serif';
    ctx.fillText(labels[index] || `Item ${index + 1}`, x + barWidth / 2, height - padding + 35);
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
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  ctx.textAlign = 'right';
  ctx.fillStyle = textColor;
  ctx.font = '22px Times New Roman, serif';
  for (let i = 0; i <= 5; i++) {
    const y = height - padding - (i / 5) * chartHeight;
    const value = (i / 5) * maxValue;
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(Number.isInteger(value) ? value.toString() : value.toFixed(1), padding - 12, y + 7);
  }

  ctx.beginPath();
  ctx.strokeStyle = '#4F81BD';
  ctx.lineWidth = 4;
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
    ctx.fillStyle = '#4F81BD';
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Times New Roman, serif';
    ctx.fillText(value.toString(), x, y - 18);
  });

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.font = '20px Times New Roman, serif';
  labels.forEach((label, index) => {
    const x = padding + index * xStep;
    ctx.fillText(label, x, height - padding + 35);
  });
};

const drawPieChart = (ctx, width, height, data) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 120;
  const labels = data.labels || [];
  const values = data.values || [];
  const total = values.reduce((sum, val) => sum + val, 0);
  let startAngle = 0;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  values.forEach((value, index) => {
    const sliceAngle = (value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const percentage = ((value / total) * 100).toFixed(1);
    const labelAngle = startAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.65);
    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.65);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Times New Roman, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${percentage}%`, labelX, labelY);
    startAngle += sliceAngle;
  });

  const legendX = width - 300;
  let legendY = 60;
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 22px Times New Roman, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Legend', legendX, legendY - 30);
  labels.forEach((label, index) => {
    ctx.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
    ctx.fillRect(legendX, legendY, 22, 22);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, 22, 22);
    ctx.fillStyle = '#333333';
    ctx.font = '20px Times New Roman, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${label} (${values[index]})`, legendX + 32, legendY + 11);
    legendY += 36;
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

    const padding = 120;
    const textColor = '#333333';
    const gridColor = '#d9d9d9';

    ctx.clearRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

    if (chartData.title) {
      ctx.fillStyle = textColor;
      ctx.font = 'bold 32px Times New Roman, serif';
      ctx.textAlign = 'center';
      ctx.fillText(chartData.title, CHART_WIDTH / 2, 45);
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
      fontFamily: 'Times New Roman, serif',
      themeVariables: {
        primaryColor: '#4F81BD',
        primaryTextColor: '#333333',
        primaryBorderColor: '#4F81BD',
        lineColor: '#666666',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#f9fafb',
        fontSize: '14px'
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

    const scale = 3;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);

    return { pngBuffer: canvasToPngBuffer(canvas), width: img.width, height: img.height };
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

export const buildImageParagraph = (pngBuffer, caption, format, customAspectRatio) => {
  const aspectRatio = customAspectRatio || (CHART_HEIGHT / CHART_WIDTH);
  const targetWidthPx = Math.round(TARGET_IMAGE_WIDTH_INCHES * PIXELS_PER_INCH);
  const targetHeightPx = Math.round(targetWidthPx * aspectRatio);

  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [
        new ImageRun({
          data: pngBuffer,
          transformation: { width: targetWidthPx, height: targetHeightPx },
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

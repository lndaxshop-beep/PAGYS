import {
  Table, TableRow, TableCell, WidthType,
  Paragraph, TextRun, AlignmentType, ImageRun
} from 'docx';
import { sanitizeXmlText } from './sanitizeText.js';
import { VISUAL_TYPES, CHART_TYPES } from './visualDataModel.js';

const PIXELS_PER_INCH = 96;
const TARGET_IMAGE_WIDTH_INCHES = 5.5;
const CHART_WIDTH = 2000;
const CHART_HEIGHT = 1200;
const ACADEMIC_COLORS = ['#2C3E50', '#3498DB', '#27AE60', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E', '#16A085'];

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

export const renderChartToPng = async (chartData) => {
  try {
    const { Chart, BarController, BarElement, LineController, LineElement, PieController, ArcElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, Title } = await import('chart.js');
    Chart.register(BarController, BarElement, LineController, LineElement, PieController, ArcElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, Title);

    const canvas = document.createElement('canvas');
    canvas.width = CHART_WIDTH;
    canvas.height = CHART_HEIGHT;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

    const labels = chartData.labels || [];
    const values = chartData.values || [];
    const type = (chartData.chartType || 'bar').toLowerCase();
    const title = chartData.title || '';

    const config = {
      type: type === 'horizontalBar' ? 'bar' : type,
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: type === 'pie' ? ACADEMIC_COLORS.slice(0, values.length) : ACADEMIC_COLORS[0],
          borderColor: type === 'pie' ? '#ffffff' : ACADEMIC_COLORS[0],
          borderWidth: type === 'pie' ? 2 : 0,
          pointBackgroundColor: ACADEMIC_COLORS[0],
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        }]
      },
      options: {
        indexAxis: type === 'horizontalBar' ? 'y' : 'x',
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: type === 'pie', position: 'right', labels: { font: { family: 'Times New Roman', size: 14 }, usePointStyle: true } },
          title: { display: !!title, text: title, font: { family: 'Times New Roman', size: 18, weight: 'bold' }, padding: { bottom: 20 }, color: '#2C3E50' },
          tooltip: { enabled: false }
        },
        scales: type !== 'pie' ? {
          x: { grid: { display: true, color: '#e5e7eb' }, ticks: { font: { family: 'Times New Roman', size: 13 }, color: '#333' } },
          y: { beginAtZero: true, grid: { display: true, color: '#e5e7eb' }, ticks: { font: { family: 'Times New Roman', size: 13 }, color: '#333' } }
        } : {}
      }
    };

    if (type === 'bar' || type === 'horizontalBar') {
      config.data.datasets[0].backgroundColor = ACADEMIC_COLORS.slice(0, values.length);
      config.data.datasets[0].borderRadius = 4;
    }

    const chart = new Chart(ctx, config);
    chart.draw();

    const buffer = canvasToPngBuffer(canvas);
    chart.destroy();
    return buffer;
  } catch (err) {
    console.error('Chart render failed:', err);
    return null;
  }
};

export const renderDiagramToPng = (diagramData) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = CHART_WIDTH;
    canvas.height = Math.max(800, diagramData.independent.length * 120 + diagramData.dependent.length * 120 + 300);
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const title = diagramData.title || 'Conceptual Framework';
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 30px Times New Roman, serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 50);

    const ivX = w * 0.08;
    const dvX = w * 0.75;
    const medX = w * 0.40;
    const boxW = w * 0.15;
    const boxH = 50;
    const startY = 130;

    const nodeColors = { independent: '#3498DB', dependent: '#27AE60', mediating: '#F39C12', moderating: '#E74C3C' };

    const drawBox = (x, y, text, color) => {
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxH, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Times New Roman, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayText = text.length > 20 ? text.substring(0, 18) + '..' : text;
      ctx.fillText(displayText, x + boxW / 2, y + boxH / 2);
      return { x: x + boxW / 2, y: y + boxH / 2 };
    };

    const drawArrow = (fromX, fromY, toX, toY, label) => {
      ctx.beginPath();
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const arrowLen = 12;
      ctx.beginPath();
      ctx.fillStyle = '#666';
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - arrowLen * Math.cos(angle - 0.4), toY - arrowLen * Math.sin(angle - 0.4));
      ctx.lineTo(toX - arrowLen * Math.cos(angle + 0.4), toY - arrowLen * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
      if (label) {
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        ctx.fillStyle = '#666';
        ctx.font = '12px Times New Roman, serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, midX, midY - 6);
      }
      return { midX: (fromX + toX) / 2, midY: (fromY + toY) / 2 };
    };

    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px Times New Roman, serif';
    ctx.fillStyle = nodeColors.independent;
    ctx.textAlign = 'left';

    const ivs = diagramData.independent || [];
    const dvs = diagramData.dependent || [];
    const meds = diagramData.mediating || [];
    const mods = diagramData.moderating || [];

    const ivNodes = [];
    ivs.forEach((name, i) => {
      const y = startY + i * (boxH + 30);
      const node = drawBox(ivX, y, name, nodeColors.independent);
      ivNodes.push(node);
      ctx.fillStyle = '#2C3E50';
      ctx.font = '11px Times New Roman, serif';
      ctx.textAlign = 'left';
      ctx.fillText('IV', ivX, y - 18);
      ctx.fillStyle = nodeColors.independent;
    });

    const dvNodes = [];
    dvs.forEach((name, i) => {
      const y = startY + i * (boxH + 30);
      const node = drawBox(dvX, y, name, nodeColors.dependent);
      dvNodes.push(node);
      ctx.fillStyle = '#2C3E50';
      ctx.font = '11px Times New Roman, serif';
      ctx.textAlign = 'right';
      ctx.fillText('DV', dvX + boxW, y - 18);
      ctx.fillStyle = nodeColors.dependent;
    });

    const medNodes = [];
    meds.forEach((name, i) => {
      const y = startY + (ivs.length > 0 ? Math.max(ivs.length, dvs.length) : dvs.length) / 2 * (boxH + 30) + i * (boxH + 40);
      const node = drawBox(medX, y, name, nodeColors.mediating);
      medNodes.push(node);
      ctx.fillStyle = '#2C3E50';
      ctx.font = '11px Times New Roman, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Mediating', medX + boxW / 2, y - 18);
      ctx.fillStyle = nodeColors.mediating;
    });

    const modNodes = [];
    const modY = startY - 80;
    mods.forEach((name, i) => {
      const x = w * 0.30 + i * (boxW + 40);
      const node = drawBox(x, modY, name, nodeColors.moderating);
      modNodes.push(node);
      ctx.fillStyle = '#2C3E50';
      ctx.font = '11px Times New Roman, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Moderating', x + boxW / 2, modY - 18);
      ctx.fillStyle = nodeColors.moderating;
    });

    const relationships = diagramData.relationships || [];
    if (relationships.length > 0) {
      for (const rel of relationships) {
        const from = findNodeCenter(ivNodes, rel.from) || findNodeCenter(medNodes, rel.from);
        const to = findNodeCenter(dvNodes, rel.to) || findNodeCenter(medNodes, rel.to);
        if (from && to) drawArrow(from.x + boxW / 2, from.y, to.x - boxW / 2, to.y, rel.label);
      }
    } else {
      for (const iv of ivNodes) {
        for (const dv of dvNodes) drawArrow(iv.x + boxW / 2, iv.y, dv.x - boxW / 2, dv.y, '');
      }
      for (const iv of ivNodes) {
        for (const mv of medNodes) drawArrow(iv.x + boxW / 2, iv.y, mv.x - boxW / 2, mv.y, '');
      }
      for (const mv of medNodes) {
        for (const dv of dvNodes) drawArrow(mv.x + boxW / 2, mv.y, dv.x - boxW / 2, dv.y, '');
      }
      for (const mod of modNodes) {
        for (const dv of dvNodes) {
          ctx.setLineDash([6, 4]);
          drawArrow(mod.x + boxW / 2, mod.y + boxH, dv.x + boxW / 2, dv.y, '');
          ctx.setLineDash([]);
        }
      }
    }

    return canvasToPngBuffer(canvas);
  } catch (err) {
    console.error('Diagram render failed:', err);
    return null;
  }
};

const findNodeCenter = (nodes, name) => {
  return nodes.find(n => {
    return true;
  });
};

export const buildDocxTable = (tableData, format) => {
  const headers = tableData.headers || [];
  const rows = tableData.rows || [];
  const fontFamily = format.fontFamily || 'Times New Roman';

  const headerCells = headers.map(h => new TableCell({
    shading: { type: 'clear', fill: '2C3E50' },
    width: { size: Math.round(100 / headers.length), type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: sanitizeXmlText(String(h)), bold: true, size: 22, font: fontFamily, color: 'FFFFFF' })]
    })]
  }));

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map(cell => new TableCell({
      shading: ri % 2 === 1 ? { type: 'clear', fill: 'F8FAFC' } : undefined,
      width: { size: Math.round(100 / row.length), type: WidthType.PERCENTAGE },
      children: [new Paragraph({
        spacing: { after: 40 },
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: sanitizeXmlText(String(cell)), size: 22, font: fontFamily })]
      })]
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: headerCells }),
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

export const renderFlowchartToPng = (diagramData) => {
  return renderDiagramToPng(diagramData);
};

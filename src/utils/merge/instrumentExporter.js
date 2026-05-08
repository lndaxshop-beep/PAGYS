import { INSTRUMENT_TYPES } from '../instrumentHelpers';
import {
  Paragraph, TextRun, AlignmentType, HeadingLevel,
  Table, TableRow, TableCell, WidthType, PageBreak
} from 'docx';

const formatQuestionType = (type) => {
  const labels = {
    'multiple-choice': 'Multiple Choice', 'likert': 'Likert Scale', 'checkbox': 'Checkbox',
    'scale': 'Scale/Rating', 'open-ended': 'Open-ended', 'ranking': 'Ranking'
  };
  return labels[type] || type;
};

const formatFieldType = (type) => {
  const labels = {
    'text': 'Text', 'select': 'Dropdown', 'count': 'Count', 'rating': 'Rating Scale',
    'yes-no': 'Yes/No', 'duration': 'Duration', 'checkbox': 'Checkbox', 'number': 'Number'
  };
  return labels[type] || type;
};

export const buildInstrumentAppendix = (instrumentId, content, project, index, format) => {
  const type = INSTRUMENT_TYPES[instrumentId];
  if (!type || !content) return [];

  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: `APPENDIX ${String.fromCharCode(65 + index)}: ${type.label}`,
        bold: true, size: 28, font: format.fontFamily
      })]
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({
        text: `(Data Collection Instrument)`,
        italics: true, size: 22, font: format.fontFamily, color: '666666'
      })]
    })
  );

  if (content.sections) {
    content.sections.forEach(section => {
      children.push(
        new Paragraph({
          spacing: { before: 400, after: 200 },
          children: [new TextRun({
            text: section.sectionName || section.title || '',
            bold: true, size: 26, font: format.fontFamily
          })]
        })
      );

      if (section.description) {
        children.push(
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({
              text: section.description, size: 24, font: format.fontFamily, italics: true
            })]
          })
        );
      }

      if (section.questions) {
        section.questions.forEach((q, qi) => {
          children.push(
            new Paragraph({
              spacing: { before: 200, after: 60 },
              children: [
                new TextRun({ text: `${qi + 1}. `, bold: true, size: 24, font: format.fontFamily }),
                new TextRun({ text: q.text, size: 24, font: format.fontFamily }),
              ]
            })
          );
          children.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun({
                text: `Type: ${formatQuestionType(q.type)}`,
                size: 20, font: format.fontFamily, italics: true, color: '555555'
              })]
            })
          );
          if (q.options) {
            q.options.forEach(opt => {
              children.push(
                new Paragraph({
                  indent: { left: 400 },
                  spacing: { after: 40 },
                  children: [new TextRun({ text: `☐ ${opt}`, size: 22, font: format.fontFamily })]
                })
              );
            });
          }
          if (q.type === 'open-ended') {
            for (let i = 0; i < 3; i++) {
              children.push(
                new Paragraph({
                  indent: { left: 400 },
                  spacing: { after: 60 },
                  border: { bottom: { style: 'single', size: 1, color: '999999' } },
                  children: []
                })
              );
            }
          }
        });
      }

      if (section.items) {
        section.items.forEach((item, ii) => {
          if (item.type === 'script') {
            children.push(
              new Paragraph({
                indent: { left: 200 },
                spacing: { before: 100, after: 100 },
                children: [new TextRun({
                  text: `"${item.content}"`,
                  italics: true, size: 22, font: format.fontFamily, color: '555555'
                })]
              })
            );
          } else if (item.type === 'question') {
            children.push(
              new Paragraph({
                spacing: { before: 150, after: 60 },
                children: [
                  new TextRun({ text: `${ii + 1}. `, bold: true, size: 24, font: format.fontFamily }),
                  new TextRun({ text: item.text, size: 24, font: format.fontFamily }),
                ]
              })
            );
            if (item.probes) {
              item.probes.forEach(probe => {
                children.push(
                  new Paragraph({
                    indent: { left: 400 },
                    spacing: { after: 40 },
                    children: [new TextRun({
                      text: `→ ${probe}`, size: 22, font: format.fontFamily, italics: true, color: '666666'
                    })]
                  })
                );
              });
            }
            if (item.type === 'question') {
              for (let i = 0; i < 2; i++) {
                children.push(
                  new Paragraph({
                    indent: { left: 400 },
                    spacing: { after: 60 },
                    border: { bottom: { style: 'single', size: 1, color: '999999' } },
                    children: []
                  })
                );
              }
            }
          } else if (item.type === 'note') {
            children.push(
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [new TextRun({
                  text: `Note: ${item.content}`,
                  size: 22, font: format.fontFamily, italics: true, color: 'd97706'
                })]
              })
            );
          }
        });
      }

      if (section.fields || section.indicators) {
        const fieldList = section.fields || section.indicators || [];
        const labelKey = section.fields ? 'label' : 'label';
        const headerRow = new TableRow({
          tableHeader: true,
          children: ['#', labelKey === 'label' ? 'Indicator / Field' : 'Indicator', 'Type', 'Response'].map(h =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 22, font: format.fontFamily })] })]
            })
          )
        });
        const dataRows = fieldList.map((fld, fi) =>
          new TableRow({
            children: [fi + 1, fld.label || '', formatFieldType(fld.type), ''].map(val =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: String(val), size: 22, font: format.fontFamily })] })]
              })
            )
          })
        );
        children.push(
          new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } })
        );
      }

      if (section.codes) {
        const hRow = new TableRow({
          tableHeader: true,
          children: ['Code', 'Label', 'Description'].map(h =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 22, font: format.fontFamily })] })]
            })
          )
        });
        const dRows = section.codes.map(c =>
          new TableRow({
            children: [c.code, c.label, c.description || ''].map(val =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: val, size: 22, font: format.fontFamily })] })]
              })
            )
          })
        );
        children.push(
          new Table({ rows: [hRow, ...dRows], width: { size: 100, type: WidthType.PERCENTAGE } })
        );
      }

      if (section.criteria) {
        section.criteria.forEach((c, ci) => {
          children.push(
            new Paragraph({
              spacing: { before: 100 },
              children: [
                new TextRun({ text: `${ci + 1}. `, bold: true, size: 24, font: format.fontFamily }),
                new TextRun({ text: c.criterion, size: 24, font: format.fontFamily }),
              ]
            })
          );
          if (c.description) {
            children.push(
              new Paragraph({
                indent: { left: 300 },
                spacing: { after: 100 },
                children: [new TextRun({ text: c.description, size: 22, font: format.fontFamily, italics: true })]
              })
            );
          }
        });
      }
    });
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));
  return children;
};

export const loadInstruments = (projectId) => {
  try {
    const stored = localStorage.getItem(`instruments_${projectId}`);
    if (!stored) return [];
    const ids = JSON.parse(stored);
    return ids.map(id => {
      const contentStr = localStorage.getItem(`instrument_content_${projectId}_${id}`);
      const type = INSTRUMENT_TYPES[id];
      if (!contentStr || !type) return null;
      try {
        return { id, label: type.label, icon: type.icon, content: JSON.parse(contentStr) };
      } catch {
        return { id, label: type.label, icon: type.icon, content: { sections: [{ title: 'Instrument Content', items: [{ type: 'note', content: 'Content could not be parsed.' }] }] } };
      }
    }).filter(Boolean);
  } catch {
    return [];
  }
};

export default buildInstrumentAppendix;
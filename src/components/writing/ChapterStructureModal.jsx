import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { normalizeNumbering } from '../../utils/writeHelpers.jsx';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const CHAPTER_NUM = { proposal: 'P', chapter1: '1', chapter2: '2', chapter3: '3', chapter4: '4', chapter5: '5' };

const STRUCTURE_TEMPLATES = {
  quantitative: (n) => `${n}.0 Introduction\n${n}.1 Theoretical Background\n${n}.1.1 Key Concepts\n${n}.1.2 Empirical Foundations\n${n}.2 Conceptual Framework\n${n}.2.1 Variable Identification\n${n}.2.2 Hypothesis Development\n${n}.3 Empirical Review\n${n}.3.1 Previous Studies\n${n}.3.2 Research Gaps\n${n}.4 Summary`,
  qualitative: (n) => `${n}.0 Introduction\n${n}.1 Theoretical Framework\n${n}.2 Conceptual Framework\n${n}.3 Empirical Review\n${n}.3.1 Thematic Analysis of Prior Work\n${n}.3.2 Identified Gaps\n${n}.4 Summary`,
  mixed: (n) => `${n}.0 Introduction\n${n}.1 Theoretical Framework\n${n}.2 Conceptual Framework\n${n}.2.1 Quantitative Dimensions\n${n}.2.2 Qualitative Dimensions\n${n}.3 Empirical Review\n${n}.3.1 Quantitative Studies\n${n}.3.2 Qualitative Studies\n${n}.3.3 Mixed Methods Studies\n${n}.4 Research Gaps\n${n}.5 Summary`,
};

const CHAPTER_HINTS = {
  proposal: 'A proposal typically covers: Background of the Study, Problem Statement, Research Objectives, Research Questions, Significance, Methodology Overview, Definition of Terms, Limitations, and Structure.',
  chapter1: 'Chapter 1 typically covers: Introduction, Background of the Study, Problem Statement, Research Objectives, Research Questions, Significance, Scope and Limitations, and Definition of Terms.',
  chapter2: 'Literature reviews typically include: Theoretical Framework, Conceptual Framework, Empirical Review, Research Gaps, and Summary.',
  chapter3: 'Methodology chapters usually cover: Research Design, Population and Sampling, Data Collection Methods, Data Analysis Procedures, Reliability and Validity, and Ethical Considerations.',
  chapter4: 'Results/Analysis chapters typically include: Descriptive Statistics, Hypothesis Testing, Data Analysis, Findings, and Summary.',
  chapter5: 'Discussion & Conclusion typically covers: Summary of Findings, Discussion of Findings, Implications, Recommendations, Conclusions, and Suggestions for Future Research.',
};

let idCounter = 0;
const nextId = () => ++idCounter;

const ChapterStructureModal = ({ isOpen, onClose, onSubmit, onPreview, uploadedFiles, setUploadedFiles, pendingChapter, onError, stepIndicator }) => {
  const { colors, isDarkMode } = useTheme();
  const [textValue, setTextValue] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [step, setStep] = useState('input');
  const [editHeadings, setEditHeadings] = useState([]);

  useEffect(() => {
    if (isOpen) { setTextValue(''); setPreviewImage(null); setStep('input'); setEditHeadings([]); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        onError?.(`"${file.name}" exceeds 5MB limit.`);
        return false;
      }
      return true;
    });
    if (!validFiles.length) return;
    const promises = validFiles.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve({ type: 'file', content: ev.target.result, name: file.name });
      reader.readAsDataURL(file);
    }));
    Promise.all(promises).then(results => {
      setUploadedFiles(prev => [...(prev || []), ...results]);
    });
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => {
      const list = prev ? (Array.isArray(prev) ? prev : [prev]) : [];
      const updated = list.filter((_, i) => i !== index);
      return updated.length === 0 ? null : (updated.length === 1 ? updated[0] : updated);
    });
  };

  const getReferenceData = () => {
    const files = uploadedFiles ? (Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]) : [];
    if (textValue.trim()) return { type: 'combined', text: textValue.trim(), files };
    if (uploadedFiles) return files.length === 1 ? files[0] : { type: 'files', files };
    return null;
  };

  const handleUseStructure = async () => {
    const refData = getReferenceData();
    if (!refData) { onError?.('Please upload screenshots or paste text first, or click Skip.'); return; }
    if (!onPreview) { onSubmit(refData); return; }
    setStep('submitting');
    try {
      const result = await onPreview(pendingChapter, refData);
      if (result && Array.isArray(result) && result.length > 0) {
        setEditHeadings(result.map(h => ({ id: nextId(), text: h })));
        setStep('preview');
      } else {
        onError?.('AI could not extract a valid structure. You can try again or use Skip.');
        setStep('input');
      }
    } catch {
      onError?.('Failed to preview structure. Please try again.');
      setStep('input');
    }
  };

  const handleConfirmStructure = () => {
    const texts = editHeadings.map(h => h.text).filter(Boolean);
    if (texts.length === 0) { onError?.('Please add at least one heading.'); return; }
    onSubmit({ editedHeadings: texts });
  };

  const addEditItem = () => {
    setEditHeadings(prev => [...prev, { id: nextId(), text: '' }]);
  };

  const removeEditItem = (id) => {
    setEditHeadings(prev => prev.filter(h => h.id !== id));
  };

  const updateEditItem = (id, text) => {
    setEditHeadings(prev => prev.map(h => h.id === id ? { ...h, text } : h));
  };

  const moveEditItem = (index, direction) => {
    setEditHeadings(prev => {
      const items = [...prev];
      const target = index + direction;
      if (target < 0 || target >= items.length) return prev;
      [items[index], items[target]] = [items[target], items[index]];
      return items;
    });
  };

  const fileList = uploadedFiles ? (Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]) : [];

  const renderInputStep = () => (
    <>
      {stepIndicator && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '8px 14px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f9ff', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#3d3d3d' : '#bfdbfe'}` }}>
          <span style={{ fontSize: '12px', color: colors.primary, fontWeight: '600', whiteSpace: 'nowrap' }}>{stepIndicator}</span>
          <div style={{ flex: 1, height: '4px', backgroundColor: isDarkMode ? '#3d3d3d' : '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '66%', backgroundColor: colors.primary, borderRadius: '999px', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>Upload Chapter Structure</h2>
      <p style={{ color: colors.textSecondary, marginBottom: '24px' }}>Upload screenshots or paste text showing how you want this chapter structured. The AI will follow the exact structure, numbering, and visual placements.</p>

      {pendingChapter && CHAPTER_HINTS[pendingChapter] && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f7ff', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#3d3d3d' : '#bfdbfe'}` }}>
          <p style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: '1.5' }}>💡 <strong>Tip:</strong> {CHAPTER_HINTS[pendingChapter]}</p>
        </div>
      )}

      <div style={{ border: `2px dashed ${colors.border}`, borderRadius: '8px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
        <input type="file" id="structure-upload" accept=".jpg,.jpeg,.png" multiple style={{ display: 'none' }} onChange={handleFileChange} />
        <label htmlFor="structure-upload" style={{ backgroundColor: colors.primary, color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'inline-block' }}>📎 Upload Screenshots</label>
        <p style={{ marginTop: '12px', color: colors.textSecondary, fontSize: '13px' }}>Supported: JPG, PNG (You can select multiple files)</p>
      </div>

      {fileList.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>📎 Uploaded Files ({fileList.length}):</p>
          {fileList.map((file, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', marginBottom: '4px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f0fdf4', borderRadius: '6px', border: '1px solid #86efac' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                {file.content?.startsWith('data:image/') ? (
                  <img src={file.content} alt={file.name} onClick={() => setPreviewImage(file.content)}
                    style={{ height: '40px', width: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', flexShrink: 0 }} />
                ) : <span style={{ fontSize: '16px', flexShrink: 0 }}>🖼️</span>}
                <span style={{ fontSize: '13px', color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
              </div>
              <button onClick={() => removeFile(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', padding: '0 4px', marginLeft: '8px', flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '16px' }}><span style={{ color: colors.textSecondary, fontWeight: '500' }}>— OR —</span></div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => setTextValue(STRUCTURE_TEMPLATES.quantitative(CHAPTER_NUM[pendingChapter] || 'X'))}
          style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0ff', color: colors.primary, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          📊 Quantitative
        </button>
        <button onClick={() => setTextValue(STRUCTURE_TEMPLATES.qualitative(CHAPTER_NUM[pendingChapter] || 'X'))}
          style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0ff', color: colors.primary, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          📋 Qualitative
        </button>
        <button onClick={() => setTextValue(STRUCTURE_TEMPLATES.mixed(CHAPTER_NUM[pendingChapter] || 'X'))}
          style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0ff', color: colors.primary, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          🔀 Mixed Methods
        </button>
      </div>

      <textarea value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Paste your chapter structure here...&#10;&#10;Example:&#10;2.0 Introduction&#10;2.1 Theoretical Framework [with diagram]&#10;2.2 Conceptual Framework&#10;2.3 Empirical Review&#10;2.4 Research Gaps&#10;2.5 Summary&#10;&#10;You can paste an ENTIRE chapter or document. The AI will extract ONLY the structure (headings, numbering, hierarchy, diagram placements, table positions) and adapt it to your topic." rows="15" style={{ width: '100%', padding: '14px', marginBottom: '8px', border: `1px solid ${colors.border}`, borderRadius: '8px', backgroundColor: colors.input, color: colors.text, fontSize: '14px', resize: 'vertical', fontFamily: 'monospace', lineHeight: '1.6', minHeight: '250px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setTextValue(normalizeNumbering(textValue))}
          style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer' }}>
          🔢 Normalize Numbering
        </button>
        <p style={{ fontSize: '11px', color: colors.textSecondary, margin: 0 }}>{textValue.length} characters</p>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={handleUseStructure} style={{ flex: 1, backgroundColor: '#059669', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>✅ Use This Structure</button>
        <button onClick={() => onSubmit(null)} style={{ flex: 1, backgroundColor: colors.primary, color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Skip (Use AI Default)</button>
        <button onClick={onClose} style={{ flex: 1, backgroundColor: 'transparent', color: colors.text, padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
      </div>
    </>
  );

  const renderSubmittingStep = () => (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '36px', marginBottom: '16px' }}>⏳</div>
      <p style={{ color: colors.primary, fontWeight: '500', fontSize: '16px' }}>AI is extracting your structure...</p>
      <p style={{ color: colors.textSecondary, fontSize: '13px', marginTop: '8px' }}>Analyzing headings, numbering, and hierarchy</p>
    </div>
  );

  const renderPreviewStep = () => (
    <>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '4px' }}>Review Extracted Structure</h2>
      <p style={{ color: colors.textSecondary, marginBottom: '20px', fontSize: '13px' }}>Edit, reorder, or remove headings before confirming.</p>

      <div style={{ marginBottom: '16px' }}>
        {editHeadings.map((item, index) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', padding: '6px 10px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', borderRadius: '6px', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button onClick={() => moveEditItem(index, -1)} disabled={index === 0}
                style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', fontSize: '10px', color: index === 0 ? colors.textSecondary : colors.primary, padding: 0, lineHeight: 1 }}>▲</button>
              <button onClick={() => moveEditItem(index, 1)} disabled={index === editHeadings.length - 1}
                style={{ background: 'none', border: 'none', cursor: index === editHeadings.length - 1 ? 'default' : 'pointer', fontSize: '10px', color: index === editHeadings.length - 1 ? colors.textSecondary : colors.primary, padding: 0, lineHeight: 1 }}>▼</button>
            </div>
            <input value={item.text} onChange={(e) => updateEditItem(item.id, e.target.value)}
              style={{ flex: 1, padding: '4px 8px', fontSize: '13px', border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', backgroundColor: colors.input, color: colors.text }} />
            <button onClick={() => removeEditItem(item.id)}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>✕</button>
          </div>
        ))}
      </div>

      <button onClick={addEditItem}
        style={{ width: '100%', padding: '8px', marginBottom: '20px', backgroundColor: 'transparent', color: colors.primary, border: `1px dashed ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
        + Add Heading
      </button>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={handleConfirmStructure} style={{ flex: 1, backgroundColor: '#059669', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>✅ Confirm Structure</button>
        <button onClick={() => setStep('input')} style={{ flex: 1, backgroundColor: 'transparent', color: colors.text, padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '500', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
      </div>
    </>
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', maxWidth: '650px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        {step === 'submitting' ? renderSubmittingStep() : step === 'preview' ? renderPreviewStep() : renderInputStep()}
      </div>

      {previewImage && (
        <div onClick={() => setPreviewImage(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, cursor: 'pointer' }}>
          <img src={previewImage} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default ChapterStructureModal;

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ChapterStructureModal = ({ isOpen, onClose, onSubmit, uploadedFiles, setUploadedFiles, pendingChapter }) => {
  const { colors, isDarkMode } = useTheme();
  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const promises = files.map(file => new Promise(resolve => {
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

  const handleSubmit = () => {
    const text = document.getElementById('structure-textarea')?.value;
    const files = uploadedFiles ? (Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]) : [];
    if (text && text.trim()) {
      onSubmit({ type: 'combined', text: text.trim(), files });
    } else if (uploadedFiles) {
      onSubmit(files.length === 1 ? files[0] : { type: 'files', files });
    } else {
      alert('Please upload screenshots or paste text first, or click Skip.');
    }
  };

  const fileList = uploadedFiles ? (Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]) : [];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', maxWidth: '650px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>Upload Chapter Structure</h2>
        <p style={{ color: colors.textSecondary, marginBottom: '24px' }}>Upload screenshots or paste text showing how you want this chapter structured.</p>

        <div style={{ border: `2px dashed ${colors.border}`, borderRadius: '8px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
          <input type="file" id="structure-upload" accept=".jpg,.jpeg,.png" multiple style={{ display: 'none' }} onChange={handleFileChange} />
          <label htmlFor="structure-upload" style={{ backgroundColor: colors.primary, color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'inline-block' }}>📎 Upload Screenshots</label>
          <p style={{ marginTop: '12px', color: colors.textSecondary, fontSize: '13px' }}>Supported: JPG, PNG</p>
        </div>

        {fileList.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>📎 Uploaded Files ({fileList.length}):</p>
            {fileList.map((file, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', marginBottom: '4px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f0fdf4', borderRadius: '6px', border: '1px solid #86efac' }}>
                <span style={{ fontSize: '13px', color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>🖼️ {file.name}</span>
                <button onClick={() => removeFile(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', padding: '0 4px', marginLeft: '8px' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '20px' }}><span style={{ color: colors.textSecondary, fontWeight: '500' }}>— OR —</span></div>

        <textarea id="structure-textarea" placeholder="Paste your chapter structure here...&#10;&#10;Example:&#10;2.0 Introduction&#10;2.1 Theoretical Framework [with diagram]&#10;2.2 Conceptual Framework..." rows="15" style={{ width: '100%', padding: '14px', marginBottom: '16px', border: `1px solid ${colors.border}`, borderRadius: '8px', backgroundColor: colors.input, color: colors.text, fontSize: '14px', resize: 'vertical', fontFamily: 'monospace', lineHeight: '1.6', minHeight: '250px' }} />

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSubmit} style={{ flex: 1, backgroundColor: '#059669', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>✅ Use This Structure</button>
          <button onClick={() => onSubmit(null)} style={{ flex: 1, backgroundColor: colors.primary, color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Skip (Use AI Default)</button>
          <button onClick={onClose} style={{ flex: 1, backgroundColor: 'transparent', color: colors.text, padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ChapterStructureModal;

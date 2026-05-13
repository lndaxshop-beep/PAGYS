import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const NewProjectForm = ({
  form, onChange, useOrganization, setUseOrganization,
  organizationName, setOrganizationName, hideOrganization, setHideOrganization,
  onGenerateQuestions, onSubmit, onCancel, selectedTier, onTierChange
}) => {
  const { colors, isDarkMode } = useTheme();
  const inputStyle = {
    width: '100%', padding: '12px', border: `2px solid ${colors.inputBorder}`,
    borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text
  };
  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text };

  return (
    <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '32px', marginBottom: '32px', border: `1px solid ${colors.border}` }}>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: colors.text }}>Start New Thesis Project</h2>
      <form onSubmit={(e) => onSubmit(e, selectedTier)}>
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label htmlFor="projectTitle" style={labelStyle}>Thesis Title *</label>
            <input id="projectTitle" type="text" name="title" value={form.title} onChange={onChange} required style={inputStyle} placeholder="e.g., Impact of Technology on Healthcare" />
          </div>
          <div>
            <label htmlFor="projectLevel" style={labelStyle}>Level of Study *</label>
            <select id="projectLevel" name="level" value={form.level} onChange={onChange} required style={inputStyle}>
              <option value="undergraduate">Undergraduate</option>
              <option value="masters">Master's</option>
              <option value="phd">PhD / Doctoral</option>
            </select>
          </div>
          <div>
            <label htmlFor="projectField" style={labelStyle}>Field of Study *</label>
            <select id="projectField" name="field" value={form.field} onChange={onChange} required style={inputStyle}>
              <option value="">Select field</option>
              <option value="sciences">Natural Sciences</option>
              <option value="engineering">Engineering & Technology</option>
              <option value="humanities">Humanities & Arts</option>
              <option value="social">Social Sciences</option>
              <option value="business">Business & Economics</option>
              <option value="medical">Medical & Health Sciences</option>
            </select>
          </div>
          <div style={{ backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f9ff', borderRadius: '12px', padding: '20px', border: `2px solid ${useOrganization ? colors.primary : colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input type="checkbox" id="useOrg" checked={useOrganization} onChange={(e) => setUseOrganization(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="useOrg" style={{ fontWeight: '600', color: colors.text }}>🏢 Use a specific organization as case study</label>
            </div>
            {useOrganization && (
              <>
                <input type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Enter organization name" style={{ ...inputStyle, marginBottom: '12px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="checkbox" id="hideOrg" checked={hideOrganization} onChange={(e) => setHideOrganization(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <label htmlFor="hideOrg" style={{ fontSize: '14px', color: colors.textSecondary }}>Hide organization name in the generated text</label>
                </div>
              </>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label htmlFor="projectTopic" style={{ fontWeight: '500', color: colors.text }}>Research Topic/Question *</label>
              <button type="button" onClick={onGenerateQuestions} style={{
                backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`,
                borderRadius: '20px', padding: '6px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer'
              }}>✨ Choose for Me</button>
            </div>
            <textarea id="projectTopic" name="topic" value={form.topic} onChange={onChange} required rows="3" style={{
              ...inputStyle, borderColor: form.topic ? colors.primary : colors.inputBorder, resize: 'vertical'
            }} placeholder="e.g., What is the impact of water quality on plant growth?" />
          </div>
          <div>
            <label htmlFor="projectMethodology" style={labelStyle}>Methodology</label>
            <select id="projectMethodology" name="methodology" value={form.methodology} onChange={onChange} style={inputStyle}>
              <option value="">Select methodology</option>
              <option value="quantitative">Quantitative</option>
              <option value="qualitative">Qualitative</option>
              <option value="mixed">Mixed Methods</option>
            </select>
          </div>
          <div>
            <label htmlFor="projectRefStyle" style={labelStyle}>Reference Style</label>
            <select id="projectRefStyle" name="referenceStyle" value={form.referenceStyle} onChange={onChange} style={inputStyle}>
              <option value="apa">APA 7th Edition</option>
              <option value="mla">MLA 9th Edition</option>
              <option value="chicago">Chicago/Turabian</option>
              <option value="harvard">Harvard</option>
              <option value="ieee">IEEE</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', color: colors.text }}>Project Tier *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                onClick={() => onTierChange('regular')}
                style={{
                  padding: '16px', borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${selectedTier === 'regular' ? colors.primary : colors.border}`,
                  backgroundColor: selectedTier === 'regular'
                    ? (isDarkMode ? '#2d2a4a' : '#f0f0ff')
                    : (isDarkMode ? '#2d2d2d' : '#ffffff'),
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if (selectedTier !== 'regular') e.currentTarget.style.borderColor = colors.primary; }}
                onMouseLeave={(e) => { if (selectedTier !== 'regular') e.currentTarget.style.borderColor = colors.border; }}
              >
                <div style={{ fontSize: '18px', marginBottom: '6px' }}>📘</div>
                <div style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>Regular — ₵30</div>
                <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '12px', color: colors.textSecondary, lineHeight: '1.8' }}>
                  <li>Humanise (1 use per subsection)</li>
                  <li>Feedback (1 use per subsection)</li>
                  <li>Basic writing features</li>
                </ul>
              </div>
              <div
                onClick={() => onTierChange('premium')}
                style={{
                  padding: '16px', borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${selectedTier === 'premium' ? '#f59e0b' : colors.border}`,
                  backgroundColor: selectedTier === 'premium'
                    ? (isDarkMode ? '#3d2d1a' : '#fffbe6')
                    : (isDarkMode ? '#2d2d2d' : '#ffffff'),
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if (selectedTier !== 'premium') e.currentTarget.style.borderColor = '#f59e0b'; }}
                onMouseLeave={(e) => { if (selectedTier !== 'premium') e.currentTarget.style.borderColor = colors.border; }}
              >
                <div style={{ fontSize: '18px', marginBottom: '6px' }}>💎</div>
                <div style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>Premium — ₵40</div>
                <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '12px', color: colors.textSecondary, lineHeight: '1.8' }}>
                  <li>Humanise (4 uses per subsection)</li>
                  <li>Feedback (4 uses per subsection)</li>
                  <li>Write All Remaining at once</li>
                  <li>Search Literature & Add Sources</li>
                  <li>Custom chapter guidelines</li>
                </ul>
                {selectedTier === 'premium' && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#d97706', fontWeight: '500' }}>
                    ⭐ Best value for full features
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" style={{ backgroundColor: colors.primary, color: 'white', padding: '14px 24px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', flex: 1 }}>Create Project</button>
            <button type="button" onClick={onCancel} style={{ backgroundColor: 'transparent', color: colors.text, padding: '14px 24px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewProjectForm;

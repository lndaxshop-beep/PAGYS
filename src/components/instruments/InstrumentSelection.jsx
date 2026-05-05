import React from 'react';
import { INSTRUMENT_TYPES } from '../../utils/instrumentHelpers';

const InstrumentSelection = ({ selectedInstruments, project, autoSelect, onToggle, onSelectAll, onAutoSelectChange, onGenerate, colors, isDarkMode }) => (
  <div style={{ marginBottom: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text }}>Select Instruments</h3>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: colors.textSecondary, cursor: 'pointer' }}>
          <input type="checkbox" checked={autoSelect} onChange={(e) => { onAutoSelectChange(e.target.checked); if (e.target.checked) onSelectAll(); else onToggle(); }} style={{ accentColor: colors.primary }} />
          Auto-select recommended
        </label>
        <button onClick={onSelectAll} style={{ backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`, borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}>
          Select All Recommended
        </button>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
      {Object.values(INSTRUMENT_TYPES).map(type => {
        const isSelected = selectedInstruments.includes(type.id);
        const isRecommended = type.recommendedFor.includes(project?.methodology || 'mixed');
        return (
          <div key={type.id} onClick={() => onToggle(type.id)} style={{ padding: '16px', borderRadius: '12px', border: `2px solid ${isSelected ? colors.primary : colors.border}`, backgroundColor: isSelected ? (isDarkMode ? '#2d1f4e' : '#f5f3ff') : 'transparent', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
            {isRecommended && (
              <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: colors.primary, color: 'white', fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' }}>Recommended</span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>{type.icon}</span>
              <span style={{ fontWeight: '600', color: colors.text, fontSize: '15px' }}>{type.label}</span>
              <span style={{ marginLeft: 'auto', width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${isSelected ? colors.primary : colors.border}`, backgroundColor: isSelected ? colors.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>
                {isSelected && '✓'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: '1.4' }}>{type.description}</p>
          </div>
        );
      })}
    </div>
    <button onClick={onGenerate} disabled={selectedInstruments.length === 0} style={{ width: '100%', marginTop: '24px', backgroundColor: selectedInstruments.length > 0 ? colors.primary : colors.border, color: selectedInstruments.length > 0 ? 'white' : colors.textSecondary, padding: '14px', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '16px', cursor: selectedInstruments.length > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
      Generate {selectedInstruments.length} Instrument{selectedInstruments.length !== 1 ? 's' : ''}
    </button>
  </div>
);

export default InstrumentSelection;

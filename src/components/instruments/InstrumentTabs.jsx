import React from 'react';
import { INSTRUMENT_TYPES } from '../../utils/instrumentHelpers';

const InstrumentTabs = ({ selectedInstruments, generatedContent, downloadedInstruments, activeTab, onTabClick, colors }) => (
  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: `1px solid ${colors.border}`, paddingBottom: '12px' }}>
    {selectedInstruments.filter(id => generatedContent[id]).map(id => {
      const type = INSTRUMENT_TYPES[id];
      const isDownloaded = downloadedInstruments.includes(id);
      return (
        <button key={id} onClick={() => onTabClick(id)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${activeTab === id ? colors.primary : colors.border}`, backgroundColor: activeTab === id ? colors.primary : 'transparent', color: activeTab === id ? 'white' : colors.text, fontWeight: '500', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
          {type.icon} {type.label}
          {isDownloaded && <span style={{ fontSize: '12px' }}>✓</span>}
        </button>
      );
    })}
  </div>
);

export default InstrumentTabs;

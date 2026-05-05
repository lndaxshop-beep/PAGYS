import React from 'react';

const ManualEntry = ({ selectedOption, manualData, onDataChange, colors }) => {
  if (selectedOption !== 'manual') return null;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>
        Enter Your Findings
      </h3>
      <textarea
        value={manualData}
        onChange={onDataChange}
        placeholder={`Enter your findings data here...

Example:
Question 1: How often do you use technology?
- 25 respondents said Daily
- 12 said Weekly
- 8 said Monthly

Question 2: What are the main benefits?
- 30 said improved efficiency
- 22 said better communication
- 15 said cost savings`}
        style={{
          width: '100%',
          height: '250px',
          padding: '16px',
          border: `1px solid ${colors.inputBorder}`,
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          backgroundColor: colors.input,
          color: colors.text,
          resize: 'vertical',
          lineHeight: '1.5'
        }}
      />
      <div style={{ marginTop: '8px', color: colors.primary, fontSize: '13px', fontWeight: '500' }}>
        ✓ Manual entry option selected
      </div>
    </div>
  );
};

export default ManualEntry;

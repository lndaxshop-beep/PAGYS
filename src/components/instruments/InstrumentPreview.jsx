import React from 'react';
import { INSTRUMENT_TYPES, formatQuestionType, formatFieldType } from '../../utils/instrumentHelpers';

const InstrumentPreview = ({ instrumentId, content, colors }) => {
  if (!content) return <p style={{ color: colors.textSecondary }}>No content generated.</p>;

  if (instrumentId === 'questionnaire' && content.sections) {
    return (
      <div>
        {content.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.primary, marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${colors.border}` }}>{section.sectionName || section.title}</h4>
            {(section.questions || []).map((q, qi) => (
              <div key={qi} style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: `3px solid ${colors.border}` }}>
                <p style={{ fontWeight: '500', color: colors.text, marginBottom: '4px' }}>{qi + 1}. {q.text}</p>
                <p style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '6px' }}>{formatQuestionType(q.type)}</p>
                {q.options && (
                  <div style={{ paddingLeft: '16px' }}>
                    {q.options.map((opt, oi) => (
                      <p key={oi} style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '2px' }}>☐ {opt}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (instrumentId === 'interview' && content.sections) {
    return (
      <div>
        <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>Estimated Duration: {content.estimatedDuration || '45-60 minutes'}</p>
        {content.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.primary, marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${colors.border}` }}>{section.sectionName || section.title}</h4>
            {(section.items || []).map((item, ii) => (
              <div key={ii} style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: `3px solid ${item.type === 'script' ? '#059669' : item.type === 'note' ? '#f59e0b' : colors.border}` }}>
                {item.type === 'script' && <p style={{ fontSize: '13px', color: colors.textSecondary, fontStyle: 'italic' }}>"{item.content}"</p>}
                {item.type === 'question' && (
                  <div>
                    <p style={{ fontWeight: '500', color: colors.text }}>{ii + 1}. {item.text}</p>
                    {item.probes && item.probes.length > 0 && (
                      <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                        {item.probes.map((probe, pi) => (
                          <p key={pi} style={{ fontSize: '12px', color: colors.textSecondary, fontStyle: 'italic' }}>→ {probe}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {item.type === 'note' && <p style={{ fontSize: '12px', color: '#f59e0b', fontStyle: 'italic' }}>📝 {item.content}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (instrumentId === 'focusGroup' && content.sections) {
    return (
      <div>
        <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>Total Duration: {content.totalDuration || '90 minutes'}</p>
        {content.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.primary, marginBottom: '8px' }}>{section.sectionName || section.title}</h4>
            {section.duration && <p style={{ fontSize: '13px', color: '#f59e0b', marginBottom: '8px' }}>⏱ {section.duration}</p>}
            {section.facilitatorNotes && <p style={{ fontSize: '12px', color: colors.textSecondary, fontStyle: 'italic', marginBottom: '12px', paddingLeft: '12px', borderLeft: `3px solid #059669` }}>📝 {section.facilitatorNotes}</p>}
            {(section.items || []).map((item, ii) => (
              <div key={ii} style={{ marginBottom: '10px', paddingLeft: '12px' }}>
                {item.type === 'script' && <p style={{ fontSize: '13px', color: colors.textSecondary, fontStyle: 'italic' }}>"{item.content}"</p>}
                {item.type === 'activity' && (
                  <div>
                    <p style={{ fontWeight: '500', color: colors.text }}>Activity: {item.name}</p>
                    {item.instructions && <p style={{ fontSize: '13px', color: colors.textSecondary }}>{item.instructions}</p>}
                  </div>
                )}
                {item.type === 'question' && <p style={{ fontWeight: '500', color: colors.text }}>{ii + 1}. {item.text}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (instrumentId === 'observation' && content.sections) {
    return (
      <div>
        {content.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.primary, marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${colors.border}` }}>{section.sectionName || section.title}</h4>
            {section.fields && (
              <div style={{ display: 'grid', gap: '8px' }}>
                {section.fields.map((field, fi) => (
                  <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: i % 2 === 0 ? 'transparent' : (colors.hover || '#f3f4f6'), borderRadius: '6px' }}>
                    <span style={{ fontWeight: '500', color: colors.text, minWidth: '120px' }}>{field.label}</span>
                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>[{formatFieldType(field.type)}]</span>
                  </div>
                ))}
              </div>
            )}
            {section.indicators && (
              <div style={{ display: 'grid', gap: '8px' }}>
                {section.indicators.map((ind, ii) => (
                  <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: i % 2 === 0 ? 'transparent' : (colors.hover || '#f3f4f6'), borderRadius: '6px' }}>
                    <span style={{ fontWeight: '500', color: colors.text }}>{ii + 1}. {ind.label}</span>
                    <span style={{ fontSize: '12px', color: colors.textSecondary, marginLeft: 'auto' }}>[{formatFieldType(ind.type)}]</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (instrumentId === 'documentAnalysis' && content.sections) {
    return (
      <div>
        {content.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.primary, marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${colors.border}` }}>{section.sectionName || section.title}</h4>
            {section.fields && (
              <div style={{ display: 'grid', gap: '8px' }}>
                {section.fields.map((field, fi) => (
                  <div key={fi} style={{ padding: '8px', backgroundColor: i % 2 === 0 ? 'transparent' : (colors.hover || '#f3f4f6'), borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500', color: colors.text }}>{field.label}</span>
                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>[{formatFieldType(field.type)}]</span>
                  </div>
                ))}
              </div>
            )}
            {section.codes && (
              <div style={{ display: 'grid', gap: '8px' }}>
                {section.codes.map((code, ci) => (
                  <div key={ci} style={{ padding: '10px', backgroundColor: i % 2 === 0 ? 'transparent' : (colors.hover || '#f3f4f6'), borderRadius: '6px' }}>
                    <span style={{ fontWeight: '600', color: colors.primary, marginRight: '8px' }}>{code.code}</span>
                    <span style={{ fontWeight: '500', color: colors.text }}>{code.label}</span>
                    {code.description && <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>{code.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (instrumentId === 'caseStudy' && content.sections) {
    return (
      <div>
        {content.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.primary, marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${colors.border}` }}>{section.sectionName || section.title}</h4>
            {section.criteria && section.criteria.map((c, ci) => (
              <div key={ci} style={{ marginBottom: '8px', paddingLeft: '12px', borderLeft: `3px solid ${colors.border}` }}>
                <p style={{ fontWeight: '500', color: colors.text }}>{ci + 1}. {c.criterion}</p>
                {c.description && <p style={{ fontSize: '13px', color: colors.textSecondary }}>{c.description}</p>}
              </div>
            ))}
            {section.sources && section.sources.map((s, si) => (
              <div key={si} style={{ marginBottom: '8px', padding: '10px', backgroundColor: si % 2 === 0 ? 'transparent' : (colors.hover || '#f3f4f6'), borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: '600', color: colors.text }}>{s.source}</span>
                  <span style={{ fontSize: '12px', color: s.type === 'primary' ? '#059669' : '#6b7280', marginLeft: '8px' }}>({s.type})</span>
                </div>
                <span style={{ fontSize: '12px', color: colors.textSecondary }}>{s.participants || s.duration || s.sessions || ''}</span>
              </div>
            ))}
            {section.description && <p style={{ fontSize: '14px', color: colors.text, lineHeight: '1.6' }}>{section.description}</p>}
            {section.methods && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {section.methods.map((m, mi) => (
                  <span key={mi} style={{ padding: '4px 12px', backgroundColor: colors.primary + '20', color: colors.primary, borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>{m}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return <pre style={{ whiteSpace: 'pre-wrap', color: colors.text, fontSize: '14px' }}>{JSON.stringify(content, null, 2)}</pre>;
};

export default InstrumentPreview;

import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ContentRenderer from '../../utils/writeHelpers.jsx';

const ContentArea = ({
  content, isPreviewMode, onTogglePreview, onSaveEdit, onChange, showReferenceInTextarea, generatingReferences, highlightRanges, onEditVisual,
  chapterSubsections, subsectionsContent, isPremium, onFeedback
}) => {
  const { colors } = useTheme();
  const previewRef = useRef(null);

  const fullChapterText = chapterSubsections && subsectionsContent
    ? (subsectionsContent.fullChapter || chapterSubsections
        .filter(s => s.type !== 'references')
        .map(s => subsectionsContent[s.id] || '')
        .filter(Boolean)
        .join('\n\n'))
    : content;

  useEffect(() => {
    if (!isPreviewMode || !highlightRanges?.length || !previewRef.current) return;
    const container = previewRef.current;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    const ranges = highlightRanges.filter(r => r.text && r.text.trim());
    if (ranges.length === 0) return;
    let firstBlinkEl = null;
    for (const range of ranges) {
      const searchText = range.text.trim();
      if (!searchText) continue;
      for (const node of textNodes) {
        const idx = node.textContent.indexOf(searchText);
        if (idx === -1) continue;
        const parent = node.parentElement;
        if (!parent || parent.closest('.correction-blink')) continue;
        const span = document.createElement('span');
        span.className = 'correction-blink';
        span.textContent = searchText;
        const after = node.splitText(idx);
        after.textContent = after.textContent.slice(searchText.length);
        node.parentElement.insertBefore(span, after);
        if (!firstBlinkEl) firstBlinkEl = span;
        break;
      }
    }
    if (firstBlinkEl) {
      firstBlinkEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const timers = [];
    const blinkEls = container.querySelectorAll('.correction-blink');
    blinkEls.forEach((el, i) => {
      const timer = setTimeout(() => {
        const parent = el.parentNode;
        if (parent) {
          const text = document.createTextNode(el.textContent);
          parent.replaceChild(text, el);
        }
      }, 1800 + i * 200);
      timers.push(timer);
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [isPreviewMode, highlightRanges]);

  const isReferences = showReferenceInTextarea;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', alignItems: 'center' }}>
        <button
          onClick={() => isPreviewMode ? onTogglePreview(false) : onSaveEdit()}
          style={{
            backgroundColor: isPreviewMode ? '#d97706' : '#059669',
            color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px',
            fontWeight: '500', cursor: 'pointer', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          {isPreviewMode ? '✏️ Edit' : '👁️ Save & Preview'}
        </button>
      </div>

      <div data-tour="content-area" style={{ backgroundColor: colors.background, borderRadius: '12px', padding: '24px', marginBottom: '24px', border: `1px solid ${colors.border}`, minHeight: '400px' }}>
        {isPreviewMode ? (
          isReferences ? (
            <div style={{ fontFamily: "'Times New Roman', serif", fontSize: '12pt', lineHeight: '2.0', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
              {content || <p style={{ color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' }}>References will appear here after generation...</p>}
            </div>
          ) : chapterSubsections && subsectionsContent ? (
            <div ref={previewRef}>
              {chapterSubsections.filter(s => s.type !== 'references').map((sub, i) => {
                const subContent = subsectionsContent[sub.id];
                if (!subContent) return null;
                return (
                  <div key={sub.id} id={`subsection-${sub.id}`} style={{ position: 'relative' }}>
                    <ContentRenderer content={subContent} colors={colors} onEditVisual={onEditVisual} />
                    {i < chapterSubsections.filter(s => s.type !== 'references').length - 1 && (
                      <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}40`, margin: '32px 0' }} />
                    )}
                    {isPremium && onFeedback && (
                      <div style={{ position: 'absolute', top: '0', right: '0' }}>
                        <button
                          onClick={() => onFeedback(sub)}
                          style={{
                            backgroundColor: '#f59e0b', color: 'white',
                            border: 'none', borderRadius: '4px', padding: '4px 10px',
                            fontSize: '11px', cursor: 'pointer', fontWeight: '500',
                            opacity: 0.7
                          }}
                          title="Apply feedback to this subsection"
                        >
                          ✏️ Feedback
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {(!chapterSubsections.some(s => subsectionsContent?.[s.id])) && (
                <p style={{ color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic', padding: '40px 0' }}>
                  Click "Write Chapter" to generate content for this chapter.
                </p>
              )}
            </div>
          ) : (
            <div ref={previewRef}>
              <ContentRenderer content={content} colors={colors} onEditVisual={onEditVisual} />
            </div>
          )
        ) : (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>
              Edit Content — Full Chapter
            </h3>
            <textarea
              value={fullChapterText}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Edit your content here..."
              style={{
                width: '100%', height: '400px', padding: '16px',
                border: `1px solid ${colors.inputBorder}`, borderRadius: '8px',
                fontFamily: isReferences ? "'Times New Roman', serif" : 'monospace',
                resize: 'vertical', lineHeight: '1.6', fontSize: '12pt',
                backgroundColor: colors.input, color: colors.text,
                textAlign: 'justify'
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(ContentArea);

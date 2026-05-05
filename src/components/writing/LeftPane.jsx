import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import AddSubsection from './AddSubsection';
import ChapterHeader from './ChapterHeader';
import SubsectionItem from './SubsectionItem';
import DeletedSubsections from './DeletedSubsections';
import { getActiveSubsections, isReferencesClickable, validateReferencesClick } from '../../utils/leftPaneHelpers';

const LeftPane = ({
  chapters, activeChapter, onChapterClick, progress,
  onCustomizeSubsection, onAddSubsection, onSubsectionClick,
  onDeleteSubsection, onRestoreSubsection, generatingSubtopics,
  generatedSubsections, onDragStart, onDragOver, onDrop, onDragEnd,
  draggedItem, dragOverItem
}) => {
  const { colors } = useTheme();
  const [expandedChapter, setExpandedChapter] = useState(null);

  const handleChapterClick = (id) => {
    setExpandedChapter(expandedChapter === id ? null : id);
    onChapterClick(id);
  };

  const handleSubsectionClick = (subsection, allSubsections) => {
    if (!validateReferencesClick(subsection, allSubsections)) {
      alert('⚠️ Please generate all other subsections first before generating references.');
      return;
    }
    onSubsectionClick?.(subsection.title);
  };

  return (
    <div style={{
      width: '100%', height: '100vh', backgroundColor: colors.surface,
      borderRight: `1px solid ${colors.border}`, padding: '20px',
      overflowY: 'auto'
    }}>
      <h2 style={{
        fontSize: '1.25rem', fontWeight: 'bold', color: colors.text,
        marginBottom: '20px', paddingBottom: '12px',
        borderBottom: `2px solid ${colors.border}`
      }}>
        {chapters[0]?.projectTitle || 'Thesis Project'}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {chapters?.length > 0 ? chapters.map((chapter) => {
          const activeSubsections = getActiveSubsections(chapter.subsections || []);
          const refsClickable = isReferencesClickable(activeSubsections);
          const isExpanded = expandedChapter === chapter.id && chapter.unlocked;

          return (
            <div key={chapter.id} style={{ marginBottom: '4px' }}>
              <ChapterHeader
                chapter={chapter}
                isActive={activeChapter === chapter.id}
                isExpanded={expandedChapter === chapter.id}
                onClick={handleChapterClick}
              />

              {isExpanded && (
                <div style={{
                  marginLeft: '20px', padding: '12px',
                  backgroundColor: colors.isDarkMode ? '#2d2d2d' : '#f9fafb',
                  borderRadius: '8px', border: `1px solid ${colors.border}`,
                  marginTop: '4px'
                }}>
                  {generatingSubtopics && chapter.id === activeChapter && (
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <p style={{ color: colors.primary, fontSize: '13px' }}>Generating subtopics...</p>
                    </div>
                  )}

                  {activeSubsections.length > 0 && (
                    <div>
                      {activeSubsections.map((sub, idx) => {
                        const isRefs = sub.title === 'References' || sub.type === 'references';
                        const draggable = !isRefs;
                        const clickable = !isRefs || refsClickable;

                        return (
                          <SubsectionItem
                            key={sub.id}
                            subsection={sub}
                            chapterId={chapter.id}
                            index={idx}
                            isActiveChapter={activeChapter === chapter.id}
                            isDraggable={draggable}
                            isClickable={clickable}
                            isDragged={draggedItem === idx}
                            isDragOver={dragOverItem === idx && draggedItem !== idx}
                            onDragStart={onDragStart}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            onDragEnd={onDragEnd}
                            onClick={() => handleSubsectionClick(sub, activeSubsections)}
                            onDelete={onDeleteSubsection}
                          />
                        );
                      })}
                    </div>
                  )}

                  <AddSubsection onAdd={(title) => onAddSubsection(title)} />
                  <DeletedSubsections
                    chapterId={chapter.id}
                    deletedSubsections={chapter.deletedSubsections || []}
                    onRestore={(id) => onRestoreSubsection(id, chapter.id)}
                  />
                </div>
              )}
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', padding: '32px', color: colors.textSecondary }}>
            No chapters available
          </div>
        )}
      </div>

      <div style={{
        marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${colors.border}`,
        fontSize: '11px', color: colors.textSecondary, textAlign: 'center'
      }}>
        <p>Click a chapter to view subsections</p>
        <p style={{ marginTop: '4px', fontSize: '10px' }}>
          ⋮⋮ Drag to reorder • 🗑️ Delete • Restore from Deleted
        </p>
      </div>
    </div>
  );
};

export default LeftPane;

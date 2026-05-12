import React, { useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import AddSubsection from './AddSubsection';
import ChapterHeader from './ChapterHeader';
import SubsectionItem from './SubsectionItem';
import DeletedSubsections from './DeletedSubsections';
import { getActiveSubsections, isReferencesClickable, validateReferencesClick } from '../../utils/leftPaneHelpers';
import { distributeWordCount } from '../../utils/writeHelpers.jsx';
import { extractOutline } from '../../utils/outlineHelpers';

const LeftPane = ({
  chapters, activeChapter, onChapterClick, progress,
  onCustomizeSubsection, onAddSubsection, onSubsectionClick,
  onDeleteSubsection, onRestoreSubsection, onRenameSubsection, generatingSubtopics,
  generatedSubsections, onDragStart, onDragOver, onDrop, onDragEnd,
  draggedItem, dragOverItem, chapterWordCounts,
  generatingAll, onGenerateAll,
  onAddChapter, onRemoveChapter, onRenameChapter, onChapterReorder
}) => {
  const { colors, isDarkMode } = useTheme();
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [chapterDragIndex, setChapterDragIndex] = useState(null);
  const [chapterDragOverIndex, setChapterDragOverIndex] = useState(null);
  const [renamingChapter, setRenamingChapter] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleChapterClick = (id) => {
    setExpandedChapters(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    onChapterClick(id);
  };

  const allExpanded = chapters.filter(c => c.unlocked).length > 0 && expandedChapters.length === chapters.filter(c => c.unlocked).length;
  const handleToggleAll = useCallback(() => {
    if (allExpanded) setExpandedChapters([]);
    else setExpandedChapters(chapters.filter(c => c.unlocked).map(c => c.id));
  }, [allExpanded, chapters]);

  const handleChapterDragStart = (e, index) => {
    if (index === 0) { e.preventDefault(); return; }
    setChapterDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleChapterDragOver = (e, index) => {
    e.preventDefault();
    setChapterDragOverIndex(index);
  };

  const handleChapterDragEnd = () => {
    if (chapterDragIndex !== null && chapterDragOverIndex !== null && chapterDragIndex !== chapterDragOverIndex && chapterDragIndex !== 0 && chapterDragOverIndex !== 0) {
      onChapterReorder?.(chapterDragIndex, chapterDragOverIndex);
    }
    setChapterDragIndex(null);
    setChapterDragOverIndex(null);
  };

  const handleStartRename = (chapter) => {
    setRenamingChapter(chapter.id);
    setRenameValue(chapter.customTitle || chapter.title);
  };

  const handleConfirmRename = (chapterId) => {
    if (renameValue.trim()) {
      onRenameChapter?.(chapterId, renameValue.trim());
    }
    setRenamingChapter(null);
    setRenameValue('');
  };

  const handleDeleteConfirm = (chapterId) => {
    if (window.confirm('Are you sure you want to delete this chapter? All subsections and generated content will be permanently removed.')) {
      onRemoveChapter?.(chapterId);
    }
  };

  const handleSubsectionClick = (subsection, allSubsections) => {
    if (!validateReferencesClick(subsection, allSubsections)) return;
    onSubsectionClick?.(subsection.id);
  };

  return (
    <div style={{
      width: '100%', height: '100vh', backgroundColor: colors.surface,
      borderRight: `1px solid ${colors.border}`, padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px', paddingBottom: '12px',
        borderBottom: `2px solid ${colors.border}`
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: colors.text, margin: 0 }}>
          {chapters[0]?.projectTitle || 'Thesis Project'}
        </h2>
        <button
          onClick={handleToggleAll}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '12px', color: colors.primary, fontWeight: '500',
            padding: '4px 8px', borderRadius: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title={allExpanded ? 'Collapse all' : 'Expand all'}
        >
          {allExpanded ? '📁 Collapse all' : '📂 Expand all'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {chapters?.length > 0 ? chapters.map((chapter, chIndex) => {
          const activeSubsections = getActiveSubsections(chapter.subsections || []);
          const refsClickable = isReferencesClickable(activeSubsections);
          const isExpanded = expandedChapters.includes(chapter.id) && chapter.unlocked;
          const isChDragged = chapterDragIndex === chIndex;
          const isChDragOver = chapterDragOverIndex === chIndex && chapterDragIndex !== chIndex;

          return (
            <div
              key={chapter.id}
              onDragOver={(e) => handleChapterDragOver(e, chIndex)}
              onDrop={(e) => { e.preventDefault(); handleChapterDragEnd(); }}
              style={{
                marginBottom: '4px',
                borderTop: isChDragOver ? '2px solid ' + colors.primary : 'none',
                paddingTop: isChDragOver ? '2px' : '0',
                transition: 'border-top 0.2s, padding-top 0.2s'
              }}
            >
              <ChapterHeader
                chapter={chapter}
                isActive={activeChapter === chapter.id}
                isExpanded={expandedChapters.includes(chapter.id)}
                onClick={handleChapterClick}
                onRename={() => handleStartRename(chapter)}
                onDelete={() => handleDeleteConfirm(chapter.id)}
                isRenaming={renamingChapter === chapter.id}
                renameValue={renameValue}
                onRenameChange={(v) => setRenameValue(v)}
                onRenameConfirm={() => handleConfirmRename(chapter.id)}
                onRenameCancel={() => setRenamingChapter(null)}
                draggable={chIndex !== 0}
                onDragStart={(e) => { e.stopPropagation(); handleChapterDragStart(e, chIndex); }}
                chIndex={chIndex}
              />

              {isExpanded && (
                <div style={{
                  marginLeft: '20px', padding: '12px',
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
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
                        const isRefs = sub.type === 'references';
                        const draggable = !isRefs;
                        const clickable = !isRefs || refsClickable;
                        const totalWC = chapterWordCounts?.[chapter.id] || { min: 1000, max: 2000 };
                        const subWC = distributeWordCount(totalWC.min, totalWC.max, activeSubsections, sub.title);

                        const subContent = generatedSubsections[chapter.id]?.[sub.id] || '';
                        const subOutline = extractOutline(subContent);

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
                          wordCount={isRefs ? null : subWC}
                          outline={subOutline}
                          onDragStart={onDragStart}
                          onDragOver={onDragOver}
                          onDrop={onDrop}
                          onDragEnd={onDragEnd}
                          onClick={() => handleSubsectionClick(sub, activeSubsections)}
                          onDelete={(id) => onDeleteSubsection(id, chapter.id)}
                          onRename={(id, newTitle) => onRenameSubsection?.(id, newTitle)}
                        />);
                      })}
                    </div>
                  )}

                  <AddSubsection onAdd={onAddSubsection} />
                  {onGenerateAll && activeSubsections.some(s => !s.generated && s.type !== 'references') && (
                    generatingAll && generatingAll.chapterId === chapter.id ? (
                      <div style={{ marginTop: '12px', padding: '8px', fontSize: '12px', color: colors.primary, textAlign: 'center', backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0ff', borderRadius: '6px', border: `1px solid ${colors.border}` }}>
                        Generating {generatingAll.completed}/{generatingAll.total}...
                      </div>
                    ) : (
                      <button
                        onClick={() => onGenerateAll(chapter.id)}
                        style={{
                          marginTop: '12px', width: '100%', padding: '8px', fontSize: '12px',
                          backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0ff',
                          color: colors.primary, border: `1px solid ${colors.border}`,
                          borderRadius: '6px', cursor: 'pointer', fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.primary; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? '#2d2d2d' : '#f0f0ff'; e.currentTarget.style.color = colors.primary; }}
                      >
                        ⚡ Generate All Remaining ({activeSubsections.filter(s => !s.generated && s.type !== 'references').length})
                      </button>
                    )
                  )}
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

      {onAddChapter && (
        <button
          onClick={onAddChapter}
          style={{
            marginTop: '16px', width: '100%', padding: '12px', fontSize: '13px',
            backgroundColor: 'transparent', color: colors.primary,
            border: `2px dashed ${colors.primary}60`, borderRadius: '8px',
            cursor: 'pointer', fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.primary + '10'; e.currentTarget.style.borderColor = colors.primary; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = colors.primary + '60'; }}
        >
          + Add Chapter
        </button>
      )}

      <div style={{
        marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${colors.border}`,
        fontSize: '11px', color: colors.textSecondary, textAlign: 'center'
      }}>
        <p>Click a chapter to view subsections</p>
        <p style={{ marginTop: '4px', fontSize: '10px' }}>
          ⋮⋮ Drag to reorder • ✏️ Rename • 🗑️ Delete • Restore from Deleted
        </p>
      </div>
    </div>
  );
};

export default React.memo(LeftPane);

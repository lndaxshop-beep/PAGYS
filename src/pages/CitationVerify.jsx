import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { extractCitations, formatGroundedReference, getChapterDisplayTitle } from '../utils/writeHelpers.jsx';
import { getGeneratedContent, getChapters } from '../services/firestoreService';

const CitationVerify = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();

  const [project, setProject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [generatedContent, setGeneratedContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [verifiedCitations, setVerifiedCitations] = useState({});

  useEffect(() => {
    const loadProject = async () => {
      const savedUser = localStorage.getItem('currentUser');
      if (!savedUser) { navigate('/login'); return; }
      try {
        const user = JSON.parse(savedUser);
        const projectDoc = await getDoc(doc(db, 'users', user.uid, 'projects', projectId));
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() });
        } else {
          const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
          const found = localProjects.find(p => p.id === projectId);
          if (found) setProject(found);
        }

        const [savedContent, savedChapters] = await Promise.all([
          getGeneratedContent(projectId),
          getChapters(projectId)
        ]);

        if (savedContent && Object.keys(savedContent).length) setGeneratedContent(savedContent);
        if (savedChapters && Array.isArray(savedChapters)) setChapters(savedChapters);
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId, navigate]);

  useEffect(() => {
    const stored = localStorage.getItem(`verifiedCitations_${projectId}`);
    if (stored) setVerifiedCitations(JSON.parse(stored));
  }, [projectId]);

  const markVerified = useCallback((chapterId, citation) => {
    const key = `${chapterId}::${citation}`;
    const updated = { ...verifiedCitations, [key]: true };
    setVerifiedCitations(updated);
    localStorage.setItem(`verifiedCitations_${projectId}`, JSON.stringify(updated));
  }, [verifiedCitations, projectId]);

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: colors.text, fontSize: '18px' }}>Loading citations...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ color: colors.text, fontSize: '18px' }}>Project not found</div>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 24px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Back to Dashboard</button>
      </div>
    );
  }

  const style = project?.referenceStyle || 'apa';

  const chapterMap = {};
  chapters.forEach(ch => { chapterMap[ch.id] = ch; });

  const chapterData = chapters.map(chapter => {
    const chapterId = chapter.id;
    const contentMap = generatedContent[chapterId] || {};
    const subsectionTitles = new Set((chapter?.subsections || []).filter(s => !s.deleted && s.title !== 'References').map(s => s.title));

    const subsections = [];
    Object.entries(contentMap).forEach(([title, content]) => {
      if (title === 'References' || !content) return;
      if (subsectionTitles.size > 0 && !subsectionTitles.has(title)) return;
      const citations = extractCitations(content);
      const uniqueCitations = [...new Set(citations)];
      if (uniqueCitations.length > 0) {
        subsections.push({ title, citations: uniqueCitations });
      }
    });

    const groundingSources = JSON.parse(localStorage.getItem(`groundingSources_${chapterId}`) || '[]');

    const totalCitations = subsections.reduce((sum, s) => sum + s.citations.length, 0);

    const citationDetails = [];
    subsections.forEach(sub => {
      sub.citations.forEach(citation => {
        const parts = citation.split(/[, ]+/);
        const author = parts[0]?.toLowerCase();
        const year = parts[1]?.replace(/[a-z]?\)$/, '');
        let matchedSource = null;
        groundingSources.forEach(source => {
          const formatted = formatGroundedReference(source, style);
          if (author && year && formatted?.toLowerCase().includes(author) && formatted.includes(year)) {
            matchedSource = source;
          }
        });
        const key = `${chapterId}::${citation}`;
        citationDetails.push({
          citation,
          subsection: sub.title,
          matchedSource,
          verified: verifiedCitations[key] || false
        });
      });
    });

    return {
      id: chapterId,
      label: getChapterDisplayTitle(chapter),
      subsections,
      totalCitations,
      citationDetails,
      verifiedCount: citationDetails.filter(c => c.verified).length
    };
  }).filter(ch => ch.totalCitations > 0);

  const totalCitations = chapterData.reduce((sum, ch) => sum + ch.totalCitations, 0);
  const totalVerified = chapterData.reduce((sum, ch) => sum + ch.verifiedCount, 0);
  const verificationPercent = totalCitations > 0 ? Math.round((totalVerified / totalCitations) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, padding: '32px', transition: 'all 0.3s' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${colors.text}40`, borderRadius: '6px', color: colors.text, cursor: 'pointer', fontSize: '14px' }}
        >
          &larr; Back to Dashboard
        </button>

        <div style={{ marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, margin: '0 0 4px' }}>Citation Verification</h1>
          <p style={{ fontSize: '15px', color: `${colors.text}99`, margin: '0 0 24px' }}>{project?.title}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', padding: '16px 20px', backgroundColor: colors.cardBg, borderRadius: '12px', border: `1px solid ${colors.text}15` }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: colors.text, fontWeight: '600' }}>{totalVerified} of {totalCitations} citations verified</span>
              <span style={{ fontSize: '14px', color: '#4F46E5', fontWeight: '700' }}>{verificationPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: `${colors.text}15`, borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${verificationPercent}%`, height: '100%', backgroundColor: verificationPercent >= 80 ? '#10B981' : verificationPercent >= 50 ? '#F59E0B' : '#EF4444', borderRadius: '4px', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {chapterData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: colors.cardBg, borderRadius: '12px', border: `1px solid ${colors.text}15` }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: `${colors.text}40` }}>&#128214;</div>
            <h3 style={{ fontSize: '18px', color: colors.text, margin: '0 0 8px' }}>No Citations Found</h3>
            <p style={{ fontSize: '14px', color: `${colors.text}80`, margin: '0 0 20px' }}>Generate some content with citations first, then return here to verify them.</p>
            <button onClick={() => navigate(`/write/${projectId}`)} style={{ padding: '10px 24px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Go to Writing</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chapterData.map(chapter => (
              <div key={chapter.id} style={{ backgroundColor: colors.cardBg, borderRadius: '12px', border: `1px solid ${colors.text}15`, overflow: 'hidden' }}>
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{chapter.label}</span>
                    <span style={{ fontSize: '13px', color: `${colors.text}80`, backgroundColor: `${colors.text}10`, padding: '2px 8px', borderRadius: '12px' }}>{chapter.totalCitations} citations</span>
                    {chapter.verifiedCount > 0 && (
                      <span style={{ fontSize: '13px', color: '#10B981', backgroundColor: '#10B98120', padding: '2px 8px', borderRadius: '12px' }}>{chapter.verifiedCount} verified</span>
                    )}
                  </div>
                  <span style={{ fontSize: '18px', color: `${colors.text}60`, transform: expandedChapters[chapter.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>&#9660;</span>
                </button>

                {expandedChapters[chapter.id] && (
                  <div style={{ padding: '0 20px 20px' }}>
                    {chapter.citationDetails.map((detail, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderTop: idx > 0 ? `1px solid ${colors.text}10` : 'none' }}>
                        <div style={{ marginTop: '2px', flexShrink: 0 }}>
                          {detail.verified ? (
                            <span style={{ color: '#10B981', fontSize: '18px' }}>&#10003;</span>
                          ) : (
                            <span style={{ color: `${colors.text}30`, fontSize: '18px' }}>&#9744;</span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>({detail.citation})</div>
                          <div style={{ fontSize: '13px', color: `${colors.text}80`, marginBottom: '4px' }}>In: {detail.subsection}</div>
                          {detail.matchedSource ? (
                            <div style={{ fontSize: '13px', color: `${colors.text}70`, marginBottom: '6px' }}>
                              Source: {detail.matchedSource.title || detail.matchedSource.uri}
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#F59E0B', marginBottom: '6px' }}>No matching grounding source found</div>
                          )}
                        </div>
                        {detail.matchedSource?.uri && (
                          <button
                            onClick={() => markVerified(chapter.id, detail.citation)}
                            style={{
                              flexShrink: 0, padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                              backgroundColor: detail.verified ? '#10B981' : '#4F46E5',
                              color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            {detail.verified ? 'Verified' : 'Verify'}
                          </button>
                        )}
                        {!detail.matchedSource?.uri && (
                          <span style={{ flexShrink: 0, fontSize: '12px', color: `${colors.text}40`, padding: '6px 10px' }}>No source link</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '32px', padding: '16px 20px', backgroundColor: '#4F46E515', borderRadius: '10px', border: '1px solid #4F46E530' }}>
          <p style={{ fontSize: '13px', color: '#4F46E5', margin: 0, lineHeight: '1.6' }}>
            <strong>Tip:</strong> Click "Verify" after reviewing the source to confirm it supports the citation. Verified citations are saved to your browser. Aim to verify all citations before submitting your final document.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CitationVerify;

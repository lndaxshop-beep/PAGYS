import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ProjectCard from './ProjectCard';
import { CardSkeleton } from '../Skeleton';
import { useResponsive } from '../../hooks/useResponsive';

const SkeletonCard = ({ colors, isDarkMode }) => (
  <div style={{
    backgroundColor: colors.surface, borderRadius: '12px', padding: '20px',
    border: `1px solid ${colors.border}`, position: 'relative', overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(90deg, transparent, ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}, transparent)`,
      animation: 'shimmer 1.5s infinite'
    }} />
    <div style={{ height: '18px', backgroundColor: isDarkMode ? '#3d3d3d' : '#e5e7eb', borderRadius: '4px', marginBottom: '8px', width: '70%' }} />
    <div style={{ height: '12px', backgroundColor: isDarkMode ? '#3d3d3d' : '#e5e7eb', borderRadius: '4px', marginBottom: '12px', width: '40%' }} />
    <div style={{ height: '6px', backgroundColor: isDarkMode ? '#3d3d3d' : '#e5e7eb', borderRadius: '999px', marginBottom: '12px' }} />
    <div style={{ height: '36px', backgroundColor: isDarkMode ? '#3d3d3d' : '#e5e7eb', borderRadius: '6px' }} />
  </div>
);

const ProjectsList = ({ projects, loading, progressLoading, hoveredProject, onHover, onContinue, onDelete, onCreateFirst, onUpgrade }) => {
  const { colors, isDarkMode } = useTheme();
  const { isMobile } = useResponsive();
  if (loading) return <CardSkeleton count={3} />;
  if (!projects.length) {
    return (
      <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: isMobile ? '32px 20px' : '48px 48px 56px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
        <div style={{
          width: '64px', height: '64px', margin: '0 auto 20px', borderRadius: '50%',
          backgroundColor: isDarkMode ? '#2d2d2d' : '#f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px'
        }}>📝</div>
        <p style={{ color: colors.textSecondary, marginBottom: '4px', fontWeight: '500', fontSize: isMobile ? '15px' : '16px' }}>No projects yet</p>
        <p style={{ color: colors.textSecondary, marginBottom: '24px', fontSize: isMobile ? '13px' : '14px' }}>Start your first thesis and turn ideas into a polished document.</p>
        <button onClick={onCreateFirst} style={{
          backgroundColor: colors.primary, color: 'white', padding: isMobile ? '12px 24px' : '14px 32px',
          border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
          fontSize: isMobile ? '14px' : '15px', transition: 'transform 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>+</span> Create Your First Project
        </button>
      </div>
    );
  }
  return (
    <>
      <div style={{
        display: 'grid',
        gap: isMobile ? '12px' : '16px',
        gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '100%' : '350px'}, 1fr))`,
      }}>
        {progressLoading
          ? Array.from({ length: projects.length }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} colors={colors} isDarkMode={isDarkMode} />
            ))
          : projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                isHovered={hoveredProject === project.id}
                onHover={onHover}
                onContinue={onContinue}
                onDelete={onDelete}
                onUpgrade={onUpgrade}
              />
            ))}
      </div>
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
    </>
  );
};

export default ProjectsList;

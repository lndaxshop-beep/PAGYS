import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ProjectCard from './ProjectCard';

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

const ProjectsList = ({ projects, loading, progressLoading, hoveredProject, onHover, onContinue, onDelete, onCreateFirst }) => {
  const { colors, isDarkMode } = useTheme();
  if (loading) return <p style={{ textAlign: 'center', padding: '32px', color: colors.textSecondary }}>Loading...</p>;
  if (!projects.length) {
    return (
      <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '48px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
        <p style={{ color: colors.textSecondary, marginBottom: '16px' }}>You haven't started any projects yet</p>
        <button onClick={onCreateFirst} style={{
          backgroundColor: colors.primary, color: 'white', padding: '12px 24px',
          border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
        }}>Create Your First Project</button>
      </div>
    );
  }
  return (
    <>
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
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
              />
            ))}
      </div>
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
    </>
  );
};

export default ProjectsList;

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ProjectCard from './ProjectCard';

const ProjectsList = ({ projects, loading, hoveredProject, onHover, onContinue, onDelete, onCreateFirst }) => {
  const { colors } = useTheme();
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
    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
      {projects.map(project => (
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
  );
};

export default ProjectsList;

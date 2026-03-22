import Project from '../models/Project.js';

export async function getProjectRole(userId, projectId) {
  const project = await Project.findById(projectId);
  if (!project) return { project: null, role: null };
  const ownerStr = project.owner.toString();
  if (ownerStr === userId) return { project, role: 'owner' };
  const m = project.members.find((mem) => mem.user.toString() === userId);
  if (m) return { project, role: m.role };
  return { project: null, role: null };
}

export function canManageProject(role) {
  return role === 'owner' || role === 'admin';
}

export function canEditTasks(role) {
  return role === 'owner' || role === 'admin' || role === 'member';
}

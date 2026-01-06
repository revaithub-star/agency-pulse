// API-based storage utility
export const getProjects = async () => {
  try {
    const res = await fetch('/api/projects', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const saveProject = async (project) => {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!res.ok) throw new Error('Failed to save project');
    return await res.json();
  } catch (error) {
    console.error(error);
  }
};

export const deleteProject = async (id) => {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete project');
    return await res.json();
  } catch (error) {
    console.error(error);
  }
};

export const updateProject = async (id, updates) => {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return await res.json();
  } catch (error) {
    console.error(error);
  }
};

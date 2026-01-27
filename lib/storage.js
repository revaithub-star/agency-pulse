// API-based storage utility
export const getProjects = async () => {
  try {
    const res = await fetch('/api/projects', { cache: 'no-store' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch projects');
    }
    return await res.json();
  } catch (error) {
    console.error('[Storage] getProjects Error:', error);
    throw error; // Re-throw to allow component handling
  }
};

export const saveProject = async (project) => {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save project');
    }
    return await res.json();
  } catch (error) {
    console.error('[Storage] saveProject Error:', error);
    throw error;
  }
};

export const deleteProject = async (id) => {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete project');
    }
    return await res.json();
  } catch (error) {
    console.error('[Storage] deleteProject Error:', error);
    throw error;
  }
};

export const updateProject = async (id, updates) => {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update project');
    }
    return await res.json();
  } catch (error) {
    console.error('[Storage] updateProject Error:', error);
    throw error;
  }
};


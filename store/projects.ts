import { create } from 'zustand';

export interface Project {
  id: string;
  title: string;
  createdAt: number;
  clips: Array<{
    id: string;
    type: 'image' | 'video' | 'audio';
    uri: string;
    duration: number;
    startTime: number;
  }>;
}

interface ProjectsStore {
  projects: Project[];
  createProject: (title: string) => string;
  addClip: (projectId: string, clip: Omit<Project['clips'][0], 'id'>) => void;
  removeClip: (projectId: string, clipId: string) => void;
  updateClip: (
    projectId: string,
    clipId: string,
    updates: Partial<Omit<Project['clips'][0], 'id'>>
  ) => void;
}

export const useProjects = create<ProjectsStore>((set) => ({
  projects: [],
  createProject: (title) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      projects: [
        ...state.projects,
        {
          id,
          title,
          createdAt: Date.now(),
          clips: [],
        },
      ],
    }));
    return id;
  },
  addClip: (projectId, clip) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              clips: [
                ...project.clips,
                {
                  ...clip,
                  id: Math.random().toString(36).substring(7),
                },
              ],
            }
          : project
      ),
    }));
  },
  removeClip: (projectId, clipId) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              clips: project.clips.filter((clip) => clip.id !== clipId),
            }
          : project
      ),
    }));
  },
  updateClip: (projectId, clipId, updates) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              clips: project.clips.map((clip) =>
                clip.id === clipId ? { ...clip, ...updates } : clip
              ),
            }
          : project
      ),
    }));
  },
}));
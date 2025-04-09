import { create } from 'zustand';

export interface Layer {
  id: number;
  position: number;
}

export interface Project {
  id: string;
  title: string;
  createdAt: number;
  layers: Layer[];
  clips: Array<{
    id: string;
    type: 'image' | 'video' | 'audio';
    uri: string;
    duration: number;
    startTime: number;
    layerId: number;
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
  addLayer: (projectId: string, layer: Omit<Layer, 'id'>) => void;
  removeLayer: (projectId: string, layerId: number) => void;
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
          layers: [
            {
              id: Math.floor(Math.random() * 1000) + 1,
              position: 1,
            },
          ],
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
  addLayer: (projectId: string, layer: Omit<Layer, 'id'>) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              layers: [
                ...project.layers,
                {
                  id: Math.floor(Math.random() * 1000) + 1,
                  position: layer.position,
                },
              ],
            }
          : project
      ),
    }));
  },
  removeLayer: (projectId: string, layerId: number) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              layers: project.layers
                .filter((layer) => layer.id !== layerId)
                .map((layer, index) => ({
                  ...layer,
                  position: index + 1,
                })),
              clips: project.clips.filter((clip) => clip.layerId !== layerId),
            }
          : project
      ),
    }));
  },
}));

import { create } from "zustand";

type ModuleStatus = "completed" | "current" | "locked";

interface Module {
  id: string;
  emoji: string;
  title: string;
  instructor: string;
  status: ModuleStatus;
  progress?: number;
  questions?: number;
  type?: "quiz" | "article" | "question";
  resourceLink?: string;
}

interface TrailState {
  // Trail progress by trail ID
  trails: Record<string, Module[]>;
  
  // Initialize trail modules
  initializeTrail: (trailId: string, modules: Module[]) => void;
  
  // Mark current module as completed and unlock next
  completeCurrentModule: (trailId: string) => void;
  
  // Get modules for a trail
  getTrailModules: (trailId: string) => Module[];
}

export const useTrailStore = create<TrailState>((set, get) => ({
  trails: {},

  initializeTrail: (trailId, modules) =>
    set((state) => ({
      trails: {
        ...state.trails,
        [trailId]: modules,
      },
    })),

  completeCurrentModule: (trailId) =>
    set((state) => {
      const currentModules = state.trails[trailId];
      if (!currentModules) return state;

      const updatedModules = [...currentModules];
      const currentIndex = updatedModules.findIndex(
        (m) => m.status === "current"
      );

      if (currentIndex === -1) return state;

      // Mark current as completed
      updatedModules[currentIndex] = {
        ...updatedModules[currentIndex],
        status: "completed",
      };

      // Unlock next if exists
      if (currentIndex + 1 < updatedModules.length) {
        updatedModules[currentIndex + 1] = {
          ...updatedModules[currentIndex + 1],
          status: "current",
        };
      }

      return {
        trails: {
          ...state.trails,
          [trailId]: updatedModules,
        },
      };
    }),

  getTrailModules: (trailId) => {
    const state = get();
    return state.trails[trailId] || [];
  },
}));

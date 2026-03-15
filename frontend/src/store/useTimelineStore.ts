import { create } from 'zustand';
import type { Category, SearchParams } from '../types/timeline';
import type { Viewport } from '../types/viewport';

interface TimelineState {
  // Viewport
  viewport: Viewport;
  setViewport: (viewport: Partial<Viewport>) => void;

  // Selection
  selectedEventId: number | null;
  setSelectedEventId: (id: number | null) => void;

  // Filters
  filters: SearchParams;
  setFilters: (filters: Partial<SearchParams>) => void;

  // Categories
  categories: Category[];
  setCategories: (categories: Category[]) => void;

  // UI state
  showDetailPanel: boolean;
  setShowDetailPanel: (show: boolean) => void;
  viewMode: 'pixi' | 'three';
  setViewMode: (mode: 'pixi' | 'three') => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  // Viewport
  viewport: {
    fromYear: 1800,
    toYear: 2030,
    centerYear: 1915,
    zoomLevel: 8,
    width: 0,
    height: 0,
  },
  setViewport: (partial) =>
    set((state) => ({ viewport: { ...state.viewport, ...partial } })),

  // Selection
  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),

  // Filters
  filters: {},
  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),

  // Categories
  categories: [],
  setCategories: (categories) => set({ categories }),

  // UI state
  showDetailPanel: false,
  setShowDetailPanel: (show) => set({ showDetailPanel: show }),
  viewMode: 'pixi',
  setViewMode: (mode) => set({ viewMode: mode }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

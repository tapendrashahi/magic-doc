import { create } from 'zustand';
import type { Note } from '../types';
import apiClient from '../api/client';

interface NoteStore {
  notes: Note[];
  currentNote: Note | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentNote: (note: Note | null) => void;
  
  // Async actions
  fetchNotes: () => Promise<void>;
  createNote: (title: string, latex_content: string) => Promise<Note>;
  updateNote: (id: number, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  
  // Conversion
  convertLatex: (latex_content: string) => Promise<string>;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  currentNote: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentNote: (note) => set({ currentNote: note }),

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.getNotes();
      set({ notes: response.data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch notes', loading: false });
    }
  },

  createNote: async (title, latex_content) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.createNote({
        title,
        latex_content,
      });
      const newNote = response.data;
      set((state) => ({
        notes: [...state.notes, newNote],
        currentNote: newNote,
        loading: false,
      }));
      return newNote;
    } catch (error) {
      set({ error: 'Failed to create note', loading: false });
      throw error;
    }
  },

  updateNote: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.updateNote(id, data);
      set((state) => {
        const updatedNotes = state.notes.map((note) =>
          note.id === id ? { ...note, ...response.data } : note
        );
        return {
          notes: updatedNotes,
          currentNote:
            state.currentNote?.id === id
              ? { ...state.currentNote, ...response.data }
              : state.currentNote,
          loading: false,
        };
      });
    } catch (error) {
      set({ error: 'Failed to update note', loading: false });
      throw error;
    }
  },

  deleteNote: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.deleteNote(id);
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete note', loading: false });
      throw error;
    }
  },

  toggleFavorite: async (id) => {
    try {
      await apiClient.toggleFavorite(id);
      set((state) => {
        const updatedNotes = state.notes.map((note) =>
          note.id === id ? { ...note, is_favorite: !note.is_favorite } : note
        );
        return {
          notes: updatedNotes,
          currentNote:
            state.currentNote?.id === id
              ? {
                  ...state.currentNote,
                  is_favorite: !state.currentNote.is_favorite,
                }
              : state.currentNote,
        };
      });
    } catch (error) {
      set({ error: 'Failed to toggle favorite', loading: false });
    }
  },

  convertLatex: async (latex_content) => {
    console.log('[NoteStore] convertLatex called, LaTeX length:', latex_content.length);
    set({ loading: true, error: null });
    try {
      console.log('[NoteStore] Calling API convertLatex...');
      const response = await apiClient.convertLatex(latex_content);
      console.log('[NoteStore] ✓ API response:', {
        hasHtmlContent: !!response.data.html_content,
        htmlLength: response.data.html_content?.length
      });
      set({ loading: false });
      return response.data.html_content;
    } catch (error) {
      console.error('[NoteStore] convertLatex error:', error);
      set({ error: 'Failed to convert LaTeX', loading: false });
      throw error;
    }
  },
}));

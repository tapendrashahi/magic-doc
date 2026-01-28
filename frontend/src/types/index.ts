// Types for the application
export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface Note {
  id: number;
  title: string;
  latex_content: string;
  html_content: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversionResult {
  html_content: string;
  error?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface NoteState {
  notes: Note[];
  currentNote: Note | null;
  loading: boolean;
  error: string | null;
}

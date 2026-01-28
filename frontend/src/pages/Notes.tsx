import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

interface Note {
  id: number;
  title: string;
  latex_content: string;
  html_content: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getNotes();
      setNotes(response.data.results || []);
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (id: number) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await apiClient.deleteNote(id);
      setNotes(notes.filter((n) => n.id !== id));
    } catch (err) {
      setError('Failed to delete note');
    }
  };

  const toggleFavorite = async (id: number) => {
    try {
      await apiClient.toggleFavorite(id);
      setNotes(notes.map((n) => (n.id === id ? { ...n, is_favorite: !n.is_favorite } : n)));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Notes</h2>
        <button
          onClick={() => navigate('/editor')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          New Note
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No notes yet. Create your first one!</div>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 cursor-pointer" onClick={() => navigate(`/editor/${note.id}`)}>
                  <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600">{note.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {note.latex_content.substring(0, 100)}
                    {note.latex_content.length > 100 ? '...' : ''}
                  </p>
                  <div className="text-xs text-gray-400 mt-2">
                    Updated: {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => toggleFavorite(note.id)}
                    className={`p-2 rounded transition ${
                      note.is_favorite ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                    }`}
                    title="Toggle favorite"
                  >
                    ★
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200 transition"
                    title="Delete note"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

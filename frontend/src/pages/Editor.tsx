import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LaTeXInput } from '../components/LaTeXInput';
import { HTMLPreview } from '../components/HTMLPreview';
import { useNoteStore } from '../store/noteStore';
import { keyboardManager } from '../services/keyboard';
import { toastManager } from '../services/toast';
import { ExportService } from '../services/export';
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

export const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading: storeLoading, error: storeError } = useNoteStore();

  const [title, setTitle] = useState('');
  const [latex, setLatex] = useState('');
  const [html, setHtml] = useState('');
  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [note, setNote] = useState<any>(null);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (id) {
      loadNote();
    }
    fetchAllNotes();
  }, [id]);

  // Auto-convert LaTeX if HTML is empty after loading
  useEffect(() => {
    if (latex && !html && !isLoading) {
      console.log('[Editor] Auto-converting loaded LaTeX (HTML is empty)');
      handleLatexChangeAndConvert(latex);
    }
  }, [latex, isLoading]);

  // Register keyboard shortcuts
  useEffect(() => {
    const handleSaveKeyboard = async () => {
      if (title.trim()) {
        await handleSaveNote();
      } else {
        toastManager.warning('Please enter a note title first');
      }
    };

    const handleCopyKeyboard = async () => {
      if (html) {
        try {
          await ExportService.copyToClipboard(html);
          toastManager.success('HTML copied to clipboard!');
        } catch (err) {
          toastManager.error('Failed to copy to clipboard');
        }
      } else {
        toastManager.warning('No content to copy');
      }
    };

    keyboardManager.register({
      key: 's',
      ctrlKey: true,
      action: handleSaveKeyboard,
    });

    keyboardManager.register({
      key: 'c',
      ctrlKey: true,
      shiftKey: true,
      action: handleCopyKeyboard,
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardManager.handleKeyDown(e);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [title, html]);

  const loadNote = async () => {
    try {
      console.log('[Editor] Loading note with id:', id);
      const response = await apiClient.getNote(parseInt(id!));
      console.log('[Editor] ✓ Note loaded:', {
        title: response.data.title,
        latexLength: response.data.latex_content?.length,
        htmlLength: response.data.html_content?.length
      });
      
      setTitle(response.data.title);
      setLatex(response.data.latex_content);
      setNote(response.data);
      setError('');

      // Check if HTML is empty but LaTeX exists
      if (response.data.latex_content && !response.data.html_content) {
        console.log('[Editor] ⚠️  HTML is empty, triggering auto-conversion...');
        try {
          // Auto-convert LaTeX if HTML missing
          const html = await apiClient.convertLatex(response.data.latex_content);
          console.log('[Editor] ✓ Auto-conversion complete, HTML length:', html.data.html_content?.length);
          setHtml(html.data.html_content);
        } catch (conversionErr) {
          console.error('[Editor] Auto-conversion failed:', conversionErr);
          setError('Failed to convert LaTeX');
        }
      } else {
        setHtml(response.data.html_content);
      }
    } catch (err) {
      console.error('[Editor] Failed to load note:', err);
      setError('Failed to load note');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllNotes = async () => {
    try {
      setNotesLoading(true);
      const response = await apiClient.getNotes();
      setAllNotes(response.data.results || []);
    } catch (err) {
      console.error('[Editor] Failed to fetch notes:', err);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleLatexChange = useCallback((newLatex: string) => {
    console.log('[Editor] LaTeX changed, length:', newLatex.length);
    setLatex(newLatex);
  }, []);

  const handleConvert = useCallback((newHtml: string) => {
    console.log('[Editor] HTML conversion result, length:', newHtml.length);
    setHtml(newHtml);
    setError('');
  }, []);

  const handleLatexChangeAndConvert = useCallback(async (newLatex: string) => {
    console.log('[Editor] LaTeX change and convert, length:', newLatex.length);
    setLatex(newLatex);
    
    if (newLatex.trim()) {
      try {
        console.log('[Editor] Converting LaTeX...');
        const response = await apiClient.convertLatex(newLatex);
        const html = response.data.html_content;
        console.log('[Editor] ✓ Conversion complete, HTML length:', html.length);
        setHtml(html);
        setError('');
      } catch (err) {
        console.error('[Editor] Conversion failed:', err);
        setError('Failed to convert LaTeX');
      }
    }
  }, []);

  const handleSaveNote = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      toastManager.warning('Please enter a note title');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      if (id) {
        const response = await apiClient.updateNote(parseInt(id), {
          title,
          latex_content: latex,
          html_content: html,
        });
        setNote(response.data);
        setLastSaved(new Date());
        toastManager.success('Note saved!');
      } else {
        const response = await apiClient.createNote({
          title,
          latex_content: latex,
        });
        setNote(response.data);
        navigate(`/editor/${response.data.id}`);
        toastManager.success('Note created!');
      }
    } catch (err) {
      setError('Failed to save note');
      toastManager.error('Failed to save note');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && id) {
    return (
      <div className="text-center py-8 animate-fadeIn">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading note...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col overflow-hidden ${
          sidebarOpen ? 'w-56' : 'w-0'
        }`}
      >
        <div className="p-2 border-b border-gray-200">
          <button
            onClick={() => navigate('/editor')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded text-sm transition flex items-center justify-center gap-1"
          >
            ✏️ New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notesLoading ? (
            <div className="p-2 text-center text-gray-500 text-xs">Loading...</div>
          ) : allNotes.length === 0 ? (
            <div className="p-2 text-center text-gray-500 text-xs">No notes</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {allNotes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => navigate(`/editor/${n.id}`)}
                  className={`p-2.5 cursor-pointer hover:bg-gray-50 transition border-l-4 text-xs ${
                    id == n.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-800 truncate text-sm">
                    {n.title}
                  </h3>
                  <p className="text-gray-600 mt-0.5 line-clamp-1 text-xs">
                    {n.latex_content.substring(0, 40)}...
                  </p>
                  <p className="text-gray-400 mt-0.5 text-xs">
                    {new Date(n.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-100 rounded transition text-sm font-semibold"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {id ? 'Edit' : 'New Note'}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-green-600 font-semibold">
                ✓ {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => navigate('/notes')}
              className="px-3 py-1 text-gray-600 hover:text-gray-800 font-semibold transition text-sm"
            >
              All Notes
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3 animate-slideUp">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm animate-slideUp">
                {error}
              </div>
            )}

            {storeError && (
              <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm animate-slideUp">
                {storeError}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Note Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 h-80">
              <LaTeXInput
                value={latex}
                onChange={handleLatexChange}
                onConvert={handleConvert}
              />
              <HTMLPreview
                html={html}
                loading={storeLoading}
                error={storeError}
                note={note}
              />
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSaveNote}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition font-semibold flex items-center justify-center gap-1 text-sm"
                title="Ctrl+S"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>💾 Save</>
                )}
              </button>
              <button
                onClick={() => navigate('/notes')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition font-semibold text-sm"
              >
                Back
              </button>
            </div>

            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
              <p className="font-semibold mb-1">⌨️ Shortcuts:</p>
              <ul className="space-y-0.5 text-xs">
                <li>
                  <kbd className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">Ctrl+S</kbd> - Save
                </li>
                <li>
                  <kbd className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">Ctrl+Shift+C</kbd> - Copy
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

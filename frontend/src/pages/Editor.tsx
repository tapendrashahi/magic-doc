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
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [hasChanges, setHasChanges] = useState(false);
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

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!hasChanges || !title.trim() || autoSaveStatus === 'saving') return;

    setAutoSaveStatus('saving');
    const autoSaveTimer = setTimeout(async () => {
      try {
        console.log('[Editor] Auto-saving note...');
        if (id) {
          await apiClient.updateNote(parseInt(id), {
            title,
            latex_content: latex,
            html_content: html,
          });
        }
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
        setHasChanges(false);
        console.log('[Editor] ✓ Auto-save complete');
      } catch (err) {
        console.error('[Editor] Auto-save failed:', err);
        setAutoSaveStatus('error');
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [hasChanges, title, latex, id]);

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
    setHasChanges(true);
    setAutoSaveStatus('unsaved');
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
      setAutoSaveStatus('saving');
      setError('');

      if (id) {
        const response = await apiClient.updateNote(parseInt(id), {
          title,
          latex_content: latex,
          html_content: html,
        });
        setNote(response.data);
        setLastSaved(new Date());
        setAutoSaveStatus('saved');
        setHasChanges(false);
        toastManager.success('Note saved!');
        console.log('[Editor] ✓ Note saved manually');
      } else {
        const response = await apiClient.createNote({
          title,
          latex_content: latex,
        });
        setNote(response.data);
        setAutoSaveStatus('saved');
        setHasChanges(false);
        navigate(`/editor/${response.data.id}`);
        toastManager.success('Note created!');
        console.log('[Editor] ✓ Note created');
      }
    } catch (err) {
      setError('Failed to save note');
      setAutoSaveStatus('error');
      toastManager.error('Failed to save note');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyHTML = async () => {
    try {
      await ExportService.copyToClipboard(html);
      toastManager.success('HTML copied to clipboard!');
    } catch (err) {
      toastManager.error('Failed to copy to clipboard');
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
                  role="option"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/editor/${n.id}`);
                    }
                  }}
                  className={`p-2.5 cursor-pointer hover:bg-gray-50 transition border-l-4 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    id == n.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  aria-selected={id == n.id}
                  aria-label={`Open note: ${n.title}`}
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
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded transition text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>

            {/* New Note button moved to header */}
            <button
              onClick={() => navigate('/editor')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center gap-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              aria-label="Create a new note"
            >
              ✏️ New Note
            </button>

            <h1 className="text-xl font-bold text-gray-800 ml-2">
              {id ? 'Edit Note' : 'New Note'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Auto-save status indicator */}
            <div className="flex items-center gap-2">
              {autoSaveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-sm text-blue-600 font-semibold">
                  <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full" />
                  Saving...
                </span>
              )}
              {autoSaveStatus === 'saved' && lastSaved && (
                <span className="text-xs text-green-600 font-semibold whitespace-nowrap">
                  ✓ Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {autoSaveStatus === 'unsaved' && (
                <span className="text-xs text-amber-600 font-semibold whitespace-nowrap">
                  ⚠️ Unsaved changes
                </span>
              )}
              {autoSaveStatus === 'error' && (
                <span className="text-xs text-red-600 font-semibold whitespace-nowrap">
                  ✗ Save failed
                </span>
              )}
            </div>

            <button
              onClick={() => navigate('/notes')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded font-semibold transition text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              aria-label="Go back to all notes"
            >
              All Notes
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="space-y-4">
            {error && (
              <div className="p-2 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm rounded-r animate-slideUp">
                {error}
              </div>
            )}

            {storeError && (
              <div className="p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-sm rounded-r animate-slideUp">
                {storeError}
              </div>
            )}

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <label htmlFor="note-title" className="block text-sm font-semibold text-gray-700 mb-2">
                Note Title
              </label>
              <input
                id="note-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setHasChanges(true);
                  setAutoSaveStatus('unsaved');
                }}
                placeholder="Enter note title..."
                className="w-full px-4 py-2 border border-gray-300 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition text-base"
                aria-label="Note title"
                aria-describedby="title-help"
              />
              <p id="title-help" className="sr-only">Enter a descriptive title for this note</p>
            </div>

            <div className="grid grid-cols-[60%_40%] gap-4 h-96">
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
          </div>
        </div>

        {/* Action Bar */}
        <footer className="border-t border-gray-200 bg-white p-4 flex gap-3 items-center shadow-md">
          <button
            onClick={handleSaveNote}
            disabled={isSaving || autoSaveStatus === 'saved'}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold flex items-center justify-center gap-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            title="Save note (Ctrl+S)"
            aria-label="Save note"
            aria-busy={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>💾 Save Note</>
            )}
          </button>
          <button
            onClick={() => navigate('/notes')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700"
            aria-label="Back to notes list"
          >
            📝 Back to Notes
          </button>
          <button
            onClick={handleCopyHTML}
            disabled={!html}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            title="Copy HTML to clipboard (Ctrl+Shift+C)"
            aria-label="Copy HTML to clipboard"
          >
            📋 Copy HTML
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Keyboard Shortcuts */}
          <div className="text-xs text-gray-600 hidden md:flex gap-4 border-l border-gray-200 pl-4">
            <span className="flex items-center gap-1">
              <kbd className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">Ctrl+S</kbd>
              <span>Save</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">Ctrl+Shift+C</kbd>
              <span>Copy</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

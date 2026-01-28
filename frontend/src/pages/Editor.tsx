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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

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

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (settingsOpen && !target.closest('.settings-dropdown')) {
        setSettingsOpen(false);
      }
    };

    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [settingsOpen]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (exportOpen && !target.closest('.export-dropdown')) {
        setExportOpen(false);
      }
    };

    if (exportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportOpen]);

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

  const handleExportLatex = () => {
    if (!latex || !title) {
      toastManager.warning('No content to export');
      return;
    }
    try {
      const blob = new Blob([latex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.tex`;
      a.click();
      URL.revokeObjectURL(url);
      toastManager.success('LaTeX exported!');
      setExportOpen(false);
    } catch (err) {
      toastManager.error('Failed to export LaTeX');
    }
  };

  const handleExportHTML = () => {
    if (!html || !title) {
      toastManager.warning('No content to export');
      return;
    }
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toastManager.success('HTML exported!');
      setExportOpen(false);
    } catch (err) {
      toastManager.error('Failed to export HTML');
    }
  };

  const handleExportMarkdown = async () => {
    if (!html || !title) {
      toastManager.warning('No content to export');
      return;
    }
    try {
      // Simple HTML to Markdown conversion (basic implementation)
      let markdown = html
        .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
        .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
        .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toastManager.success('Markdown exported!');
      setExportOpen(false);
    } catch (err) {
      toastManager.error('Failed to export Markdown');
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
        className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col overflow-hidden ${sidebarOpen ? 'w-56' : 'w-0'
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
                  className={`p-2.5 cursor-pointer hover:bg-gray-50 transition border-l-4 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${id == n.id
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

        {/* Settings Menu at Bottom */}
        <div className="border-t border-gray-200 p-2 relative settings-dropdown">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-full p-2 hover:bg-gray-100 rounded transition flex items-center justify-center text-gray-700"
            aria-label="Settings menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Settings Dropdown */}
          {settingsOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => {
                  navigate('/profile');
                  setSettingsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
              <button
                onClick={() => {
                  // Add logout logic here
                  localStorage.removeItem('token');
                  navigate('/login');
                  setSettingsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-red-50 transition flex items-center gap-2 text-sm font-medium text-red-600 border-t border-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded transition text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>

            {/* Note Title Input in Header */}
            <input
              id="note-title-header"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasChanges(true);
                setAutoSaveStatus('unsaved');
              }}
              placeholder="Enter note title..."
              className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition text-base font-semibold"
              aria-label="Note title"
            />
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

            {/* Copy HTML Button */}
            <button
              onClick={handleCopyHTML}
              disabled={!html}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy HTML to clipboard (Ctrl+Shift+C)"
              aria-label="Copy HTML to clipboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Export Dropdown */}
            <div className="relative export-dropdown">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition"
                title="Export options"
                aria-label="Export menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>

              {/* Export Dropdown Menu */}
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 min-w-[180px]">
                  <button
                    onClick={handleExportLatex}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as LaTeX
                  </button>
                  <button
                    onClick={handleExportHTML}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium text-gray-700 border-t border-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Export as HTML
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium text-gray-700 border-t border-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Export as Markdown
                  </button>
                </div>
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

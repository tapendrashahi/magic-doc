import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LaTeXInput } from '../components/LaTeXInput';
import { HTMLPreview } from '../components/HTMLPreview';
import { useNoteStore } from '../store/noteStore';
import { keyboardManager } from '../services/keyboard';
import { toastManager } from '../services/toast';
import { ExportService } from '../services/export';
import apiClient from '../api/client';

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

  useEffect(() => {
    if (id) {
      loadNote();
    }
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

  if (isLoading) {
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
    <div className="space-y-4 animate-slideUp">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {id ? 'Edit Note' : 'New Note'}
        </h2>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-green-600 font-semibold">
              ✓ Saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold transition"
          >
            ← Back
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded animate-slideUp">
          {error}
        </div>
      )}

      {storeError && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded animate-slideUp">
          {storeError}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Note Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter note title..."
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 h-96">
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

      <div className="flex gap-4 mt-4">
        <button
          onClick={handleSaveNote}
          disabled={isSaving}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition font-semibold flex items-center justify-center gap-2"
          title="Ctrl+S"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>💾 Save Note</>
          )}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition font-semibold"
        >
          Cancel
        </button>
      </div>

      <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded">
        <p className="font-semibold mb-2">⌨️ Keyboard Shortcuts:</p>
        <ul className="space-y-1">
          <li>
            <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+S</kbd> -
            Save note
          </li>
          <li>
            <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">
              Ctrl+Shift+C
            </kbd>{' '}
            - Copy HTML
          </li>
        </ul>
      </div>
    </div>
  );
};

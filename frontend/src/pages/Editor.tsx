import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LaTeXInput } from '../components/LaTeXInput';
import { HTMLPreview } from '../components/HTMLPreview';
import { MathpixInput } from '../components/MathpixInput';
import type { MathpixInputRef } from '../components/MathpixInput';
import { MathpixPreview } from '../components/MathpixPreview';
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

  // Editor tabs state
  const [activeTab, setActiveTab] = useState<'latex' | 'mathpix'>('mathpix');

  // LaTeX editor state
  const [title, setTitle] = useState('');
  const [latex, setLatex] = useState('');
  const [html, setHtml] = useState('');

  // Mathpix converter state
  const [mathpixText, setMathpixText] = useState('');
  const [mathpixResult, setMathpixResult] = useState<any>(null);
  const [isMathpixConverting, setIsMathpixConverting] = useState(false);

  // Common state
  const [isLoading, setIsLoading] = useState(!!id);
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
  const [copied, setCopied] = useState(false);
  const [noteMenuOpen, setNoteMenuOpen] = useState<number | null>(null);
  const [renamingNoteId, setRenamingNoteId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [conversionFormat, setConversionFormat] = useState<'katex' | 'plain_html'>('katex');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Ref for MathpixInput to trigger file upload
  const mathpixInputRef = useRef<MathpixInputRef>(null);

  useEffect(() => {
    if (id) {
      loadNote();
    } else {
      // Clear form for new note with default title
      const now = new Date();
      const dateTimeString = now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).replace(/,/g, '');
      const defaultTitle = `Untitled Note_${dateTimeString}`;

      setTitle(defaultTitle);
      setLatex('');
      setHtml('');
      setMathpixText('');
      setMathpixResult(null);
      setNote(null);
      setError('');
      setHasChanges(false);
      setAutoSaveStatus('saved');
    }
    fetchAllNotes();
  }, [id]);

  // Auto-convert LaTeX if HTML is empty after loading
  useEffect(() => {
    if (latex && !html && !isLoading) {
      console.log('[Editor] Auto-converting loaded LaTeX (HTML is empty)');
      // Auto-convert with current format
      const performConvert = async () => {
        try {
          const response = await apiClient.convertLatex(latex, conversionFormat);
          const newHtml = response.data.html_content;
          setHtml(newHtml);
        } catch (err) {
          console.error('[Editor] Auto-conversion failed:', err);
        }
      };
      performConvert();
    }
  }, [latex, isLoading, conversionFormat]);

  // Re-convert when format changes (without changing LaTeX content)
  useEffect(() => {
    console.log('[Editor] Effect triggered:', { conversionFormat, hasLatex: !!latex, hasHtml: !!html, isLoading });
    if (latex && html && !isLoading) {
      console.log('[Editor] Format changed to:', conversionFormat, 'Re-converting existing content...');
      // Convert with the new format
      const performConvert = async () => {
        try {
          console.log('[Editor] Re-converting with format:', conversionFormat);
          const response = await apiClient.convertLatex(latex, conversionFormat);
          const newHtml = response.data.html_content;
          console.log('[Editor] ✓ Re-conversion complete, HTML length:', newHtml.length);
          setHtml(newHtml);
        } catch (err) {
          console.error('[Editor] Re-conversion failed:', err);
        }
      };
      performConvert();
    }
  }, [conversionFormat]);

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
            mathpix_content: mathpixText,
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
  }, [hasChanges, title, latex, mathpixText, id]);

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

  // Close note menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (noteMenuOpen !== null && !target.closest('.note-menu-container')) {
        setNoteMenuOpen(null);
      }
    };

    if (noteMenuOpen !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [noteMenuOpen]);

  const loadNote = async () => {
    try {
      console.log('[Editor] Loading note with id:', id);
      const response = await apiClient.getNote(parseInt(id!));
      console.log('[Editor] ✓ Note loaded:', {
        title: response.data.title,
        latexLength: response.data.latex_content?.length,
        htmlLength: response.data.html_content?.length,
        mathpixLength: response.data.mathpix_content?.length
      });

      setTitle(response.data.title);
      setLatex(response.data.latex_content);
      setMathpixText(response.data.mathpix_content || '');
      setNote(response.data);
      setError('');

      // Switch to Mathpix tab if note has Mathpix content, otherwise keep default (mathpix)
      if (response.data.mathpix_content) {
        setActiveTab('mathpix');
      }
      // If note only has LaTeX content (no mathpix), stay on default mathpix tab
      // This makes new notes open in mathpix converter

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

  const handleSaveNote = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      toastManager.warning('Please enter a note title');
      return;
    }

    try {
      setAutoSaveStatus('saving');
      setError('');

      if (id) {
        const response = await apiClient.updateNote(parseInt(id), {
          title,
          latex_content: latex,
          html_content: html,
          mathpix_content: mathpixText,
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
          mathpix_content: mathpixText,
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
    }
  };

  const handleCopyHTML = async () => {
    try {
      // Determine which HTML to copy based on active tab
      const htmlToCopy = activeTab === 'mathpix'
        ? (mathpixResult?.html || '')
        : html;

      if (!htmlToCopy) {
        toastManager.warning('No content to copy');
        return;
      }

      await ExportService.copyToClipboard(htmlToCopy);
      setCopied(true);
      const formatLabel = conversionFormat === 'katex' ? 'KaTeX HTML' : 'Plain HTML';
      toastManager.success(`${formatLabel} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
      toastManager.error('Failed to copy to clipboard');
    }
  };

  const handleExportLatex = () => {
    let contentToExport = '';
    
    if (activeTab === 'mathpix') {
      // For Mathpix tab, export the Mathpix text
      contentToExport = mathpixText;
    } else {
      // For LaTeX tab, export the LaTeX content
      contentToExport = latex;
    }

    if (!contentToExport || !title) {
      toastManager.warning('No content to export');
      return;
    }
    try {
      const blob = new Blob([contentToExport], { type: 'text/plain' });
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
    let htmlToExport = '';
    
    if (activeTab === 'mathpix') {
      // For Mathpix tab, export the converted HTML
      htmlToExport = mathpixResult?.html || '';
    } else {
      // For LaTeX tab, export the LaTeX HTML
      htmlToExport = html;
    }

    if (!htmlToExport || !title) {
      toastManager.warning('No content to export');
      return;
    }
    try {
      const blob = new Blob([htmlToExport], { type: 'text/html' });
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
    let htmlToConvert = '';
    
    if (activeTab === 'mathpix') {
      // For Mathpix tab, use the converted HTML
      htmlToConvert = mathpixResult?.html || '';
    } else {
      // For LaTeX tab, use the LaTeX HTML
      htmlToConvert = html;
    }

    if (!htmlToConvert || !title) {
      toastManager.warning('No content to export');
      return;
    }
    try {
      // Simple HTML to Markdown conversion (basic implementation)
      let markdown = htmlToConvert
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

  const handleExportPDF = async () => {
    let htmlToExport = '';
    
    if (activeTab === 'mathpix') {
      htmlToExport = mathpixResult?.html || '';
    } else {
      htmlToExport = html;
    }

    if (!htmlToExport || !title) {
      toastManager.warning('No content to export');
      return;
    }

    try {
      console.log('[PDF Export] Starting hybrid PDF export...');
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Create wrapper element with proper dimensions
      const wrapper = document.createElement('div');
      wrapper.id = 'pdf-export-wrapper';
      wrapper.innerHTML = htmlToExport;
      wrapper.style.padding = '0px';
      wrapper.style.margin = '0px';
      wrapper.style.fontFamily = 'Arial, sans-serif';
      wrapper.style.fontSize = '12px';
      wrapper.style.lineHeight = '1.6';
      wrapper.style.color = '#000000';
      wrapper.style.backgroundColor = '#ffffff';
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.width = '210mm'; // Full A4 width
      wrapper.style.zIndex = '-1';
      wrapper.style.boxSizing = 'border-box';
      
      document.body.appendChild(wrapper);
      console.log('[PDF Export] Wrapper element created');

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 300));

      // Render wrapper to canvas
      console.log('[PDF Export] Rendering HTML to canvas...');
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        useCORS: true,
        windowHeight: wrapper.scrollHeight,
        windowWidth: 1600, // 210mm at scale 2
        removeContainer: false
      });

      console.log('[PDF Export] Canvas created - Size:', canvas.width, 'x', canvas.height);

      // Clean up wrapper
      document.body.removeChild(wrapper);

      // A4 dimensions at scale 2: 1600px width, ~2263px height per page
      const CANVAS_PAGE_HEIGHT = 2263; // A4 height (297mm) at 96dpi scale 2
      const totalPages = Math.ceil(canvas.height / CANVAS_PAGE_HEIGHT);
      
      console.log('[PDF Export] Total pages needed:', totalPages);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const PDF_PAGE_WIDTH = 210; // A4 width in mm
      const PDF_PAGE_HEIGHT = 297; // A4 height in mm
      const MARGIN_TOP = 10; // 10mm top margin
      const MARGIN_LEFT = 10; // 10mm left margin
      const CONTENT_WIDTH = PDF_PAGE_WIDTH - 20; // 10mm margins on each side
      const CONTENT_HEIGHT = PDF_PAGE_HEIGHT - 20; // 10mm margins top and bottom

      console.log('[PDF Export] PDF Page dimensions - Width:', CONTENT_WIDTH, 'mm, Height:', CONTENT_HEIGHT, 'mm');

      // Add pages with proper content distribution
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const sourceY = i * CANVAS_PAGE_HEIGHT;
        const sourceHeight = Math.min(CANVAS_PAGE_HEIGHT, canvas.height - sourceY);
        
        // Scale canvas content to PDF page while maintaining aspect ratio
        // Canvas width is 1600px = 210mm at scale 2
        // So 1px at scale 2 = 0.13125mm (210/1600)
        const pixelToMM = PDF_PAGE_WIDTH / (1600 * 0.5); // Account for scale
        const destHeight = (sourceHeight * pixelToMM) / 2; // Adjust for scale

        // Create temp canvas for this page's content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY,
            canvas.width, sourceHeight,
            0, 0,
            canvas.width, sourceHeight
          );
        }

        const croppedImgData = tempCanvas.toDataURL('image/png');
        
        // Add image centered and aligned properly
        pdf.addImage(
          croppedImgData,
          'PNG',
          MARGIN_LEFT,
          MARGIN_TOP,
          CONTENT_WIDTH,
          destHeight
        );

        console.log(`[PDF Export] Added page ${i + 1}/${totalPages} - Content height: ${destHeight.toFixed(2)}mm`);
      }

      pdf.save(`${title}.pdf`);
      console.log('[PDF Export] PDF saved successfully');
      toastManager.success(`PDF exported successfully! (${totalPages} pages)`);
      setExportOpen(false);
    } catch (err) {
      console.error('[PDF Export] Error:', err);
      // Fallback cleanup
      const wrapper = document.getElementById('pdf-export-wrapper');
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
      toastManager.error('Failed to export PDF: ' + (err.message || 'Unknown error'));
    }
  };

  const handleExportDocx = () => {
    let htmlToExport = '';
    
    if (activeTab === 'mathpix') {
      htmlToExport = mathpixResult?.html || '';
    } else {
      htmlToExport = html;
    }

    if (!htmlToExport || !title) {
      toastManager.warning('No content to export');
      return;
    }

    try {
      // Convert HTML to plain text for DOCX
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlToExport, 'text/html');
      const plainText = doc.body.textContent || '';

      // Create a simple DOCX-like XML structure (Word 2007 format is actually ZIP with XML)
      // For simplicity, we'll export as RTF or plain text in a way that Word can read
      
      // Simple approach: Create HTML file that Word can open
      const wordHTML = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2, h3 { color: #333; }
            p { line-height: 1.6; }
          </style>
        </head>
        <body>
          ${htmlToExport}
        </body>
        </html>
      `;

      const blob = new Blob([wordHTML], { type: 'application/vnd.ms-word' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.docx`;
      a.click();
      URL.revokeObjectURL(url);

      toastManager.success('DOCX exported!');
      setExportOpen(false);
    } catch (err) {
      console.error('DOCX export error:', err);
      toastManager.error('Failed to export DOCX');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }
    try {
      await apiClient.deleteNote(noteId);
      toastManager.success('Note deleted!');
      // Refresh the notes list
      fetchAllNotes();
      // If we're viewing the deleted note, navigate to notes list
      if (id && parseInt(id) === noteId) {
        navigate('/notes');
      }
      setNoteMenuOpen(null);
    } catch (err) {
      toastManager.error('Failed to delete note');
      console.error(err);
    }
  };

  const handleStartRename = (noteId: number) => {
    const noteToRename = allNotes.find(n => n.id === noteId);
    if (!noteToRename) return;

    setRenamingNoteId(noteId);
    setRenameValue(noteToRename.title);
    setNoteMenuOpen(null);
  };

  const handleCancelRename = () => {
    setRenamingNoteId(null);
    setRenameValue('');
  };

  const handleSaveRename = async (noteId: number) => {
    if (!renameValue.trim()) {
      toastManager.warning('Title cannot be empty');
      return;
    }

    const noteToRename = allNotes.find(n => n.id === noteId);
    if (!noteToRename) return;

    try {
      await apiClient.updateNote(noteId, {
        title: renameValue.trim(),
        latex_content: noteToRename.latex_content,
      });
      toastManager.success('Note renamed!');
      // Refresh the notes list
      fetchAllNotes();
      // If we're viewing the renamed note, update the title
      if (id && parseInt(id) === noteId) {
        setTitle(renameValue.trim());
      }
      setRenamingNoteId(null);
      setRenameValue('');
    } catch (err) {
      toastManager.error('Failed to rename note');
      console.error(err);
    }
  };

  // Mathpix handlers
  const handleMathpixFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      setMathpixText(text);
      await handleConvertMathpix(text);
    } catch (err) {
      toastManager.error('Failed to read file');
      console.error(err);
    }
  };

  const handleConvertMathpix = async (text: string) => {
    if (!text.trim()) {
      toastManager.warning('Please enter or upload Mathpix text');
      return;
    }

    try {
      setIsMathpixConverting(true);
      console.log('[Editor] Converting Mathpix text, length:', text.length);

      const response = await apiClient.convertMathpixToLMS(text, true);
      console.log('[Editor] ✓ Mathpix conversion complete');

      setMathpixResult({
        html: response.data.html_fragment || response.data.html_content,
        format: conversionFormat,
        stats: response.data.statistics || {}
      });
      
      // Mark changes to trigger auto-save
      setHasChanges(true);
      setAutoSaveStatus('unsaved');
      
      toastManager.success('Conversion complete!');
    } catch (err) {
      toastManager.error('Failed to convert Mathpix');
      console.error(err);
    } finally {
      setIsMathpixConverting(false);
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
                  className={`group relative p-2.5 cursor-pointer hover:bg-gray-50 transition border-l-4 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${id && parseInt(id) === n.id
                    ? 'bg-blue-50 border-blue-500'
                    : 'border-transparent hover:border-gray-300'
                    }`}
                  aria-selected={!!(id && parseInt(id) === n.id)}
                >
                  {renamingNoteId === n.id ? (
                    // Inline rename mode
                    <div className="flex flex-col gap-2 p-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveRename(n.id);
                          } else if (e.key === 'Escape') {
                            handleCancelRename();
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveRename(n.id)}
                          className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition"
                        >
                          ✗ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        onClick={() => navigate(`/editor/${n.id}`)}
                        role="option"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            navigate(`/editor/${n.id}`);
                          }
                        }}
                        aria-label={`Open note: ${n.title}`}
                        className="flex-1"
                      >
                        <h3 className="font-semibold text-gray-800 truncate text-sm pr-8">
                          {n.title}
                        </h3>
                      </div>

                      {/* Three-dot menu button - shows on hover */}
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity note-menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteMenuOpen(noteMenuOpen === n.id ? null : n.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition"
                          aria-label="Note options"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>

                        {/* Dropdown menu */}
                        {noteMenuOpen === n.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 min-w-[140px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(n.id);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-2 text-sm text-gray-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Rename
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(n.id);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-red-50 transition flex items-center gap-2 text-sm text-red-600 border-t border-gray-100"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
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

            {/* Format Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setConversionFormat('katex');
                }}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${conversionFormat === 'katex'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="KaTeX format for web rendering"
              >
                KaTeX
              </button>
              <button
                onClick={() => {
                  setConversionFormat('plain_html');
                }}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${conversionFormat === 'plain_html'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Plain HTML for LMS (Moodle, Google Sites)"
              >
                LMS
              </button>
            </div>

            {/* Copy HTML Button */}
            <button
              onClick={handleCopyHTML}
              disabled={activeTab === 'mathpix' ? !mathpixResult?.html : !html}
              className={`p-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed ${copied
                ? 'text-green-600 bg-green-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              title={copied ? 'Copied!' : `Copy ${conversionFormat === 'katex' ? 'KaTeX HTML' : 'Plain HTML'} to clipboard (Ctrl+Shift+C)`}
              aria-label={copied ? 'HTML copied to clipboard' : `Copy ${conversionFormat === 'katex' ? 'KaTeX HTML' : 'Plain HTML'} to clipboard`}
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            {/* Preview Button - Eye Icon */}
            <button
              onClick={() => setPreviewOpen(true)}
              disabled={activeTab === 'mathpix' ? !mathpixResult?.html : !html}
              className={`p-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed ${
                'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
              title="Open fullscreen preview"
              aria-label="Open fullscreen preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium text-gray-700 border-t border-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Export as PDF
                  </button>
                  <button
                    onClick={handleExportDocx}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium text-gray-700 border-t border-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as DOCX
                  </button>
                </div>
              )}
            </div>


            {/* Compile Button - Only visible on Mathpix tab */}
            {activeTab === 'mathpix' && (
              <button
                onClick={() => handleConvertMathpix(mathpixText)}
                disabled={!mathpixText.trim() || isMathpixConverting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded transition text-sm flex items-center gap-2 disabled:cursor-not-allowed"
                aria-label="Compile Mathpix LaTeX"
              >
                {isMathpixConverting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Compiling...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Compile
                  </>
                )}
              </button>
            )}

            {/* Upload File Button - Only visible on Mathpix tab */}
            {activeTab === 'mathpix' && (
              <button
                onClick={() => mathpixInputRef.current?.triggerFileUpload()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 flex items-center gap-2"
                aria-label="Upload Mathpix file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload File
              </button>
            )}

            <button
              onClick={() => navigate('/notes')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded font-semibold transition text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              aria-label="Go back to all notes"
            >
              All Notes
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white px-6 flex gap-0">
          <button
            onClick={() => setActiveTab('mathpix')}
            className={`px-4 py-3 text-sm font-semibold transition border-b-2 ${activeTab === 'mathpix'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
          >
            📊 Mathpix Converter
          </button>
          <button
            onClick={() => setActiveTab('latex')}
            className={`px-4 py-3 text-sm font-semibold transition border-b-2 ${activeTab === 'latex'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
          >
            📝 LaTeX Editor
          </button>
        </div>

        <div className="flex-1 overflow-hidden px-6 pt-4 flex flex-col">
          <div className="flex-1 flex flex-col min-h-0">
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

            {activeTab === 'mathpix' && (
              <div className="grid grid-cols-[60%_40%] gap-4 h-full overflow-hidden">
                <MathpixInput
                  ref={mathpixInputRef}
                  value={mathpixText}
                  onChange={setMathpixText}
                  onFileUpload={handleMathpixFileUpload}
                  isConverting={isMathpixConverting}
                />
                <div className="flex flex-col min-h-0 overflow-hidden">
                  <MathpixPreview
                    html={mathpixResult?.html || ''}
                    loading={isMathpixConverting}
                    error={error}
                    format={mathpixResult?.format || conversionFormat}
                  />
                </div>
              </div>
            )}

            {activeTab === 'latex' && (
              <div className="grid grid-cols-[60%_40%] gap-4 h-full">
                <LaTeXInput
                  value={latex}
                  onChange={handleLatexChange}
                  onConvert={handleConvert}
                  conversionFormat={conversionFormat}
                />
                <HTMLPreview
                  html={html}
                  loading={storeLoading}
                  error={storeError}
                  format={conversionFormat}
                  note={note}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Bar - Auto-save enabled */}
        <footer className="border-t border-gray-200 bg-white p-4 flex gap-3 items-center shadow-md">
          <div className="text-xs text-gray-500 italic">
            Auto-save enabled
          </div>
        </footer>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full h-5/6 max-w-6xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                Preview
              </h2>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-2 hover:bg-gray-100 rounded transition text-gray-600"
                aria-label="Close preview"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="prose prose-sm max-w-none leading-relaxed text-gray-900 bg-white rounded-lg"
                style={{ 
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: activeTab === 'mathpix' 
                    ? (mathpixResult?.html || '')
                    : html
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default Editor;

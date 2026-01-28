/**
 * MathpixConverter component - PHASE 7 Frontend Integration
 * 
 * This component handles:
 * 1. File upload for Mathpix LaTeX
 * 2. Conversion to LMS HTML via /api/convert/ endpoint
 * 3. Display of HTML output and statistics
 * 4. Copy-to-clipboard functionality
 * 5. Preview rendering with KaTeX
 */

import React, { useRef, useState, useCallback } from 'react';
import mathpixConverterService, {
  type MathpixConversionResult,
  type ConversionStats,
} from '../services/mathpixConverter';
import clipboardService from '../services/clipboard';
import katexService from '../services/katex';
import { useNoteStore } from '../store/noteStore';

interface MathpixConverterProps {
  onConversionComplete?: (result: MathpixConversionResult) => void;
}

export const MathpixConverter: React.FC<MathpixConverterProps> = ({ onConversionComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mathpixText, setMathpixText] = useState<string>('');
  const [result, setResult] = useState<MathpixConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'katex'>('preview');
  const previewRef = useRef<HTMLDivElement>(null);
  const katexRef = useRef<HTMLDivElement>(null);

  const { createNote } = useNoteStore();

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      console.log('[MathpixConverter] Reading file:', file.name, `(${file.size} bytes)`);

      const text = await file.text();
      setMathpixText(text);
      console.log('[MathpixConverter] File loaded successfully:', text.length, 'chars');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[MathpixConverter] File read error:', err);
      setError(`Failed to read file: ${errorMsg}`);
    }
  }, []);

  /**
   * Handle conversion
   */
  const handleConvert = useCallback(async () => {
    if (!mathpixText.trim()) {
      setError('Please upload a Mathpix file or paste content');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      console.log('[MathpixConverter] Starting conversion...');
      const conversionResult = await mathpixConverterService.convertMathpix(
        mathpixText,
        showStats
      );

      if (conversionResult.success) {
        setResult(conversionResult);
        console.log('[MathpixConverter] ✓ Conversion successful');

        // Render preview
        if (previewRef.current) {
          previewRef.current.innerHTML = conversionResult.html_fragment;
          // Load KaTeX styles if needed
          setTimeout(async () => {
            try {
              await katexService.init();
              await katexService.render(previewRef.current!);
            } catch (err) {
              console.warn('[MathpixConverter] KaTeX rendering warning:', err);
            }
          }, 100);
        }

        // Callback
        if (onConversionComplete) {
          onConversionComplete(conversionResult);
        }
      } else {
        setError(conversionResult.error || 'Conversion failed');
        console.error('[MathpixConverter] Conversion failed:', conversionResult.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[MathpixConverter] Conversion error:', err);
      setError(`Conversion error: ${errorMsg}`);
    } finally {
      setIsConverting(false);
    }
  }, [mathpixText, showStats, onConversionComplete]);

  /**
   * Handle copy to clipboard
   */
  const handleCopyHTML = useCallback(async () => {
    if (!result?.html_fragment) {
      setError('No HTML to copy');
      return;
    }

    try {
      const copyResult = await mathpixConverterService.copyHTMLFragment();
      setCopySuccess(copyResult.message);
      setTimeout(() => setCopySuccess(null), 3000);
    } catch (err) {
      console.error('[MathpixConverter] Copy error:', err);
      setError('Failed to copy to clipboard');
    }
  }, [result?.html_fragment]);

  /**
   * Handle copy KaTeX HTML to clipboard
   */
  const handleCopyKaTeXHTML = useCallback(async () => {
    if (!katexRef.current?.innerHTML) {
      setError('No KaTeX HTML to copy');
      return;
    }

    try {
      await clipboardService.copyHTML(
        katexRef.current.innerHTML,
        'KaTeX HTML copied to clipboard!'
      );
      setCopySuccess('KaTeX HTML copied to clipboard!');
      setTimeout(() => setCopySuccess(null), 3000);
    } catch (err) {
      console.error('[MathpixConverter] KaTeX copy error:', err);
      setError('Failed to copy KaTeX HTML to clipboard');
    }
  }, []);

  /**
   * Handle paste from clipboard
   */
  const handlePaste = useCallback(async () => {
    try {
      const content = await clipboardService.getClipboardContent();
      if (content) {
        setMathpixText(content);
        console.log('[MathpixConverter] Pasted from clipboard:', content.length, 'chars');
      }
    } catch (err) {
      console.error('[MathpixConverter] Paste error:', err);
      setError('Failed to read clipboard');
    }
  }, []);

  /**
   * Handle save as note
   */
  const handleSaveAsNote = useCallback(async () => {
    if (!result?.html_fragment) {
      setError('No content to save');
      return;
    }

    try {
      const title = `Mathpix Conversion - ${new Date().toLocaleString()}`;
      await createNote(
        title,
        mathpixText.substring(0, 200) + (mathpixText.length > 200 ? '...' : '')
      );
      console.log('[MathpixConverter] ✓ Saved as note');
      alert('Conversion saved as a note!');
    } catch (err) {
      console.error('[MathpixConverter] Save error:', err);
      setError('Failed to save note');
    }
  }, [result?.html_fragment, mathpixText, createNote]);

  /**
   * Render statistics
   */
  const renderStats = (stats: ConversionStats) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="font-bold text-blue-900 mb-2">📊 Conversion Statistics</h4>
      <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
        <div>
          <span className="font-semibold">Total Equations:</span> {stats.total_equations}
        </div>
        <div>
          <span className="font-semibold">Display:</span> {stats.display_equations}
        </div>
        <div>
          <span className="font-semibold">Inline:</span> {stats.inline_equations}
        </div>
        <div>
          <span className="font-semibold">Sections:</span> {stats.sections}
        </div>
        <div>
          <span className="font-semibold">Words:</span> {stats.words}
        </div>
        <div>
          <span className="font-semibold">Characters:</span> {stats.characters}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
        <h2 className="text-2xl font-bold">Mathpix to LMS Converter</h2>
        <p className="text-indigo-100 text-sm mt-1">
          Convert Mathpix LaTeX output to LMS-compatible HTML fragments
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 1: Input Mathpix LaTeX</h3>

            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📁 Upload File
              </label>
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
                >
                  Choose File
                </button>
                <button
                  onClick={handlePaste}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Paste from Clipboard
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mathpix LaTeX Content
              </label>
              <textarea
                value={mathpixText}
                onChange={(e) => setMathpixText(e.target.value)}
                placeholder="Paste Mathpix LaTeX output here or upload a file..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {mathpixText && (
                <div className="text-xs text-gray-500 mt-2">
                  {mathpixText.length} characters
                </div>
              )}
            </div>

            {/* Options */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={showStats}
                  onChange={(e) => setShowStats(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span>Show conversion statistics</span>
              </label>
            </div>
          </div>

          {/* Convert Button */}
          <div className="flex justify-center">
            <button
              onClick={handleConvert}
              disabled={!mathpixText.trim() || isConverting}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isConverting ? (
                <>
                  <span className="inline-block mr-2 animate-spin">⚙️</span>
                  Converting...
                </>
              ) : (
                '🚀 Convert to LMS HTML'
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">❌ Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {copySuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ {copySuccess}</p>
            </div>
          )}

          {/* Results Section */}
          {result && result.success && (
            <div className="space-y-6">
              {/* Conversion Info */}
              <div className="bg-white rounded-lg border-2 border-green-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-green-800 mb-2">✓ Conversion Successful</h3>
                <p className="text-sm text-gray-600">
                  ⏱️ Conversion time: <span className="font-mono font-bold">{result.conversion_time_ms}ms</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  📦 HTML output: <span className="font-mono font-bold">{result.html_fragment.length}</span> characters
                </p>
              </div>

              {/* Statistics */}
              {result.stats && renderStats(result.stats)}

              {/* Preview and HTML Output with Tabs */}
              <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 px-4 py-3 text-center font-semibold text-sm transition-colors ${
                      activeTab === 'preview'
                        ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    👁️ Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('html')}
                    className={`flex-1 px-4 py-3 text-center font-semibold text-sm transition-colors ${
                      activeTab === 'html'
                        ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    📄 HTML Output
                  </button>
                  <button
                    onClick={() => setActiveTab('katex')}
                    className={`flex-1 px-4 py-3 text-center font-semibold text-sm transition-colors ${
                      activeTab === 'katex'
                        ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    ⚡ KaTeX HTML
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Preview Tab */}
                  {activeTab === 'preview' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Rendered Preview</h3>
                      <div
                        ref={previewRef}
                        className="border border-gray-300 rounded-lg p-4 bg-white min-h-[300px] overflow-auto text-sm shadow-sm"
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  )}

                  {/* HTML Output Tab */}
                  {activeTab === 'html' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">LMS HTML Fragment</h3>
                        <button
                          onClick={handleCopyHTML}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                          📋 Copy HTML
                        </button>
                      </div>
                      <textarea
                        value={result.html_fragment}
                        readOnly
                        className="w-full h-96 p-3 border border-gray-300 rounded-lg font-mono text-xs bg-gray-50 focus:outline-none overflow-auto"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Tip: This HTML is ready to paste directly into your LMS content editor.
                      </p>
                    </div>
                  )}

                  {/* KaTeX HTML Tab */}
                  {activeTab === 'katex' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">KaTeX HTML Markup</h3>
                        <button
                          onClick={handleCopyKaTeXHTML}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                          📋 Copy KaTeX HTML
                        </button>
                      </div>
                      
                      {/* KaTeX HTML Source Display */}
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700 mb-2">
                          <strong>ℹ️ Raw KaTeX HTML Markup:</strong>
                        </p>
                        <pre
                          className="text-xs bg-white border border-blue-300 rounded p-3 overflow-auto max-h-96 text-gray-700"
                          style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                        >
                          {katexRef.current?.innerHTML || 'Converting...'}
                        </pre>
                      </div>

                      {/* KaTeX HTML Rendered Display */}
                      <div className="p-4 border border-gray-300 rounded-lg bg-white min-h-[200px]">
                        <p className="text-xs text-gray-600 mb-3 font-semibold">Rendered Output:</p>
                        <div
                          ref={katexRef}
                          className="text-sm"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Tip: This shows the actual KaTeX HTML that renders the equations. Copy and embed in your LMS.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleSaveAsNote}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  💾 Save as Note
                </button>
                <button
                  onClick={() => {
                    setMathpixText('');
                    setResult(null);
                    setError(null);
                    mathpixConverterService.clearCache();
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  🔄 New Conversion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathpixConverter;

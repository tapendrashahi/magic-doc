/**
 * MathpixConverter component - PHASE 8 Editor Integration
 * 
 * This component handles:
 * 1. Beautiful code editor with syntax highlighting (LaTeXInput)
 * 2. File upload for Mathpix LaTeX
 * 3. Conversion to LMS HTML via /api/convert/ endpoint
 * 4. Dual-tab interface: Code View | Preview
 * 5. Copy-to-clipboard functionality
 * 6. Preview rendering with KaTeX and HTML output
 */

import React, { useRef, useState, useCallback } from 'react';
import mathpixConverterService, {
  type MathpixConversionResult,
  type ConversionStats,
} from '../services/mathpixConverter';
import clipboardService from '../services/clipboard';
import katexService from '../services/katex';
import { useNoteStore } from '../store/noteStore';
import { LaTeXInput } from './LaTeXInput';

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
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [outputTab, setOutputTab] = useState<'html' | 'katex'>('html');
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
          Beautiful editor for converting Mathpix LaTeX to LMS-compatible HTML
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Code View | Preview Tabs */}
          <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 px-4 py-3 text-center font-semibold text-sm transition-colors ${
                  activeTab === 'code'
                    ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📝 Code View
              </button>
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
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Code View Tab */}
              {activeTab === 'code' && (
                <div className="space-y-6">
                  {/* Beautiful LaTeX Editor */}
                  <div className="h-64 flex flex-col">
                    <LaTeXInput
                      value={mathpixText}
                      onChange={setMathpixText}
                      onConvert={() => {}} // Handled separately
                      conversionFormat="katex"
                    />
                  </div>

                  {/* Upload/Paste Controls */}
                  <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium text-sm flex items-center gap-2"
                    >
                      📁 Upload File
                    </button>
                    <button
                      onClick={handlePaste}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm flex items-center gap-2"
                    >
                      📋 Paste from Clipboard
                    </button>
                    <label className="flex items-center gap-2 text-sm text-gray-700 ml-auto">
                      <input
                        type="checkbox"
                        checked={showStats}
                        onChange={(e) => setShowStats(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span>Show Statistics</span>
                    </label>
                  </div>

                  {/* Convert Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleConvert}
                      disabled={isConverting || !mathpixText.trim()}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition-all font-semibold text-lg shadow-lg hover:shadow-xl disabled:shadow-none"
                    >
                      {isConverting ? '⏳ Converting...' : '✨ Convert to LMS HTML'}
                    </button>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                      ❌ {error}
                    </div>
                  )}

                  {/* Copy Success Message */}
                  {copySuccess && (
                    <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 text-sm">
                      ✅ {copySuccess}
                    </div>
                  )}

                  {/* Statistics */}
                  {showStats && result?.stats && renderStats(result.stats)}
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === 'preview' && result && (
                <div className="space-y-6">
                  {/* Output Format Selector */}
                  <div className="flex gap-3 border-b border-gray-200 pb-4">
                    <button
                      onClick={() => setOutputTab('html')}
                      className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors ${
                        outputTab === 'html'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📄 HTML Output
                    </button>
                    <button
                      onClick={() => setOutputTab('katex')}
                      className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors ${
                        outputTab === 'katex'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ⚡ KaTeX Markup
                    </button>
                  </div>

                  {/* HTML Output View */}
                  {outputTab === 'html' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-gray-800">LMS HTML Fragment</h4>
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
                      <p className="text-xs text-gray-500">
                        💡 Tip: This HTML is ready to paste directly into your LMS content editor.
                      </p>
                    </div>
                  )}

                  {/* KaTeX Output View */}
                  {outputTab === 'katex' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-gray-800">KaTeX HTML Markup</h4>
                        <button
                          onClick={handleCopyKaTeXHTML}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                          📋 Copy KaTeX HTML
                        </button>
                      </div>

                      {/* Raw Source */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-2">Raw KaTeX Markup:</p>
                        <pre
                          className="text-xs bg-white border border-gray-300 rounded p-3 overflow-auto max-h-64 text-gray-700"
                          style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                        >
                          {katexRef.current?.innerHTML || 'Converting...'}
                        </pre>
                      </div>

                      {/* Rendered Output */}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-2">Rendered Output:</p>
                        <div
                          ref={katexRef}
                          className="p-4 border border-gray-300 rounded-lg bg-white min-h-[200px] text-sm"
                          style={{ fontSize: '14px' }}
                        />
                      </div>

                      <p className="text-xs text-gray-500">
                        💡 Tip: This shows the actual KaTeX HTML that renders equations. Copy and embed in your LMS.
                      </p>
                    </div>
                  )}

                  {/* Statistics */}
                  {showStats && result?.stats && renderStats(result.stats)}
                </div>
              )}

              {/* No conversion yet */}
              {activeTab === 'preview' && !result && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-lg font-semibold">No conversion yet</p>
                    <p className="text-sm">Switch to Code View and convert your LaTeX</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {result && (
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
                  setActiveTab('code');
                  mathpixConverterService.clearCache();
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                🔄 New Conversion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathpixConverter;

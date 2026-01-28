import React, { useCallback, useRef, useEffect } from 'react';
import converterService from '../services/converter';
import { useNoteStore } from '../store/noteStore';

interface LaTeXInputProps {
  value: string;
  onChange: (value: string) => void;
  onConvert: (html: string) => void;
}

export const LaTeXInput: React.FC<LaTeXInputProps> = ({
  value,
  onChange,
  onConvert,
}) => {
  const { loading, error } = useNoteStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      console.log('[LaTeXInput] Content changed, length:', newValue.length);
      onChange(newValue);

      // Real-time conversion with debounce
      if (newValue.trim()) {
        try {
          console.log('[LaTeXInput] Starting conversion for', newValue.length, 'chars');
          const html = await converterService.convertLatex(newValue);
          console.log('[LaTeXInput] ✓ Conversion successful, HTML length:', html.length);
          onConvert(html);
        } catch (err) {
          console.error('[LaTeXInput] Conversion error:', err);
        }
      } else {
        console.log('[LaTeXInput] Empty LaTeX, clearing preview');
        onConvert('');
      }
    },
    [onChange, onConvert]
  );

  // Sync scroll between textarea and highlight
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
      highlightRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const highlightLatex = (code: string) => {
    let highlighted = code;

    // Highlight commands (e.g., \section, \textbf)
    highlighted = highlighted.replace(
      /(\\[a-zA-Z]+)/g,
      '<span class="text-red-600 font-semibold">$1</span>'
    );

    // Highlight math mode ($ ... $)
    highlighted = highlighted.replace(
      /(\$[^$]*\$)/g,
      '<span class="text-purple-600">$1</span>'
    );

    // Highlight braces and brackets
    highlighted = highlighted.replace(/([{}[\]])/g, '<span class="text-orange-600">$1</span>');

    // Highlight comments
    highlighted = highlighted.replace(
      /(%.*)/g,
      '<span class="text-green-600 italic">$1</span>'
    );

    return highlighted;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-300">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-300">
        <h2 className="text-2xl font-bold text-gray-800">LaTeX Input</h2>
      </div>


      <div className="flex-1 relative overflow-hidden p-4">
        {/* Syntax highlight overlay */}
        <pre
          ref={highlightRef}
          className="absolute inset-0 p-4 font-mono text-sm resize-none overflow-auto pointer-events-none bg-transparent text-transparent whitespace-pre-wrap"
          style={{ wordBreak: 'break-word', lineHeight: '1.5' }}
          dangerouslySetInnerHTML={{ __html: highlightLatex(value) }}
        />

        {/* Textarea on top */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          placeholder="Paste your LaTeX code here... (e.g., $\frac{1}{2}$ or $$\int_0^1 x^2 dx$$)"
          className="absolute inset-0 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white bg-opacity-95 text-gray-900 placeholder-gray-400"
          style={{ lineHeight: '1.5' }}
          spellCheck={false}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-100 border-t border-gray-300 text-red-700 text-sm font-semibold animate-slideUp">
          ❌ {error}
        </div>
      )}

      {loading && (
        <div className="p-4 bg-blue-100 border-t border-gray-300 text-blue-700 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          Converting...
        </div>
      )}

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-300 text-xs text-gray-600">
        <p>💡 Tip: Start typing to see live preview on the right</p>
      </div>
    </div>
  );
};

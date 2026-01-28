import React, { useCallback, useRef } from 'react';

interface MathpixInputProps {
  value: string;
  onChange: (value: string) => void;
  onFileUpload: (file: File) => void;
  onPaste: () => void;
  isConverting?: boolean;
}

export const MathpixInput: React.FC<MathpixInputProps> = ({
  value,
  onChange,
  onFileUpload,
  onPaste,
  isConverting = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Only accept text files
      if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
        alert('Please upload a text file (.txt)');
        return;
      }

      onFileUpload(file);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onFileUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Sync scroll between textarea and highlight
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
      highlightRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-300">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-300">
        <h2 className="text-2xl font-bold text-gray-800">📄 Mathpix LaTeX</h2>
        <p className="text-sm text-gray-600 mt-1">Upload or paste Mathpix output</p>
      </div>

      {/* Upload & Paste Controls */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex gap-3">
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
          onClick={onPaste}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm flex items-center gap-2"
        >
          📋 Paste from Clipboard
        </button>
        {value && (
          <div className="text-xs text-gray-500 ml-auto flex items-center">
            {value.length} characters
          </div>
        )}
      </div>

      {/* Textarea with syntax highlighting */}
      <div className="flex-1 relative overflow-hidden p-4">
        {/* Syntax highlight overlay */}
        <pre
          ref={highlightRef}
          className="absolute inset-0 p-4 font-mono text-sm resize-none overflow-auto pointer-events-none bg-transparent text-transparent whitespace-pre-wrap"
          style={{ wordBreak: 'break-word', lineHeight: '1.5' }}
          dangerouslySetInnerHTML={{
            __html: value
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\$\$([^$]*)\$\$/g, '<span class="text-purple-600">$$$1$$</span>')
              .replace(/\$([^$]*)\$/g, '<span class="text-purple-600">$1</span>')
              .replace(/(\\[a-zA-Z]+)/g, '<span class="text-red-600 font-semibold">$1</span>')
              .replace(/([{}[\]])/g, '<span class="text-orange-600">$1</span>')
              .replace(/(%.*)/g, '<span class="text-green-600 italic">$1</span>'),
          }}
        />

        {/* Textarea on top */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          placeholder="Paste your Mathpix LaTeX output here or upload a file..."
          className="absolute inset-0 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white bg-opacity-95 text-gray-900 placeholder-gray-400"
          style={{ lineHeight: '1.5' }}
          spellCheck={false}
        />
      </div>

      {isConverting && (
        <div className="p-4 bg-blue-100 border-t border-gray-300 text-blue-700 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          Converting Mathpix...
        </div>
      )}
    </div>
  );
};

export default MathpixInput;

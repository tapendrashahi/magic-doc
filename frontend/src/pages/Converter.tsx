/**
 * Converter Page - PHASE 7 Frontend Integration
 * Dedicated page for Mathpix to LMS conversion
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MathpixConverter from '../components/MathpixConverter';
import type { MathpixConversionResult } from '../services/mathpixConverter';

export const Converter: React.FC = () => {
  const navigate = useNavigate();
  const [conversions, setConversions] = useState<MathpixConversionResult[]>([]);

  const handleConversionComplete = (result: MathpixConversionResult) => {
    console.log('[ConverterPage] Conversion completed:', result);
    setConversions((prev) => [result, ...prev].slice(0, 10)); // Keep last 10
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              📐 Mathpix to LMS Converter
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Convert Mathpix LaTeX output to LMS-compatible HTML fragments
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/notes')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              ← Back to Notes
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <MathpixConverter onConversionComplete={handleConversionComplete} />

        {/* Recent Conversions */}
        {conversions.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📜 Recent Conversions</h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {conversions.map((conv, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      {conv.stats && (
                        <span className="text-gray-700">
                          {conv.stats.total_equations} equations, {conv.stats.sections} sections
                        </span>
                      )}
                      {!conv.stats && (
                        <span className="text-gray-700">
                          HTML: {conv.html_fragment.length} chars
                        </span>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs">
                      {conv.conversion_time_ms}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="max-w-7xl mx-auto p-6 mt-8">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">❓ How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>
              <strong>Upload or Paste:</strong> Use the file upload button to select a Mathpix
              output file, or paste content directly from your clipboard.
            </li>
            <li>
              <strong>Configure Options:</strong> Check the "Show statistics" option if you want
              detailed conversion metrics.
            </li>
            <li>
              <strong>Convert:</strong> Click the "Convert to LMS HTML" button to process your
              Mathpix LaTeX.
            </li>
            <li>
              <strong>Preview & Copy:</strong> Review the preview, then copy the HTML fragment
              to your clipboard.
            </li>
            <li>
              <strong>Paste in LMS:</strong> Go to your LMS content editor, switch to code view,
              and paste the HTML fragment. Equations will render with KaTeX!
            </li>
            <li>
              <strong>Save as Note:</strong> Optionally save the conversion as a note for future
              reference.
            </li>
          </ol>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto p-6 mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            <h4 className="text-lg font-bold text-indigo-900 mb-2">🚀 Fast Conversion</h4>
            <p className="text-gray-700 text-sm">
              Converts complex Mathpix LaTeX to LMS HTML in just a few seconds, with real-time
              statistics.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h4 className="text-lg font-bold text-purple-900 mb-2">📊 Detailed Stats</h4>
            <p className="text-gray-700 text-sm">
              Get comprehensive metrics about your conversion: equation counts, sections, word
              count, and more.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h4 className="text-lg font-bold text-green-900 mb-2">✨ LMS Compatible</h4>
            <p className="text-gray-700 text-sm">
              Output is guaranteed LMS-compatible with proper KaTeX styling and attributes for
              seamless integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Converter;

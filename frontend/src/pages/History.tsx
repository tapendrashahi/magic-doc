import { useEffect, useState } from 'react';
import apiClient from '../api/client';

interface History {
  id: number;
  input_latex: string;
  output_html: string;
  conversion_time_ms: number;
  timestamp: string;
}

export const History = () => {
  const [history, setHistory] = useState<History[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getHistory();
      setHistory(response.data.results || []);
    } catch (err) {
      setError('Failed to load conversion history');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading history...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Conversion History</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No conversions yet. Start converting LaTeX documents!</div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-gray-500">{new Date(item.timestamp).toLocaleString()}</div>
                <div className="text-sm font-semibold text-green-600">{item.conversion_time_ms}ms</div>
              </div>
              <details className="cursor-pointer">
                <summary className="font-semibold text-gray-800 hover:text-blue-600">View Input & Output</summary>
                <div className="mt-3 space-y-2 text-sm bg-gray-50 p-3 rounded">
                  <div>
                    <strong>Input LaTeX:</strong>
                    <pre className="bg-white p-2 rounded mt-1 overflow-x-auto text-xs">{item.input_latex}</pre>
                  </div>
                  <div>
                    <strong>Output HTML (first 200 chars):</strong>
                    <pre className="bg-white p-2 rounded mt-1 overflow-x-auto text-xs">{item.output_html.substring(0, 200)}...</pre>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

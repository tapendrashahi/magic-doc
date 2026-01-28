import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-blue-600">📝 LaTeX Converter</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, <strong>{user?.username}</strong></span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => navigate('/notes')}
              className="py-4 px-2 border-b-2 border-transparent hover:border-blue-600 font-semibold text-gray-700 hover:text-blue-600 transition"
            >
              📚 My Notes
            </button>
            <button
              onClick={() => navigate('/editor')}
              className="py-4 px-2 border-b-2 border-transparent hover:border-blue-600 font-semibold text-gray-700 hover:text-blue-600 transition"
            >
              ✏️ New Note
            </button>
            <button
              onClick={() => navigate('/history')}
              className="py-4 px-2 border-b-2 border-transparent hover:border-blue-600 font-semibold text-gray-700 hover:text-blue-600 transition"
            >
              📜 History
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
          <p>LaTeX Converter • Convert your LaTeX documents to beautiful HTML</p>
        </div>
      </footer>
    </div>
  );
};

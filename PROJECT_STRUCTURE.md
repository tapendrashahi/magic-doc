# Project Structure & Architecture Overview

**LaTeX Converter Web Application**  
**Status:** Phase 5 Complete ✅ | Ready for Deployment  
**Last Updated:** January 28, 2026

---

## Directory Structure

```
latex-converter-web/
├── README.md                          # Project overview
├── PHASE_1_COMPLETE.md               # Phase 1 completion report
├── PHASE_2_COMPLETE.md               # Phase 2 completion report
├── PHASE_5_COMPLETE.md               # Phase 5 completion report (NEW)
├── PHASE_5_SUMMARY.md                # Phase 5 detailed summary (NEW)
├── PHASE_6_PLAN.md                   # Phase 6 deployment plan (NEW)
├── WEB_APP_PLAN.md                   # Overall project plan
├── start.sh                          # Start both servers
├── stop.sh                           # Stop both servers
│
├── backend/                          # Django REST API
│   ├── manage.py                     # Django management
│   ├── db.sqlite3                    # Development database
│   ├── requirements.txt              # Python dependencies
│   │
│   ├── config/                       # Django configuration
│   │   ├── settings.py               # Main settings
│   │   ├── urls.py                   # Main URL routing
│   │   ├── asgi.py                   # ASGI configuration
│   │   └── wsgi.py                   # WSGI configuration
│   │
│   ├── accounts/                     # User authentication app
│   │   ├── models.py                 # (extends Django User)
│   │   ├── views.py                  # login/register endpoints
│   │   ├── urls.py                   # Auth URLs
│   │   ├── serializers.py            # (if needed)
│   │   ├── admin.py
│   │   ├── apps.py
│   │   └── migrations/
│   │
│   ├── api/                          # Main API app
│   │   ├── models.py                 # Note, ConversionHistory models
│   │   ├── views.py                  # NoteViewSet with all endpoints
│   │   ├── serializers.py            # NoteSerializer, UserSerializer
│   │   ├── urls.py                   # API URL routing (ViewSets)
│   │   ├── admin.py                  # Admin interface
│   │   ├── apps.py
│   │   └── migrations/
│   │       ├── 0001_initial.py       # Initial migration
│   │
│   └── converter/                    # LaTeX conversion app
│       ├── converter.py              # Regex-based LaTeX→HTML converter
│       ├── models.py                 # (if needed)
│       ├── views.py
│       ├── admin.py
│       ├── apps.py
│       └── migrations/
│
└── frontend/                         # React + Vite application
    ├── package.json                  # Node dependencies & scripts
    ├── vite.config.ts                # Vite build configuration
    ├── tsconfig.json                 # TypeScript configuration
    ├── tailwind.config.js            # Tailwind CSS config
    ├── postcss.config.js             # PostCSS configuration
    ├── eslint.config.js              # ESLint configuration
    ├── index.html                    # HTML entry point
    │
    ├── src/
    │   ├── main.tsx                  # React entry point
    │   ├── App.tsx                   # Main App component (UPDATED Phase 5)
    │   ├── App.css                   # App styles
    │   ├── index.css                 # Global styles + animations (UPDATED Phase 5)
    │   │
    │   ├── types/
    │   │   └── index.ts              # TypeScript interfaces & types
    │   │
    │   ├── api/
    │   │   └── client.ts             # Axios API client with interceptors
    │   │
    │   ├── contexts/
    │   │   └── AuthContext.tsx        # Authentication context provider
    │   │
    │   ├── store/
    │   │   └── noteStore.ts          # Zustand store (Phase 3)
    │   │
    │   ├── services/                 # Business logic services
    │   │   ├── converter.ts          # Debounced LaTeX conversion (Phase 3)
    │   │   ├── mathjax.ts            # MathJax initialization (Phase 3)
    │   │   ├── toast.ts              # Toast notifications (NEW Phase 5)
    │   │   ├── keyboard.ts           # Keyboard shortcuts (NEW Phase 5)
    │   │   └── export.ts             # Export functionality (NEW Phase 5)
    │   │
    │   ├── components/
    │   │   ├── Layout.tsx            # Main layout with header/nav
    │   │   ├── ProtectedRoute.tsx    # Auth guard component
    │   │   ├── LaTeXInput.tsx        # LaTeX input with highlighting (UPDATED Phase 5)
    │   │   ├── HTMLPreview.tsx       # HTML preview + export (UPDATED Phase 5)
    │   │   └── ToastContainer.tsx    # Toast renderer (NEW Phase 5)
    │   │
    │   ├── pages/
    │   │   ├── Login.tsx             # Login page
    │   │   ├── Notes.tsx             # Notes list page
    │   │   ├── Editor.tsx            # Main editor page (UPDATED Phase 5)
    │   │   └── History.tsx           # Conversion history page
    │   │
    │   └── assets/                   # Static assets (if any)
    │
    └── public/                       # Static files (favicon, etc.)
```

---

## Backend Architecture

### Django Apps & Purpose

#### 1. **config** (Django Configuration)
- `settings.py` - Django settings (auth, database, installed apps, middleware)
- `urls.py` - Main URL routing (admin, api, accounts, api-auth)
- `asgi.py` / `wsgi.py` - Server interfaces

#### 2. **accounts** (User Authentication)
- `views.py` - Login and register endpoints
- `urls.py` - Auth URL patterns
- Leverages Django's built-in User model and Token authentication

#### 3. **api** (Main API)
- **Models:**
  - `Note` - User's LaTeX→HTML conversions
  - `ConversionHistory` - Track conversion history

- **Views:**
  - `NoteViewSet` - Full CRUD (retrieve, list, create, update, delete)
  - `convert()` - Convert LaTeX to HTML
  - `toggle_favorite()` - Mark/unmark as favorite
  - `favorites()` - List favorite notes
  - `recent()` - Get recent notes

- **Serializers:**
  - `NoteSerializer` - Note data serialization
  - `UserSerializer` - User info serialization

- **URLs:**
  - `/api/notes/` - List/create notes
  - `/api/notes/{id}/` - Retrieve/update/delete note
  - `/api/notes/convert/` - Convert LaTeX
  - `/api/notes/{id}/toggle_favorite/` - Toggle favorite
  - `/api/notes/favorites/` - List favorites
  - `/api/notes/recent/` - Get recent notes

#### 4. **converter** (LaTeX Conversion Logic)
- `converter.py` - Regex-based LaTeX→HTML converter
- Handles: sections, text formatting, math mode conversion
- Returns: Plain HTML suitable for MathJax rendering

### API Endpoints Reference

#### Authentication
```
POST   /api/auth/login/        - Login with credentials → token
POST   /api/auth/register/     - Register new user → token
GET    /api/users/me/          - Get current user info (token-required)
```

#### Notes (CRUD)
```
GET    /api/notes/             - List user's notes (paginated, filterable)
POST   /api/notes/             - Create new note
GET    /api/notes/{id}/        - Retrieve single note
PATCH  /api/notes/{id}/        - Update note
DELETE /api/notes/{id}/        - Delete note
```

#### Conversion & Features
```
POST   /api/notes/convert/     - Convert LaTeX to HTML
POST   /api/notes/{id}/toggle_favorite/ - Toggle favorite status
GET    /api/notes/favorites/   - List favorite notes
GET    /api/notes/recent/      - Get recent notes
```

#### Features
- Token-based authentication (DRF TokenAuthentication)
- User-scoped queries (can only see own notes)
- Pagination (20 items per page, max 100)
- Search/filter/ordering support
- Error handling with meaningful responses

---

## Frontend Architecture

### Component Hierarchy

```
App
├── Router
    ├── Login (public route)
    ├── ProtectedRoute
    │   ├── Layout
    │   │   ├── Header (nav, logout)
    │   │   └── Notes (list of user's notes)
    │   └── ProtectedRoute
    │       ├── Layout
    │       │   └── Editor (main editor)
    │       │       ├── LaTeXInput (left pane)
    │       │       │   └── Syntax highlighting overlay
    │       │       └── HTMLPreview (right pane)
    │       │           ├── MathJax rendering
    │       │           └── Export buttons
    │       └── Layout
    │           └── History (conversion history)
    └── ToastContainer (global toast display)
```

### State Management (Zustand)

```typescript
useNoteStore {
  // State
  notes: Note[]
  currentNote: Note | null
  loading: boolean
  error: string | null

  // Actions
  fetchNotes(search?, sort?, page?)
  createNote(title, latex)
  updateNote(id, updates)
  deleteNote(id)
  toggleFavorite(id)
  convertLatex(latex) - async
}
```

### Services

#### 1. **converter.ts**
- `convertLatex(latex)` - Debounced API call to `/api/notes/convert/`
- `debounce(fn, delay)` - Utility function for debouncing
- 500ms debounce delay on LaTeX input

#### 2. **mathjax.ts**
- `init()` - Load MathJax 3 from CDN (async)
- `typeset(element?)` - Render math in HTML
- Singleton pattern to prevent multiple initializations
- Supports inline `\(...\)` and display `\[...\]` math

#### 3. **toast.ts** (NEW - Phase 5)
- `ToastManager` class with pub-sub pattern
- Methods: `show()`, `success()`, `error()`, `info()`, `warning()`, `remove()`
- Auto-dismiss after 3 seconds (configurable)
- Global `toastManager` instance

#### 4. **keyboard.ts** (NEW - Phase 5)
- `KeyboardShortcutManager` class
- `register(shortcut)` - Register new shortcut
- `handleKeyDown(event)` - Handle keyboard events
- `getShortcuts()` - List all registered shortcuts
- Supports Ctrl, Shift, Alt modifiers

#### 5. **export.ts** (NEW - Phase 5)
- `exportAsMarkdown(note)` - Download .md file
- `exportAsHTML(note)` - Download standalone .html
- `copyToClipboard(text)` - Copy HTML to clipboard
- `print(note)` - Open print dialog
- All client-side, no server required

### UI Features

#### LaTeXInput Component
- Textarea with real-time conversion (500ms debounce)
- Syntax highlighting overlay (5 colors):
  - Red: LaTeX commands (`\section`, `\textbf`)
  - Purple: Math mode (`$...$`)
  - Orange: Braces/brackets
  - Green: Comments
- Character counter
- Examples panel toggle
- Error/loading state display

#### HTMLPreview Component
- MathJax rendering of converted HTML
- Export buttons:
  - 📋 Copy HTML
  - 📥 Export as Markdown
  - 🖥️ Export as HTML
  - 🖨️ Print
- Status indicator (✨ Updating... / ✓ Ready)
- Toast feedback for actions

#### Editor Page
- Title input
- Two-column split pane (LaTeXInput | HTMLPreview)
- Save button (Ctrl+S)
- Last saved timestamp
- Keyboard shortcuts help
- Error/warning display
- Loading indicators

### Design System

#### Colors
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Warning: Yellow (#F59E0B)
- Info: Blue (#3B82F6)
- Background: Gray (#F3F4F6)
- Text: Dark Gray (#1F2937)

#### Typography
- Font: System fonts (sans-serif)
- Code: Monospace
- Sizes: sm (12px), base (16px), lg (18px), xl (20px), 2xl (24px)

#### Spacing
- Using Tailwind CSS scale (1 = 4px)
- 4, 8, 12, 16, 24, 32, 48, 64...

#### Animations
- Duration: 0.3s
- Easing: ease-out
- Effects: slideIn, fadeIn, slideUp

---

## Data Models

### Django Models

#### Note Model
```python
class Note(models.Model):
    user = ForeignKey(User)          # Who owns this
    title = CharField(max_length=255)
    latex_content = TextField()      # Original LaTeX
    html_content = TextField()       # Converted HTML
    is_favorite = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

#### ConversionHistory Model
```python
class ConversionHistory(models.Model):
    user = ForeignKey(User)
    latex_input = TextField()        # Input LaTeX (≤1000 chars)
    html_output = TextField()        # Output HTML (≤2000 chars)
    conversion_time_ms = IntegerField()
    created_at = DateTimeField(auto_now_add=True)
```

### TypeScript Interfaces

#### User
```typescript
interface User {
  id: number;
  username: string;
  email: string;
}
```

#### Note
```typescript
interface Note {
  id: number;
  title: string;
  latex_content: string;
  html_content: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}
```

#### ConversionResult
```typescript
interface ConversionResult {
  html_content: string;
  error?: string;
}
```

---

## Technology Stack

### Backend
- **Framework:** Django 5.0.1
- **REST API:** Django REST Framework
- **Authentication:** Token-based (rest_framework.authtoken)
- **Database:** SQLite (dev), PostgreSQL (prod)
- **Server:** Django development server (dev), Gunicorn/uWSGI (prod)

### Frontend
- **Framework:** React 19.2.0 with TypeScript
- **Build Tool:** Vite 7.3.1
- **State Management:** Zustand
- **CSS:** Tailwind CSS v3
- **HTTP Client:** Axios
- **Math Rendering:** MathJax 3 (CDN)
- **Syntax Highlighting:** (Reserved: prismjs)

### DevOps (Planned - Phase 6)
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Database:** PostgreSQL
- **Reverse Proxy:** Nginx
- **Caching:** Redis (optional)
- **CI/CD:** GitHub Actions
- **Hosting:** Railway/Vercel recommended

---

## Deployment Architecture (Phase 6)

### Development (Current)
```
Local Machine
├── Backend: http://127.0.0.1:8000/
├── Frontend: http://localhost:5175/
└── Database: SQLite (db.sqlite3)
```

### Production (Recommended)
```
User Browser
├── Frontend: Vercel CDN (https://app.example.com)
└── API: Railway or DigitalOcean
    ├── Reverse Proxy: Nginx (HTTPS)
    ├── Django App: Gunicorn
    └── Database: PostgreSQL (managed)
```

---

## Development Workflow

### Starting Servers
```bash
bash start.sh
# Backend: http://127.0.0.1:8000/ (PID shown)
# Frontend: http://localhost:5175/ (PID shown)
```

### Stopping Servers
```bash
bash stop.sh
```

### Making Changes
1. Edit frontend code → Vite hot-reload (automatic)
2. Edit backend code → Django auto-reload (automatic)
3. Add dependencies:
   - Frontend: `npm install package-name`
   - Backend: Add to `requirements.txt`, then `pip install -r requirements.txt`

### Testing
```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && python manage.py test
```

---

## Environment Variables

### Backend (.env or export)
```bash
DEBUG=True                        # Development
SECRET_KEY=django-insecure-...
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

### Frontend (.env.local)
```bash
VITE_API_URL=http://127.0.0.1:8000
VITE_APP_NAME=LaTeX Converter
```

---

## Security Considerations

### Current (Development)
- Token-based authentication ✅
- User-scoped queries ✅
- CORS configured for localhost ✅
- Debug mode enabled (for development)

### Recommended (Production - Phase 6)
- HTTPS/SSL certificates ✅
- Environment variables for secrets ✅
- CORS restricted to production domain ✅
- Rate limiting on API ✅
- Secure cookies (HttpOnly, Secure flags) ✅
- CSRF protection ✅
- SQL injection prevention (Django ORM) ✅
- XSS protection (React auto-escaping) ✅

---

## Monitoring & Logging (Phase 6)

### Current
- Django development server console output
- Browser console for frontend errors

### Recommended (Production)
- Structured JSON logging
- Sentry for error tracking
- DataDog/New Relic for APM
- Prometheus/Grafana for metrics
- Log aggregation (ELK Stack)

---

## Performance Characteristics

### Baseline (Current Development)
| Metric | Value | Notes |
|--------|-------|-------|
| API Response Time | ~50-200ms | Network + processing |
| LaTeX Conversion | 500ms (debounced) | Real-time with delay |
| Page Load | ~1-2s | Initial load + assets |
| MathJax Render | ~300-500ms | First-time initialization |
| Export Generation | <100ms | Client-side only |

### Optimization Targets (Phase 6)
- API response: <100ms (with caching)
- Page load: <1s (with CDN + code splitting)
- MathJax render: <200ms (with preload)
- Export: <50ms (already optimized)

---

## Git Structure

```
main branch
├── Phase 1 commits - Backend setup
├── Phase 2 commits - Frontend setup
├── Phase 3 commits - Real-time integration
├── Phase 4 commits - Backend features
└── Phase 5 commits - Polish & features (CURRENT)
    └── Next: Phase 6 commits - Production deployment
```

---

## Summary

The LaTeX Converter is a full-stack web application with:
- ✅ Clean architecture (services, components, pages)
- ✅ Type-safe TypeScript throughout
- ✅ Modern React with Hooks
- ✅ Django REST API
- ✅ Real-time conversion with debounce
- ✅ Professional UI with animations
- ✅ Multiple export options
- ✅ Keyboard shortcuts
- ✅ Toast notifications
- ✅ Ready for production deployment

**Ready for Phase 6: Deployment** 🚀

# 🎯 LaTeX-to-HTML Web Application - Complete Development Plan

## Vision
A Mathpix Snip-inspired web app where users can paste LaTeX code, see real-time HTML preview with inline math rendering, and copy beautifully formatted code.

---

## 📋 Tech Stack

### Backend
- **Framework**: Django 4.2+
- **API**: Django REST Framework
- **Database**: SQLite (development) → PostgreSQL (production)
- **Task Queue**: Celery (for async conversions if needed)
- **Deployment**: Gunicorn + Nginx

### Frontend
- **Language**: TypeScript
- **Framework**: React 18+
- **UI Library**: Material-UI or Tailwind CSS
- **Math Rendering**: MathJax 3
- **Code Highlighting**: Prism.js
- **State Management**: Zustand or Redux Toolkit
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Database
- **Development**: SQLite
- **Production**: PostgreSQL
- **ORM**: Django ORM

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │   Left Panel     │  │      Right Panel               │  │
│  ├──────────────────┤  ├────────────────────────────────┤  │
│  │ + New Note       │  │  HTML Preview                  │  │
│  │ Note List        │  │  - Inline Math Rendering       │  │
│  │ - Note 1         │  │  - Copy Button                 │  │
│  │ - Note 2         │  │  - Live Update                 │  │
│  │ - Note 3         │  │                                │  │
│  │                  │  │  [Copy HTML] [Copy LaTeX]      │  │
│  │ LaTeX Input      │  │                                │  │
│  │ (Paste here)     │  │                                │  │
│  └──────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓ (API Calls)
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Django)                         │
│  ├─ /api/notes/ (CRUD)                                     │
│  ├─ /api/convert/ (LaTeX → HTML)                           │
│  ├─ /api/render/ (Instant preview)                         │
│  └─ /api/auth/ (User management)                           │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                  Database (SQLite)                          │
│  - Users                                                     │
│  - Notes (LaTeX content + HTML output)                      │
│  - Conversions (history)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Phase-by-Phase Plan

### ⚡ PHASE 1: Setup & Backend Core (Week 1)

#### 1.1 Project Initialization
- [ ] Create Django project: `django-admin startproject latex_converter`
- [ ] Create Django apps:
  - `api` - REST API endpoints
  - `converter` - LaTeX conversion logic
  - `accounts` - User management
- [ ] Setup project structure
- [ ] Configure settings (database, CORS, static files)

**Deliverable**: Django project running, database configured

#### 1.2 Database Models
```python
# models.py structure
User (Django built-in)
Note
  - id (PK)
  - user (FK to User)
  - title
  - latex_content (TextField)
  - html_content (TextField)
  - created_at
  - updated_at
  - is_favorite

ConversionHistory
  - id
  - user (FK)
  - input_latex
  - output_html
  - conversion_time
  - timestamp
```

**Deliverable**: Migrations ready

#### 1.3 API Endpoints (Django REST Framework)
- [ ] POST `/api/notes/` - Create note
- [ ] GET `/api/notes/` - List user's notes
- [ ] GET `/api/notes/{id}/` - Get single note
- [ ] PUT `/api/notes/{id}/` - Update note
- [ ] DELETE `/api/notes/{id}/` - Delete note
- [ ] POST `/api/convert/` - Convert LaTeX to HTML (receives LaTeX, returns HTML)
- [ ] POST `/api/auth/register/` - User registration
- [ ] POST `/api/auth/login/` - User login
- [ ] POST `/api/auth/logout/` - User logout

**Deliverable**: All endpoints working, tested with Postman

#### 1.4 Converter Integration
- [ ] Integrate `advanced_converter.py` as Django service
- [ ] Create converter module in Django
- [ ] Add error handling
- [ ] Cache conversion results

**Deliverable**: `/api/convert/` returns HTML from LaTeX

---

### 🎨 PHASE 2: Frontend Setup & UI (Week 2)

#### 2.1 React Project Setup
- [ ] Create React app with Vite: `npm create vite@latest latex-converter-web -- --template react-ts`
- [ ] Install dependencies:
  ```bash
  npm install axios zustand mathjax prism tailwindcss @mui/material
  ```
- [ ] Setup folder structure:
  ```
  src/
  ├── components/
  │   ├── LeftPanel.tsx
  │   ├── RightPanel.tsx
  │   ├── NoteList.tsx
  │   ├── LaTeXInput.tsx
  │   └── HTMLPreview.tsx
  ├── pages/
  │   ├── Dashboard.tsx
  │   └── Auth.tsx
  ├── services/
  │   ├── api.ts
  │   └── converter.ts
  ├── store/
  │   └── noteStore.ts
  ├── styles/
  │   └── globals.css
  └── App.tsx
  ```

**Deliverable**: React app running, folder structure ready

#### 2.2 Left Panel UI
- [ ] Create NoteList component
- [ ] Add "+" button for new note
- [ ] Display list of notes with:
  - Note title
  - Last modified date
  - Delete button
  - Star/favorite toggle
- [ ] Create LaTeX input area (textarea)
- [ ] Add auto-save indicator

**Deliverable**: Left panel UI complete and styled

#### 2.3 Right Panel UI
- [ ] Create HTMLPreview component
- [ ] Add HTML rendering area
- [ ] Add Copy buttons (Copy HTML, Copy LaTeX)
- [ ] Add live indicator ("Updating...", "Ready")
- [ ] Styling with Tailwind/Material-UI

**Deliverable**: Right panel UI complete

#### 2.4 Layout & Styling
- [ ] Create responsive layout (left 30%, right 70%)
- [ ] Style inspired by Mathpix Snip
- [ ] Dark mode support (optional)
- [ ] Mobile responsive design

**Deliverable**: Mathpix Snip-inspired UI complete

---

### 🔌 PHASE 3: Real-time Integration (Week 3)

#### 3.1 API Service Layer
```typescript
// services/api.ts
- createNote()
- updateNote()
- deleteNote()
- getNotes()
- convertLatex()
- loginUser()
- registerUser()
```

**Deliverable**: All API calls functional

#### 3.2 State Management (Zustand)
```typescript
// store/noteStore.ts
- notes: Note[]
- currentNote: Note
- loading: boolean
- error: string
- addNote()
- updateNote()
- deleteNote()
- setCurrentNote()
```

**Deliverable**: State management working

#### 3.3 Real-time Conversion
- [ ] Implement debounced onChange handler (500ms)
- [ ] Call `/api/convert/` on text change
- [ ] Update HTML preview in real-time
- [ ] Show loading indicator while converting
- [ ] Handle errors gracefully

**Deliverable**: Live conversion working (no click needed!)

#### 3.4 MathJax Integration
- [ ] Load MathJax from CDN
- [ ] Configure for inline (`\(...\)`) and display (`\[...\]`) math
- [ ] Integrate with HTML preview
- [ ] Re-render math on update

**Deliverable**: Math equations rendering beautifully

---

### 💾 PHASE 4: Backend Features (Week 4)

#### 4.1 Authentication
- [ ] Setup JWT tokens (or Django sessions)
- [ ] User registration
- [ ] User login
- [ ] User logout
- [ ] Protected endpoints

**Deliverable**: Auth system working

#### 4.2 Note Management
- [ ] CRUD operations for notes
- [ ] Auto-save on every change
- [ ] Timestamp tracking
- [ ] Search/filter notes

**Deliverable**: Note management fully functional

#### 4.3 Conversion History
- [ ] Track all conversions
- [ ] Store input/output pairs
- [ ] Provide conversion history page

**Deliverable**: History tracking working

#### 4.4 Error Handling & Validation
- [ ] Input validation (LaTeX format)
- [ ] Error messages
- [ ] Rate limiting
- [ ] Try/catch handling

**Deliverable**: Robust error handling

---

### ✨ PHASE 5: Polish & Features (Week 5)

#### 5.1 Copy to Clipboard
- [ ] Copy HTML button
- [ ] Copy LaTeX button
- [ ] Show success toast/notification
- [ ] Use clipboard API

**Deliverable**: Copy functionality working

#### 5.2 Code Highlighting
- [ ] Integrate Prism.js
- [ ] Highlight LaTeX syntax
- [ ] Show line numbers (optional)

**Deliverable**: Pretty code display

#### 5.3 Export Options
- [ ] Export as HTML file
- [ ] Export as PDF
- [ ] Export as Markdown

**Deliverable**: Multiple export formats

#### 5.4 UI Polish
- [ ] Smooth animations
- [ ] Loading skeletons
- [ ] Better error messages
- [ ] Keyboard shortcuts (Ctrl+S for save, Ctrl+Enter for convert)

**Deliverable**: Professional, polished UI

---

### 🚀 PHASE 6: Deployment & Optimization (Week 6)

#### 6.1 Frontend Build & Optimization
- [ ] Production build
- [ ] Minification
- [ ] Code splitting
- [ ] Asset optimization
- [ ] Deploy to Vercel/Netlify

#### 6.2 Backend Deployment
- [ ] Configure production settings
- [ ] Setup PostgreSQL
- [ ] Setup Gunicorn + Nginx
- [ ] SSL certificate
- [ ] Deploy to Heroku/AWS/DigitalOcean

#### 6.3 Database Migrations
- [ ] Create migration scripts
- [ ] Test migrations
- [ ] Setup backup system

#### 6.4 Testing & QA
- [ ] Unit tests (Python + TypeScript)
- [ ] Integration tests
- [ ] Performance testing
- [ ] Security audit

**Deliverable**: Production-ready application

---

## 📚 Documentation Plan

### Phase 1: Setup Documentation
```
docs/
├── SETUP.md
│   - Project structure
│   - Environment setup
│   - Database configuration
│   - Django admin guide
└── API.md
    - Endpoint reference
    - Request/response examples
    - Authentication
```

### Phase 2: Frontend Documentation
```
docs/
├── FRONTEND.md
│   - Component structure
│   - Component API
│   - State management guide
└── STYLING.md
    - Design system
    - Color palette
    - Typography
```

### Phase 3: Integration Documentation
```
docs/
├── INTEGRATION.md
│   - API integration guide
│   - Real-time conversion flow
│   - Error handling
└── MATH_RENDERING.md
    - MathJax setup
    - Inline vs display math
    - Custom configurations
```

### Phase 4-6: User & Developer Docs
```
docs/
├── USER_GUIDE.md
│   - How to use the app
│   - Features guide
│   - Keyboard shortcuts
├── DEPLOYMENT.md
│   - Production setup
│   - Environment variables
│   - Docker setup
└── TROUBLESHOOTING.md
    - Common issues
    - FAQ
    - Performance tuning
```

---

## 🗂️ Project Structure

```
latex-converter-web/
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── api/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── permissions.py
│   ├── converter/
│   │   ├── converter.py (← Our advanced_converter.py integrated here)
│   │   ├── utils.py
│   │   └── tasks.py
│   ├── accounts/
│   │   ├── models.py
│   │   ├── views.py
│   │   └── serializers.py
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LeftPanel.tsx
│   │   │   ├── RightPanel.tsx
│   │   │   ├── NoteList.tsx
│   │   │   ├── LaTeXInput.tsx
│   │   │   ├── HTMLPreview.tsx
│   │   │   └── Header.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   └── NotFound.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── converter.ts
│   │   ├── store/
│   │   │   └── noteStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env
│
├── docs/
│   ├── SETUP.md
│   ├── API.md
│   ├── FRONTEND.md
│   ├── DEPLOYMENT.md
│   └── USER_GUIDE.md
│
├── docker-compose.yml
├── Dockerfile
├── .gitignore
├── README.md
└── LICENSE
```

---

## 📋 Quick Phase Breakdown

| Phase | Focus | Duration | Key Deliverable |
|-------|-------|----------|-----------------|
| 1 | Django Setup | 3-4 days | Backend API ready |
| 2 | React UI | 3-4 days | Frontend with UI |
| 3 | Integration | 3-4 days | Real-time conversion |
| 4 | Features | 3-4 days | Full backend features |
| 5 | Polish | 2-3 days | Production UI |
| 6 | Deploy | 2-3 days | Live app |

**Total Timeline**: 4-5 weeks (working full-time)

---

## 🎯 MVP vs Full Features

### MVP (Week 2-3)
- ✅ Basic UI (left/right panels)
- ✅ LaTeX paste & convert
- ✅ HTML preview with MathJax
- ✅ Copy button
- ✅ Backend API
- ✅ SQLite storage

### Full Features (Week 4-6)
- ✅ User authentication
- ✅ Multiple notes
- ✅ Export options
- ✅ Conversion history
- ✅ Advanced UI polish
- ✅ Production deployment

---

## 🔑 Key Features Checklist

### Left Panel
- [x] Note list
- [x] Add note button (+)
- [x] Delete note
- [x] Favorite/star toggle
- [x] LaTeX textarea
- [x] Auto-save indicator
- [x] Search notes

### Right Panel
- [x] HTML preview (live rendering)
- [x] Inline MathJax rendering
- [x] Copy HTML button
- [x] Copy LaTeX button
- [x] Copy success notification
- [x] Loading indicator
- [x] Error display

### Backend
- [x] Convert LaTeX to HTML
- [x] Store notes
- [x] User authentication
- [x] Auto-save
- [x] Conversion history
- [x] Rate limiting
- [x] Error handling

### Advanced (Optional)
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Collaborative editing
- [ ] Share notes
- [ ] Templates
- [ ] Custom CSS styling

---

## 🛠️ Technology Decisions

### Why These Choices?

| Tech | Why |
|------|-----|
| Django | Fast, secure, great for APIs |
| React + TS | Type-safe, component-based, large ecosystem |
| SQLite (dev) | Zero config, easy setup |
| MathJax | Beautiful math rendering |
| Zustand | Lightweight state management |
| Tailwind | Fast styling, utility-first |
| Vite | Lightning fast builds |

---

## 📊 Database Schema

```sql
-- Users (Django built-in auth_user)
id, username, email, password_hash, created_at

-- api_note
id, user_id, title, latex_content, html_content, created_at, updated_at, is_favorite

-- api_conversionhistory
id, user_id, input_latex, output_html, conversion_time_ms, timestamp

-- Indexes
CREATE INDEX idx_note_user_id ON api_note(user_id);
CREATE INDEX idx_note_created ON api_note(created_at);
```

---

## 🚀 Getting Started Commands

### Backend Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Migrate database
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 📝 Documentation to Create

1. **ARCHITECTURE.md** - System overview, data flow
2. **SETUP.md** - How to set up locally
3. **API_REFERENCE.md** - All endpoints with examples
4. **COMPONENT_GUIDE.md** - React components overview
5. **DEPLOYMENT.md** - Production deployment steps
6. **USER_GUIDE.md** - How to use the app
7. **CONTRIBUTING.md** - How to contribute
8. **TROUBLESHOOTING.md** - Common issues & solutions

---

## ✅ Success Criteria

By end of Phase 6:
- ✅ Users can paste LaTeX and see HTML preview instantly
- ✅ Math renders beautifully with MathJax
- ✅ Copy buttons work smoothly
- ✅ Notes persist in database
- ✅ Multi-user support
- ✅ Beautiful UI inspired by Mathpix
- ✅ Production-ready code
- ✅ Complete documentation
- ✅ Deployed and live

---

## 🎉 Next Steps

1. **Review this plan** - Confirm it matches your vision
2. **Start Phase 1** - Django setup and API
3. **Create GitHub repo** - Set up version control
4. **Set up CI/CD** - GitHub Actions for testing
5. **Begin development** - Follow phases systematically

---

**Ready to build? Let's start with Phase 1! 🚀**

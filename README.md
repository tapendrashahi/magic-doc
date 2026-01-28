# 🚀 Quick Start Guide - LaTeX Converter Web App

## 📂 Project Structure

```
/home/tapendra/Documents/latex-converter-web/
├── backend/          # Django REST API
├── frontend/         # React TypeScript UI
├── PHASE_1_COMPLETE.md
└── PHASE_2_COMPLETE.md
```

## ⚡ Run Everything (3 Easy Steps)

### **Step 1: Start Backend** (Terminal 1)
```bash
cd /home/tapendra/Documents/latex-converter-web/backend
source venv/bin/activate
python manage.py runserver 8000
```
✅ Backend ready at: `http://localhost:8000`

### **Step 2: Start Frontend** (Terminal 2)
```bash
cd /home/tapendra/Documents/latex-converter-web/frontend
npm run dev
```
✅ Frontend ready at: `http://localhost:5173`

### **Step 3: Login & Test** (Browser)
- Open: http://localhost:5173
- Username: `admin`
- Password: `admin123`

## 🎯 What You Can Do

### ✏️ Create & Edit Notes
1. Click "New Note"
2. Enter title and LaTeX content
3. Click "Convert to HTML"
4. Preview on the right
5. Click "Save Note"

### 📚 View All Notes
- Click "My Notes" to see your notes
- Click ⭐ to favorite
- Click ✕ to delete
- Click on note to edit

### 📜 View History
- Click "History"
- See all conversions
- Conversion time tracked
- Input and output visible

## 🔌 API Endpoints (Backend)

All require header: `Authorization: Token <admin_token>`

```bash
# Get token
curl -X POST http://localhost:8000/api-auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get notes
curl http://localhost:8000/api/notes/ \
  -H "Authorization: Token 392bf4dbacb9d0fe8b841530ed79c191b7ca8936"

# Convert LaTeX
curl -X POST http://localhost:8000/api/notes/convert/ \
  -H "Authorization: Token 392bf4dbacb9d0fe8b841530ed79c191b7ca8936" \
  -H "Content-Type: application/json" \
  -d '{"latex_content":"\\section*{Test}\n$a+b$"}'
```

## 📊 Database

- **Type:** SQLite (development)
- **Location:** `/backend/db.sqlite3`
- **Tables:**
  - `auth_user` - User accounts
  - `api_note` - Notes with LaTeX content
  - `api_conversionhistory` - Conversion tracking
  - `authtoken_token` - API tokens

## 🛠 Tech Stack

### Backend
- Django 4.2
- Django REST Framework 3.14
- SQLite3
- Python 3.12

### Frontend
- React 19
- TypeScript 5
- Vite 7.3
- Tailwind CSS 3
- React Router v6

## 📱 Responsive Design

✅ Works on:
- Desktop (Chrome, Firefox, Safari, Edge)
- Tablet
- Mobile phones

## 🔒 Authentication

- Token-based (REST Framework)
- Token: `392bf4dbacb9d0fe8b841530ed79c191b7ca8936`
- Stored in browser localStorage
- Auto-redirects to login if expired

## 🎨 Features

✅ Create/Read/Update/Delete notes
✅ Real-time LaTeX → HTML conversion
✅ MathJax equation rendering
✅ Conversion history tracking
✅ Favorite notes
✅ Responsive UI
✅ Token-based auth
✅ CORS enabled
✅ Production-ready code

## 🐛 Troubleshooting

### **Port Already in Use**
```bash
# Backend port 8000
lsof -ti:8000 | xargs kill -9

# Frontend port 5173
lsof -ti:5173 | xargs kill -9
```

### **CORS Error**
- Backend already configured ✅
- Check `.env` in frontend for correct API URL
- Default: `VITE_API_URL=http://localhost:8000/api`

### **Token Invalid**
- Clear localStorage: `localStorage.clear()`
- Logout and login again
- Token: `392bf4dbacb9d0fe8b841530ed79c191b7ca8936`

### **API Not Found**
- Verify backend running on 8000: `curl http://localhost:8000/api/notes/`
- Check Admin interface: http://localhost:8000/admin/

## 📈 Scaling to Production

### **Backend**
```bash
# Generate new secret key
python -c "import secrets; print(secrets.token_urlsafe(50))"

# Switch to PostgreSQL in settings.py
# Use Gunicorn: gunicorn config.wsgi
# Deploy to: Heroku, AWS, DigitalOcean, etc.
```

### **Frontend**
```bash
# Build for production
npm run build

# Output in `dist/` folder
# Deploy to: Vercel, Netlify, AWS S3, etc.
```

## 🎓 Learning Resources

- [Django REST Framework Docs](https://www.django-rest-framework.org/)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [MathJax Docs](https://docs.mathjax.org/)

## 📞 Support

For issues or questions:
1. Check error messages in browser console (F12)
2. Check backend logs in terminal
3. Check `/backend/db.sqlite3` exists
4. Verify both ports (8000, 5173) are available

---

**Everything works! Happy coding! 🎉**
# MagicDoc

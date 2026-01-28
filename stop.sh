#!/bin/bash

echo "Stopping LaTeX Converter Web Application..."
echo ""

# Kill backend (Django running on port 8000)
echo "Stopping backend server..."
pkill -f "python manage.py runserver" 2>/dev/null

# Kill frontend (Vite dev server)
echo "Stopping frontend server..."
pkill -f "npm run dev" 2>/dev/null

# Alternative: Kill by port
# lsof -ti:8000 | xargs kill -9 2>/dev/null
# lsof -ti:5173 | xargs kill -9 2>/dev/null

echo ""
echo "All servers stopped."

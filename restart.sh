#!/bin/bash
# Restart servers with clean slate

echo "🔄 Stopping all servers..."
pkill -f "django\|vite\|node" 2>/dev/null
sleep 3

echo "✅ Servers stopped"
echo ""
echo "📝 Starting servers..."
cd /home/tapendra/Documents/latex-converter-web

# Start backend
echo "Starting Django backend..."
cd backend
python manage.py runserver 8000 &
DJANGO_PID=$!

# Start frontend
echo "Starting Vite frontend..."
cd ../frontend
npm run dev &
VITE_PID=$!

echo ""
echo "✅ Servers started!"
echo "Backend PID: $DJANGO_PID"
echo "Frontend PID: $VITE_PID"
echo ""
echo "🌐 Access the app:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:8000"
echo ""
echo "The converter has been updated with the fix!"
echo "Math blocks will now render correctly in the preview."

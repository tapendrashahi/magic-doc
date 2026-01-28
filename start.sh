#!/bin/bash

# Start backend and frontend concurrently
echo "Starting LaTeX Converter Web Application..."
echo ""

# Start backend
echo "Starting backend server..."
cd backend
python manage.py runserver &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend running with PID: $BACKEND_PID"
echo "Frontend running with PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait

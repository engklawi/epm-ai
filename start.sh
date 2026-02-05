#!/bin/bash
# EPM-AI — Start everything with one command
# Usage: ./start.sh

cd "$(dirname "$0")"

echo "🚀 Starting EPM-AI..."

# Kill any existing processes on our ports
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# Start backend
echo "📦 Starting backend..."
cd backend
GOOGLE_APPLICATION_CREDENTIALS=./firebase-sa-key.json PS_PASSWORD='rXr<{=eiKQ,49+V' npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready (use a simple check — /api routes require auth now)
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/ps/status 2>/dev/null | grep -q "401\|200" && break
  sleep 1
done

# Start frontend
echo "🖥️  Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
for i in {1..10}; do
  curl -s http://localhost:5173/ > /dev/null 2>&1 && break
  sleep 1
done

echo ""
echo "✅ EPM-AI is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for either process to exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

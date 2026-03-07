# AI Debate Judge

AI Debate Judge is a real-time debate platform where users can:

- register/login
- create or join debates
- submit arguments side-by-side
- request AI judgment
- see scores, verdict, and reasoning

The app is split into 3 services:

- `frontend` (Next.js)
- `backend` (Node.js + Express + Socket.IO + MongoDB)
- `ai_service` (FastAPI + Groq evaluation)

## Live URL

- Frontend: `https://ai-debate-judge-weld.vercel.app`

## Current Features

- JWT authentication (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- Debate creation with configurable argument limit (`1`, `3`, `5` per side)
- Side positions constrained to `For` / `Against`
- Real-time updates via Socket.IO
- AI judging through FastAPI endpoint `POST /judge`
- User debate stats (total, wins, losses, win rate)

## Tech Stack

### Frontend

- Next.js 14
- React 18
- Tailwind CSS
- Axios
- Socket.IO Client
- react-hot-toast

### Backend

- Node.js + Express
- Mongoose + MongoDB
- Socket.IO
- JWT + bcrypt
- express-validator

### AI Service

- FastAPI
- httpx
- pydantic
- python-dotenv
- Groq Chat Completions API

## Project Structure

```text
AI-Debate-judge/
	README.md
	ai_service/
		ai_judge_free.py
		requirements.txt
		.env.example
	backend/
		src/
			index.js
			routes/
			models/
			middleware/
			utils/
		package.json
		.env.example
	frontend/
		src/
			app/
			lib/
		package.json
		.env.example
```

## Prerequisites

- Node.js 18+ (recommended)
- Python 3.10+
- MongoDB (local or Atlas)
- A Groq API key

## Environment Variables

### `backend/.env`

Use `backend/.env.example` as base.

Required:

- `MONGODB_URI`
- `JWT_SECRET`

Common:

- `PORT=5000`
- `NODE_ENV=development`
- `FRONTEND_URL=http://localhost:3000`
- `AI_SERVICE_URL=http://localhost:8000`

### `frontend/.env.local`

Use `frontend/.env.example` as base.

- `NEXT_PUBLIC_API_URL=http://localhost:5000`
- `NEXT_PUBLIC_WS_URL=http://localhost:5000`

### `ai_service/.env`

Use `ai_service/.env.example` as base.

- `GROQ_API_KEY=your_groq_api_key`
- `AI_SERVICE_URL=http://localhost:8000` (optional local reference)

## Local Setup (Windows PowerShell)

### 1. Clone

```powershell
git clone https://github.com/harshlamba18/AI-Debate-judge.git
Set-Location "AI-Debate-judge"
```

### 2. Backend

```powershell
Set-Location ".\backend"
npm install
Copy-Item .env.example .env
# edit .env with your values
npm run dev
```

Backend runs on `http://localhost:5000`.

### 3. Frontend

Open a new terminal:

```powershell
Set-Location "<path-to>\AI-Debate-judge\frontend"
npm install
Copy-Item .env.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3000`.

### 4. AI Service

Open a third terminal:

```powershell
Set-Location "<path-to>\AI-Debate-judge\ai_service"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
# edit .env and set GROQ_API_KEY
uvicorn ai_judge_free:app --reload --host 0.0.0.0 --port 8000
```

AI service runs on `http://localhost:8000`.

## API Notes

### Backend

- Root: `GET /`
- Health: `GET /health`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Debates: `GET /api/debates`, `POST /api/debates`, `POST /api/debates/:id/join`, `POST /api/debates/:id/judge`
- Arguments: `POST /api/arguments`, `GET /api/arguments/debate/:debateId`

### AI Service

- Root: `GET /`
- Health: `GET /health`
- Judge: `POST /judge`

## Deployment Notes

- Frontend is suitable for Vercel.
- AI service is suitable for Render (FastAPI web service).
- Set backend `AI_SERVICE_URL` to your deployed AI service base URL (example: `https://<service>.onrender.com`).


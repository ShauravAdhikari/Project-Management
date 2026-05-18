# Yutani Foundation

Yutani Foundation is a full-stack project management platform for managing workspaces, projects, tasks, members, and productivity insights.

## What It Includes

- User authentication with login, signup, email verification, and password reset
- Workspace creation and member invitation
- Project creation with role-based project members
- Task management with priorities, statuses, subtasks, comments, and archive support
- Dashboard analytics for project and task progress
- AI assistant chat inside the dashboard
- Dark mode toggle

## Tech Stack

- Frontend: React 19, React Router 7, TypeScript, Tailwind CSS, React Query
- Backend: Node.js, Express, MongoDB, Mongoose
- Optional integrations: OpenAI, SendGrid, Arcjet

## Project Structure

```text
project-manager-main/
  backend/
  frontend/
  render.yaml
```

## Local Setup

### 1. Backend

Create `backend/.env` from `backend/.env.example`.

Minimum local values:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/yutani_foundation
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Optional values:

```env
SEND_GRID_API=
FROM_EMAIL=
ARCJET_ENV=development
ARCJET_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
```

Run:

```powershell
cd backend
npm install
npm run dev
```

### 2. Frontend

Create `frontend/.env` from `frontend/.env.example`.

```env
VITE_API_URL=http://localhost:5000/api-v1
```

Run:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Production Deployment

This project is set up to deploy cleanly as:

- 1 Render web service for `backend`
- 1 Render web service for `frontend`
- MongoDB Atlas for the database

A starter Render blueprint is included in `render.yaml`.

### Backend Render Settings

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Required production env vars:

- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `ARCJET_KEY`
- `ARCJET_ENV=production`

Optional production env vars:

- `SEND_GRID_API`
- `FROM_EMAIL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

### Frontend Render Settings

- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

Required env var:

- `VITE_API_URL=https://your-backend-url.onrender.com/api-v1`

After deploying the frontend, update the backend `FRONTEND_URL` to the final frontend URL.

## Health Check

The backend includes a health endpoint:

```text
GET /health
```

Example response:

```json
{
  "status": "ok",
  "service": "yutani-foundation-api",
  "environment": "production",
  "database": "connected"
}
```


## Notes

- In local development, missing SendGrid and Arcjet credentials are bypassed to keep the app runnable.
- In production, Arcjet must be configured.
- For production email flows, SendGrid must be configured.


# Leave Management System — Frontend

A modern, responsive web application for managing employee leave requests. Built with React and TypeScript, it connects to the [Leave Management System backend API](https://github.com/NAILLAHHHH/Leave_Management_System-main) running on `http://localhost:8080`.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build Tool | Vite 5 (with SWC) |
| Styling | Tailwind CSS + tailwindcss-animate |
| UI Components | shadcn/ui (Radix UI primitives) + MUI (Material UI v7) |
| Routing | React Router DOM v6 |
| State Management | Zustand |
| Server State / Data Fetching | TanStack React Query v5 + Axios |
| Forms | React Hook Form + Formik, validated with Zod / Yup |
| Charts | Recharts |
| Icons | Lucide React + MUI Icons |
| Date Utilities | date-fns + react-day-picker |
| Theming | next-themes (light/dark mode) |
| Notifications | Sonner (toasts) |
| File Export | file-saver |

---

## Prerequisites

- **Node.js** 18+ and **npm** (or use [nvm](https://github.com/nvm-sh/nvm))
- The backend API running at `http://localhost:8080`

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/NAILLAHHHH/Leave-management-system_frontend.git
cd Leave-management-system_frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The app runs at **http://localhost:3000** and proxies all `/api` requests to the backend at `http://localhost:8080`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
src/
├── components/       # Reusable UI components (shadcn/ui + custom)
├── pages/            # Route-level page components
├── hooks/            # Custom React hooks
├── services/         # Axios API service functions
├── store/            # Zustand global state
├── types/            # TypeScript type definitions
├── lib/              # Utility functions (e.g. cn helper)
└── main.tsx          # App entry point
```

---

## Backend Integration

The Vite dev server proxies API calls automatically — no CORS configuration needed during development:

```
/api/* → http://localhost:8080/*
```

To point to a different backend, update the `proxy` target in `vite.config.ts`:

```ts
proxy: {
  '/api': {
    target: 'http://your-backend-url',
    changeOrigin: true,
    secure: false
  }
}
```

---

## Docker

The project includes a Dockerfile for containerized deployment.

```bash
# Build the image
docker build -t leave-management-frontend .

# Run the container
docker run -p 3000:3000 leave-management-frontend
```

Or with Docker Compose:

```bash
docker-compose up --build
```

> **Note:** The Docker image runs `npm run dev --host` rather than serving the production build via a static server. For production deployments, consider serving the output of `npm run build` (the `dist/` folder) with a static server like Nginx.

---

## UI Features

- **Leave Request Management** — submit, view, edit, and track leave requests
- **Dashboard** — visual summary of leave balances and request status via Recharts
- **Role-based Views** — different experiences for employees and managers/admins
- **Dark / Light Mode** — theme toggle powered by `next-themes`
- **Form Validation** — client-side validation with Zod and Yup schemas
- **File Export** — export leave data using `file-saver`
- **Toast Notifications** — real-time feedback with Sonner

---

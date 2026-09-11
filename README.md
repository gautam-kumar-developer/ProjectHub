# ProjectHub

A full-stack **project management application** built with Next.js 15, featuring role-based access control, Kanban boards, real-time analytics, document management, and team collaboration tools.

---

## ✨ Features

### 🔐 Authentication & Authorization
- Credential-based authentication (email + password) powered by **NextAuth v5**
- JWT session strategy with secure password hashing (bcryptjs)
- Middleware-based route protection — unauthenticated users are redirected to login
- Auto-creation of a default workspace on user registration

### 🛡️ Role-Based Access Control (RBAC)
- **6 hierarchical roles**: Admin, Dept Head, Project Manager, Team Lead, Developer, QA
- **15 granular actions** mapped across a permission matrix with full, denied, and contextual access levels
- Server-side enforcement in all server actions + client-side UI gating
- Contextual ("limited") permissions — e.g., Developers can only create tasks in projects they belong to; PMs can only delete projects they created

| Role | Level | Key Capabilities |
|------|:-----:|------------------|
| Admin | 100 | Full access — create users, departments, manage members |
| Dept Head | 80 | Create/manage projects, assign & approve tasks |
| PM | 60 | Manage projects, assign tasks, review code |
| Team Lead | 40 | Create/assign tasks, review code (scoped to own projects) |
| Developer | 20 | Create tasks & upload docs in assigned projects, update own tasks |
| QA | 20 | QA/approve tasks, update task status, scoped reports |

### 📋 Project Management
- Create, update, and delete projects with status tracking (`Planning`, `Active`, `On Hold`, `Completed`)
- Custom color coding per project for visual identification
- Optional budget and target date fields
- Permission-gated CRUD operations with activity logging

### 📌 Kanban Board
- **Drag-and-drop** task management built with `@dnd-kit`
- Four columns: **To Do → In Progress → Review → Done**
- Drag tasks between columns to change status or reorder within a column
- Optimistic UI updates for a smooth experience
- Task cards display priority badges, assignee avatars, due dates, subtask progress, and comment counts

### ✅ Task Management
- Create tasks with title, description, status, priority (`Urgent`, `High`, `Medium`, `Low`), due date, assignee, and tags
- Slide-out detail sheet for inline editing of all task fields
- Subtask checklists with toggle and progress tracking
- Threaded comments with author info and timestamps
- Permission-aware status transitions (e.g., only code reviewers can move tasks to Review)

### 👥 Team Management
- View all workspace members with roles, departments, and task counts
- **Admin-only actions**: add members by email, remove members, change roles, create new user accounts
- Role hierarchy enforcement — users can only assign roles below their own level

### 🏬 Departments
- Create and manage organizational departments within a workspace
- Assign workspace members to departments

### 📄 Document Management
- Upload files to projects via API routes (stored on server filesystem)
- Download documents through dedicated API endpoints
- Role-scoped visibility:
  - **Developers** see documents only in their assigned projects
  - **QA** sees documents in projects with Review/Done tasks
  - **Admin/Dept Head/PM/Team Lead** see all workspace documents
- Delete permissions scoped to own uploads for limited roles

### 📊 Analytics Dashboard
- Summary stats: total projects, tasks, completion rate, overdue & urgent counts
- **Bar chart**: task distribution by status across projects
- **Pie chart**: overall task breakdown by status
- **Project progress bars**: per-project completion percentage
- **Member workload**: task distribution across team members
- Data is **role-scoped** — Developers see only their own stats, Team Leads see team stats, QA sees QA-relevant data

### 📝 Activity Logging
- Automatic audit trail for key actions: project creation, task creation, status changes, and Kanban moves
- Displayed on the dashboard in reverse chronological order

### ⚙️ Settings
- Appearance preferences (dark mode)
- Database connection status indicator
- Notification settings (placeholder for future updates)

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router + Turbopack) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| ORM | [Prisma v6](https://www.prisma.io/) |
| Database | PostgreSQL |
| Auth | [NextAuth v5](https://authjs.dev/) (Credentials provider, JWT) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Drag & Drop | [@dnd-kit](https://dndkit.com/) |
| Validation | [Zod](https://zod.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm**
- A **PostgreSQL** database (or use SQLite for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/project-hub.git
cd project-hub

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/projecthub"
AUTH_SECRET="your-secret-key-here"
```

### Database Setup

```bash
# Push the Prisma schema to your database
npm run db:push

# Seed the database with demo data
npm run db:seed
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev --turbopack` | Start dev server with Turbopack |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `db:push` | `prisma db push` | Push schema to database |
| `db:seed` | `tsx prisma/seed.ts` | Seed database with demo data |
| `db:studio` | `prisma studio` | Open Prisma Studio GUI |
| `lint` | `next lint` | Run ESLint |

---

## 🧪 Demo Credentials

After seeding the database, you can log in with any of these accounts (password: `password123`):

| Name | Email | Role |
|------|-------|------|
| Ronny Sharma | `admin@projecthub.com` | Admin |
| Hrishikesh Kumar | `dh@projecthub.com` | Dept Head |
| Sachin Kumar | `pm@projecthub.com` | PM |
| Satyam Kumar | `tl@projecthub.com` | Team Lead |
| Vikash Kumar | `dev@projecthub.com` | Dev |
| Atul Kumar | `qa@projecthub.com` | QA |


---

## 📂 Project Structure

```
├── app/
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── analytics/          # Analytics with charts
│   │   ├── dashboard/          # Main dashboard overview
│   │   ├── documents/          # Document management
│   │   ├── projects/[id]/      # Project listing & detail
│   │   ├── settings/           # Workspace settings
│   │   ├── tasks/              # Task listing
│   │   └── team/               # Team management
│   ├── api/
│   │   ├── auth/               # NextAuth API routes
│   │   └── documents/          # Upload & download endpoints
│   ├── login/                  # Login page
│   ├── register/               # Registration page
│   └── page.tsx                # Public landing page
├── components/
│   ├── kanban/                 # Kanban board, columns, task cards
│   ├── tasks/                  # Task detail sheet
│   ├── ui/                     # 12 reusable UI components
│   ├── header.tsx              # App header with role badge
│   └── sidebar.tsx             # Navigation sidebar
├── lib/
│   ├── actions.ts              # Server actions (business logic)
│   ├── rbac.ts                 # RBAC permission system
│   ├── validations.ts          # Zod validation schemas
│   ├── prisma.ts               # Prisma client singleton
│   └── utils.ts                # Utility functions
├── prisma/
│   └── schema.prisma           # Database schema (10 models)
├── middleware.ts                # Auth route protection
└── auth.ts                     # NextAuth configuration
```

---

## 🗄️ Database Models

The application uses **10 Prisma models**:

**User** · **Workspace** · **WorkspaceMember** · **Department** · **Project** · **Task** · **Subtask** · **Comment** · **ActivityLog** · **Document**

Key relationships:
- Users belong to Workspaces through WorkspaceMember (with per-workspace roles)
- Projects belong to a Workspace and contain Tasks and Documents
- Tasks have an optional Assignee, and can have Subtasks and Comments
- ActivityLog provides an audit trail linking Users, Workspaces, Projects, and Tasks

---

## 📄 License

This project is for educational/assignment purposes.

# CampusHub — Frontend Documentation (`frontend.md`)

Welcome to the comprehensive technical documentation for the **CampusHub** frontend application. This document details the architecture, design system, component hierarchy, role-based access control, routing structure, state management, data schemas, and guidelines for future backend API integration.

---

## 1. Project Overview & Architecture

**CampusHub** is a single-page web application (SPA) designed to unify university student life, student-led organizations, and administrative operations into a single platform.

### Core Technology Stack
- **Framework & Core**: [React 18+](https://react.dev/) with Functional Components and Hooks.
- **Build Tooling & Dev Server**: [Vite](https://vitejs.dev/) with `@vitejs/plugin-react`.
- **Routing**: [React Router v6](https://reactrouter.com/) (`react-router-dom`) supporting nested layouts, dynamic URL parameters, and route guards.
- **Icons**: [Lucide React](https://lucide.dev/) (`lucide-react`) for iconography.
- **Styling & Design System**: Custom modern dark-mode CSS design system paired with [Tailwind CSS](https://tailwindcss.com/) utilities, featuring glassmorphism, fluid typography, dark charcoal backdrops, amber accents, and responsive layout grids.
- **State Management**: React Context API (`AuthContext`, `ToastContext`) + localized component state with persistence via browser `localStorage`.

---

## 2. Directory & File Structure

```
d:/CampusHub/Frontend/
├── index.html                     # Main HTML entry point (viewport, theme meta, font setup)
├── package.json                   # Project dependencies and npm scripts
├── postcss.config.js              # PostCSS configuration for Tailwind & Autoprefixer
├── tailwind.config.js             # Tailwind theme extensions, custom colors, and typography
├── vite.config.js                 # Vite development & build configuration
└── src/
    ├── App.jsx                    # Root application component rendering AppRoutes
    ├── main.jsx                   # React DOM bootstrap mounting providers (Router, Auth, Toast)
    ├── index.css                  # Global design system, CSS variables, tokens, layout & animations
    ├── components/
    │   ├── clubs/
    │   │   ├── ClubCard.jsx       # Card displaying club badge, initials avatar, member count & link
    │   │   └── ClubGrid.jsx       # Responsive grid for club cards with empty state fallback
    │   ├── common/
    │   │   ├── Avatar.jsx         # User/Club avatar with custom colors and initials fallback
    │   │   ├── Badge.jsx          # Semantic status/category pill (amber, green, neutral tones)
    │   │   ├── Button.jsx         # Styled button supporting primary, secondary, and ghost variants
    │   │   ├── ConfirmDialog.jsx  # Accessible confirmation modal for destructive or key actions
    │   │   ├── EmptyState.jsx     # Visual fallback when search or lists return zero results
    │   │   ├── Input.jsx          # Form field with label, error handling, and accessible aria-tags
    │   │   ├── LoadingState.jsx   # Animated loading spinner with message indicator
    │   │   ├── Modal.jsx          # Accessible dialog with ESC key listener and focus trapping
    │   │   ├── SearchBar.jsx      # Input with search icon and clear trigger
    │   │   └── Toast.jsx          # Context provider & floating notification banner container
    │   ├── dashboard/
    │   │   └── StatCard.jsx       # Metric card with icon, key figure, label, and trend detail
    │   ├── events/
    │   │   ├── EventCard.jsx      # Event item card with calendar block, category, venue, and save button
    │   │   └── EventGrid.jsx      # Multi-column grid for event listings with empty state
    │   ├── layout/
    │   │   ├── DashboardLayout.jsx# Role-aware sidebar, header, quick command bar (⌘K), and breadcrumb shell
    │   │   ├── Footer.jsx         # Public footer with navigation links and copyright
    │   │   ├── GlobalSearch.jsx   # ⌘K / Ctrl+K instant campus search modal across events, clubs & notices
    │   │   ├── Logo.jsx           # CampusHub brand mark and logotype
    │   │   ├── Navbar.jsx         # Public responsive header with mobile drawer navigation
    │   │   └── PageHeader.jsx     # Standardized dashboard header with eyebrow, title, and action slots
    │   └── notices/
    │       ├── NoticeCard.jsx     # Notice item card with importance tag and date stamp
    │       └── NoticeList.jsx     # Vertical stack of notice items
    ├── context/
    │   └── AuthContext.jsx        # Authentication state, login, logout, and localStorage syncing
    ├── data/
    │   └── mockData.js            # Initial mock database for events, clubs, notices, users, and credentials
    ├── hooks/
    │   └── useAuth.js             # Custom hook to consume AuthContext
    ├── pages/
    │   ├── NotFound.jsx           # 404 Not Found & 403 Unauthorized error boundary views
    │   ├── admin/
    │   │   └── AdminPages.jsx     # Admin Dashboard, Users, Clubs, Events, Notices, Approvals, Settings
    │   ├── club/
    │   │   └── ClubPages.jsx      # Club Dashboard, Profile Edit, Events List, Create Event, Announcements, Members
    │   ├── public/
    │   │   ├── AuthPages.jsx      # Login (with instant demo-switcher), Register, and Forgot Password
    │   │   ├── Landing.jsx        # High-conversion public homepage with live dashboard mock preview
    │   │   └── PublicBrowse.jsx   # Public listing views for /events, /clubs, and /notices
    │   └── student/
    │       └── StudentPages.jsx   # Student Dashboard, Events Browse/Detail, Clubs Browse/Detail, Notices, Profile, Notifications, Settings
    └── routes/
        └── AppRoutes.jsx          # Complete route definitions, Route Guards, and nested route hierarchies
```

---

## 3. Role-Based Access Control (RBAC) & Routing

### User Roles
The application supports three distinct user roles:
1. **`student`**: University student exploring events, joining clubs, saving activities, receiving notifications, and viewing campus notices.
2. **`club`**: Club organizer / student executive managing club profiles, drafting/publishing events, posting announcements, and managing member rosters.
3. **`admin`**: University administration / Office of Student Affairs approving clubs/events, monitoring user accounts, publishing official university notices, and viewing analytics.

### Route Guard Implementation
The `Guard` component in `AppRoutes.jsx` ensures:
- Loading screen during auth hydration from `localStorage`.
- Unauthenticated users are redirected to `/login` with location state preserved (`state: { from: loc }`).
- Authenticated users attempting to access unauthorized role workspaces are routed to `/unauthorized`.

```jsx
function Guard({ role, children }) {
  const { user, ready } = useAuth()
  const loc = useLocation()
  
  if (!ready) return <div className="app-loading"><span></span><p>Preparing CampusHub…</p></div>
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />
  if (user.role !== role) return <Navigate to="/unauthorized" replace />
  
  return children
}
```

### Route Map

| Path | Access | Component | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | Public | `Landing` | Homepage & marketing showcase |
| `/login` | Public | `Login` | Role-based one-click demo login & authentication |
| `/register` | Public | `Register` | Student / Organization registration form |
| `/forgot-password` | Public | `ForgotPassword` | Password recovery workflow simulation |
| `/events` | Public | `PublicBrowse` (type="events") | Public event exploration |
| `/events/:id` | Public | `PublicDetail` (type="event") | Public event detail view |
| `/clubs` | Public | `PublicBrowse` (type="clubs") | Public club directory |
| `/clubs/:id` | Public | `PublicDetail` (type="club") | Public club profile & event listings |
| `/notices` | Public | `PublicBrowse` (type="notices") | Public university bulletin board |
| `/student/dashboard` | Student | `StudentDashboard` | Student overview, next event, quick actions, stats |
| `/student/events` | Student | `StudentEvents` | Filterable event catalog (categories, search, save) |
| `/student/events/:id` | Student | `StudentEventDetails` | Event registration modal & interactive bookmarking |
| `/student/clubs` | Student | `StudentClubs` | Filterable student club directory |
| `/student/clubs/:id` | Student | `StudentClubDetails` | Club profile, member count, announcements & join action |
| `/student/notices` | Student | `StudentNotices` | Filtered notices (Academic, General, Club, Important) |
| `/student/profile` | Student | `StudentProfile` | Student identity, department, student ID & activity |
| `/student/notifications` | Student | `StudentNotifications` | Notification center with mark-as-read actions |
| `/student/settings` | Student | `StudentSettings` | Privacy, notification, and profile preferences |
| `/club/dashboard` | Club | `ClubDashboard` | Analytics, registration chart, quick actions, event feed |
| `/club/profile` | Club | `ClubProfile` | Organization profile editor & profile completeness score |
| `/club/events` | Club | `ClubEvents` | Event management table (View, Edit, Delete, Statuses) |
| `/club/events/create` | Club | `CreateEvent` | Event publishing suite (Date, Time, Banner, Validation) |
| `/club/announcements` | Club | `ClubAnnouncements` | Post updates with priority tags & view history |
| `/club/members` | Club | `ClubMembers` | Member directory with role filters (President, Exec, Member) |
| `/club/settings` | Club | `ClubSettings` | Organization notification and permission preferences |
| `/admin/dashboard` | Admin | `AdminDashboard` | Platform analytics, registration SVG chart, review queue |
| `/admin/users` | Admin | `AdminUsers` | User table with status toggling (Activate / Suspend) |
| `/admin/clubs` | Admin | `AdminClubs` | Club verification, status tracking, and suspension |
| `/admin/events` | Admin | `AdminEvents` | Event moderation, approval, and deletion |
| `/admin/notices` | Admin | `AdminNotices` | Official notice creator, editor, and manager |
| `/admin/approvals` | Admin | `AdminApprovals` | Unified review queue for pending clubs, events & notices |
| `/admin/settings` | Admin | `AdminSettings` | Security, maintenance mode, and report configurations |
| `/unauthorized` | Any | `Unauthorized` | 403 Access Denied error screen |
| `*` | Any | `NotFound` | 404 Page Not Found error screen |

---

## 4. State Management & Contexts

### 1. `AuthContext` (`src/context/AuthContext.jsx`)
- **State**:
  - `user`: `{ email: string, role: 'student' | 'club' | 'admin', name: string } | null`
  - `ready`: Boolean indicating if authentication state has been hydrated from `localStorage`.
- **Methods**:
  - `login({ email, password, role })`: Validates against pre-configured mock credentials and persists user in `localStorage['campushub-user']`.
  - `logout()`: Clears `localStorage` and resets user state to `null`.
- **Pre-Configured Demo Credentials**:
  - Student: `student@campushub.local` / `student123`
  - Club: `club@campushub.local` / `club123`
  - Admin: `admin@campushub.com` / `admincampushub`

### 2. `ToastContext` (`src/components/common/Toast.jsx`)
- **State**: List of active toast objects `{ id, message }`.
- **Methods**:
  - `toast(message)`: Spawns an accessible, auto-dismissing notification that automatically clears after 3,200ms or on user dismiss.
- **Usage**: Accessible across any page via `useToast()` hook.

### 3. Global Command Search (`src/components/layout/GlobalSearch.jsx`)
- Activated with `⌘ K` (Mac) or `Ctrl + K` (Windows/Linux) or by clicking the header search bar.
- Queries across **Events**, **Clubs**, and **Notices** in real-time and navigates directly to the target record.

---

## 5. UI Design System & Styling Architecture

The frontend styling in `src/index.css` is structured around modern CSS tokens and modern design principles:

### 1. CSS Custom Properties / Tokens
- **Backgrounds**: `--background: #0A0A0F` (Dark Obsidian), `--background-alt: #12121A`, `--card: rgba(26, 26, 36, 0.7)` (Glassmorphism backdrop).
- **Borders**: `--border: rgba(255, 255, 255, 0.08)`, `--border-focus: rgba(245, 158, 11, 0.4)`.
- **Brand Accent**: `--accent: #F59E0B` (Vibrant Warm Amber), `--accent-hover: #D97706`.
- **Typography**: 
  - Sans: `Inter, system-ui, sans-serif`
  - Display / Eyebrows: `Space Grotesk, sans-serif`
  - Monospace / Dates: `JetBrains Mono, monospace`
- **Transitions**: Smooth bezier curves (`180ms - 240ms cubic-bezier(0.16, 1, 0.3, 1)`).

### 2. Key Reusable Components
- **`Button`**: Supports `.btn-primary` (Amber fill), `.btn-secondary` (Subtle bordered surface), and `.btn-ghost` (Transparent interactive).
- **`Badge`**: Supports `.badge-amber`, `.badge-green`, and `.badge-neutral` for categorizing content and statuses.
- **`Modal` & `ConfirmDialog`**: Fully keyboard-accessible modals with backdrop click dismiss and scroll locking.
- **`Avatar`**: Generates initials badges with deterministic or custom background gradients.
- **`StatCard`**: Visual metrics displaying numeric totals, icons, and period comparison trends.

---

## 6. Mock Data Schema (`src/data/mockData.js`)

### Event Object
```typescript
interface Event {
  id: string;               // e.g. "ai-workshop"
  day: string;              // e.g. "25"
  month: string;            // e.g. "AUG"
  title: string;            // Event title
  organizer: string;        // Club / Organising body name
  date: string;             // Formatted date string
  time: string;             // Start time
  location: string;         // Room / Venue name
  category: string;         // "Technology" | "Competition" | "Workshop" | "Cultural" | "Sports" | "Career"
  description: string;      // Detailed event synopsis
  registrations: number;    // Current participant count
  status: 'Published' | 'Draft' | 'Pending';
}
```

### Club Object
```typescript
interface Club {
  id: string;               // e.g. "ieee-cs"
  name: string;             // Full club name
  initials: string;         // 2-letter abbreviation for avatar
  category: string;         // Primary discipline / focus
  members: number;          // Total registered student members
  established: number;      // Founding year
  description: string;      // Mission statement & summary
  accent: string;           // Hex color token for branding
}
```

### Notice Object
```typescript
interface Notice {
  id: number;               // Unique ID
  title: string;            // Notice headline
  category: string;         // "Academic" | "General" | "Club" | "Important" | "Event"
  date: string;             // Publish date
  description: string;      // Body text
  important?: boolean;      // Highlight flag
}
```

---

## 7. Running & Building the Application

Ensure you are inside the `Frontend` directory (`d:/CampusHub/Frontend`):

### Development Server
```bash
npm run dev
```
Starts the Vite local development server (default: `http://localhost:5173`).

### Production Build
```bash
npm run build
```
Generates an optimized, minified production build inside the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```
Spawns a local web server to preview the built `dist/` assets.

---

## 8. Backend API Integration Roadmap

To transition CampusHub from client-side mock data to a production backend (Node.js/Express, Django, Go, Spring, or FastAPI), replace `src/data/mockData.js` and local handlers with standard RESTful or GraphQL endpoints:

### Recommended Endpoints

#### Authentication & User
- `POST /api/auth/login` → Returns JWT / Session cookie + user profile `{ id, email, role, name }`.
- `POST /api/auth/register` → Register new student or organization account.
- `POST /api/auth/logout` → Invalidate token/session.
- `GET /api/user/profile` → Current authenticated user details & registered activities.
- `PUT /api/user/profile` → Update student profile info.

#### Events
- `GET /api/events` → Query events with filters (`?category=...&search=...&status=Published`).
- `GET /api/events/:id` → Single event details.
- `POST /api/events` → Create new event (Club / Admin).
- `PUT /api/events/:id` → Update existing event.
- `DELETE /api/events/:id` → Remove event.
- `POST /api/events/:id/register` → Register current student for event.
- `POST /api/events/:id/save` → Toggle bookmark in student's saved list.

#### Clubs
- `GET /api/clubs` → List all registered clubs.
- `GET /api/clubs/:id` → Club profile, announcements, upcoming events, and leadership.
- `PUT /api/clubs/:id` → Update club info (Club Leader / Admin).
- `POST /api/clubs/:id/join` → Join club request / instant membership.
- `GET /api/clubs/:id/members` → Fetch club membership list.

#### Notices & Announcements
- `GET /api/notices` → Fetch public and academic announcements.
- `POST /api/notices` → Post new university notice (Admin) or club announcement (Club).
- `PUT /api/notices/:id` → Edit notice.
- `DELETE /api/notices/:id` → Delete notice.

#### Admin Moderation & Queue
- `GET /api/admin/metrics` → Dashboard counts & registration volume time-series.
- `GET /api/admin/approvals` → Pending queue of clubs, events, and announcements.
- `POST /api/admin/approvals/:id/approve` → Approve submission.
- `POST /api/admin/approvals/:id/reject` → Reject submission.
- `PATCH /api/admin/users/:id/status` → Update user status (`Active` / `Suspended`).

---
*CampusHub Frontend Documentation — Created for seamless maintenance and full-stack expansion.*

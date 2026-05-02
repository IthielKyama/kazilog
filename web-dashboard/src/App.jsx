import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { MapPin, Users, CheckSquare, LayoutDashboard, Settings, ArrowRight, ClipboardList, GraduationCap, Building2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

import AdminDashboard from './pages/AdminDashboard';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AssessorDashboard from './pages/AssessorDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ForceChangePassword from './pages/ForceChangePassword';
import { api, buildAuthConfig, extractApiError } from './lib/api';

function SurfaceCard({ children, className = '' }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function Navbar() {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const navLinkClass = (path) => {
    const active = location.pathname === path;
    return `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
            <MapPin size={22} />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-900">KaziLog</div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Attachment Workflow</div>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/" className={navLinkClass('/')}>
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          {user?.role === 'supervisor' && (
            <Link to="/reviews" className={navLinkClass('/reviews')}>
              <CheckSquare size={16} /> Reviews
            </Link>
          )}
          {user?.role === 'assessor' && (
            <Link to="/students" className={navLinkClass('/students')}>
              <Users size={16} /> Students
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className={navLinkClass('/admin')}>
              <Settings size={16} /> Admin Setup
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="hidden text-right sm:block">
                <div className="text-sm font-bold text-slate-900">{user.name}</div>
                <div className="text-xs capitalize text-slate-500">{user.role}</div>
              </div>
              <button
                onClick={() => logout()}
                className="rounded-full px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function RoleRoute({ allowedRoles, children }) {
  const user = useAuthStore(state => state.user);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function DashboardAction({ to, icon: Icon, title, description, badge }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Icon size={22} />
        </div>
        {badge ? (
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">{badge}</span>
        ) : null}
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand">
        Open <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function SupervisorHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Supervisor Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Review student submissions week by week, leave comments, and keep approvals moving without losing context.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardAction
          to="/reviews"
          icon={ClipboardList}
          title="Weekly Log Reviews"
          description="Filter by status, student, and week to focus on one review window at a time."
          badge="Primary workflow"
        />
        <SurfaceCard className="p-6 lg:col-span-2">
          <div className="flex items-center gap-3 text-slate-900">
            <CheckSquare className="text-brand" size={20} />
            <h2 className="text-lg font-semibold">Review guidance</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              ['Pending first', 'Start with pending entries so students get feedback before the week ends.'],
              ['Use week filter', 'Narrow the screen to a single attachment week to reduce review fatigue.'],
              ['Comment clearly', 'Leave actionable comments on rejected logs so students know what to improve.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">{title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function AssessorHome() {
  const token = useAuthStore(state => state.token);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get('/assessor/sessions', buildAuthConfig(token));
        setSessions(data.data || []);
      } catch (err) {
        setError(extractApiError(err, 'Failed to load assessor overview.'));
      } finally {
        setLoading(false);
      }
    };

    void fetchSessions();
  }, [token]);

  const summary = useMemo(() => {
    const assignedStudents = sessions.length;
    const activeSessions = sessions.filter(session => session.isActive).length;
    const completedSessions = sessions.filter(session => !session.isActive).length;
    const gradingPending = sessions.filter(session => session.finalGrade === 'Pending').length;

    return { assignedStudents, activeSessions, completedSessions, gradingPending };
  }, [sessions]);

  const spotlight = sessions.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Assessor Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor assigned students, identify grading backlog quickly, and open the student page with one focused workflow.
          </p>
        </div>
        <Link
          to="/students"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Open Student Reviews <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Assigned Students', summary.assignedStudents, 'Students currently attached to you.'],
          ['Active Sessions', summary.activeSessions, 'Students still in the field and still logging.'],
          ['Completed Sessions', summary.completedSessions, 'Students whose attachment sessions are finished.'],
          ['Grades Pending', summary.gradingPending, 'Sessions still waiting for a final assessor grade.'],
        ].map(([label, value, hint]) => (
          <SurfaceCard key={label} className="p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
          </SurfaceCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard className="p-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-brand" size={20} />
            <h2 className="text-lg font-semibold text-slate-900">Student Spotlight</h2>
          </div>
          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading assigned students...</p>
          ) : error ? (
            <p className="mt-6 text-sm text-rose-600">{error}</p>
          ) : spotlight.length ? (
            <div className="mt-5 space-y-4">
              {spotlight.map((session) => (
                <div key={session._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">{session.student?.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{session.student?.registrationNumber || 'No registration number'}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${session.finalGrade === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {session.finalGrade}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Company</div>
                      <div className="mt-1 text-sm text-slate-700">{session.company?.name}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Logs</div>
                      <div className="mt-1 text-sm text-slate-700">{session.stats.approvedLogs} approved / {session.stats.totalLogs} total</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Session</div>
                      <div className="mt-1 text-sm text-slate-700">{session.isActive ? 'Active' : 'Completed'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">No students are currently assigned to you.</p>
          )}
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <div className="flex items-center gap-3">
            <Users className="text-brand" size={20} />
            <h2 className="text-lg font-semibold text-slate-900">Recommended workflow</h2>
          </div>
          <div className="mt-5 space-y-4">
            {[
              'Open the student page to scan grading backlog first.',
              'Use the log modal week filter to review one week at a time.',
              'Assign final grades without losing access to full log history.',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function AdminHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Keep the platform setup clean and operational by focusing on users, companies, and attachment sessions in one place.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardAction
          to="/admin"
          icon={Settings}
          title="Admin Setup"
          description="Create companies, register users, and assign attachment sessions without leaving the setup workspace."
          badge="Setup only"
        />
        <SurfaceCard className="p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <Building2 className="text-brand" size={20} />
            <h2 className="text-lg font-semibold text-slate-900">Setup checklist</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['Register companies', 'Capture the workplace location and approved radius before students begin logging.'],
              ['Create user accounts', 'Register students, supervisors, and assessors with the correct role and contact details.'],
              ['Assign sessions', 'Connect each student to one company, one supervisor, and one assessor for the attachment window.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">{title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function DashboardHome() {
  const user = useAuthStore(state => state.user);

  if (user?.role === 'assessor') {
    return <AssessorHome />;
  }

  if (user?.role === 'supervisor') {
    return <SupervisorHome />;
  }

  return <AdminHome />;
}

function AppContent() {
  const user = useAuthStore(state => state.user);

  if (user?.mustChangePassword) {
    return (
      <div className="min-h-screen">
        <Routes>
          <Route path="/change-password" element={<ForceChangePassword />} />
          <Route path="*" element={<Navigate to="/change-password" replace />} />
        </Routes>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/change-password" element={<Navigate to="/" replace />} />
          <Route path="/admin" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>} />
          <Route path="/reviews" element={<RoleRoute allowedRoles={['supervisor']}><SupervisorDashboard /></RoleRoute>} />
          <Route path="/students" element={<RoleRoute allowedRoles={['assessor']}><AssessorDashboard /></RoleRoute>} />
          <Route path="*" element={<DashboardHome />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="bottom-right" reverseOrder={false} />
      <AppContent />
    </Router>
  );
}

export default App;

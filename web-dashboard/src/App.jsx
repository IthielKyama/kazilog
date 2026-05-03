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
  return <div className={`rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-xl shadow-slate-200/40 ${className}`}>{children}</div>;
}

function Navbar() {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const navLinkClass = (path) => {
    const active = location.pathname === path;
    return `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
      active ? 'bg-brand/10 text-brand shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/20">
            <MapPin size={20} />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900">KaziLog</div>
          </div>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {user?.role === 'supervisor' && (
            <>
              <Link to="/" className={navLinkClass('/')}>
                <LayoutDashboard size={16} /> Overview
              </Link>
              <Link to="/reviews" className={navLinkClass('/reviews')}>
                <CheckSquare size={16} /> Reviews
              </Link>
            </>
          )}
          {user?.role === 'assessor' && (
            <>
              <Link to="/" className={navLinkClass('/')}>
                <LayoutDashboard size={16} /> Overview
              </Link>
              <Link to="/students" className={navLinkClass('/students')}>
                <ClipboardList size={16} /> Student Reviews
              </Link>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <Link to="/" className={navLinkClass('/')}>
                <LayoutDashboard size={16} /> Overview
              </Link>
              <Link to="/companies" className={navLinkClass('/companies')}>
                <Building2 size={16} /> Companies
              </Link>
              <Link to="/users" className={navLinkClass('/users')}>
                <Users size={16} /> Users
              </Link>
              <Link to="/sessions" className={navLinkClass('/sessions')}>
                <Settings size={16} /> Attachment Sessions
              </Link>
            </>
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
      className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-110 group-hover:bg-brand group-hover:text-white shadow-sm">
            <Icon size={24} />
          </div>
          {badge ? (
            <span className="rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">{badge}</span>
          ) : null}
        </div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-brand">
          Open Workspace <ArrowRight size={16} className="transition-transform group-hover:translate-x-1.5" />
        </div>
      </div>
    </Link>
  );
}

function SupervisorHome() {
  const token = useAuthStore(state => state.token);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get('/logs/supervisor?status=All', buildAuthConfig(token));
        setLogs(data.data || []);
      } catch (err) {
        setError(extractApiError(err, 'Failed to load supervisor overview.'));
      } finally {
        setLoading(false);
      }
    };

    void fetchLogs();
  }, [token]);

  const summary = useMemo(() => {
    const totalLogs = logs.length;
    const pendingLogs = logs.filter(log => log.supervisorStatus === 'Pending').length;
    const approvedLogs = logs.filter(log => log.supervisorStatus === 'Approved').length;
    
    const studentSet = new Set();
    logs.forEach(log => {
      if (log.student?._id) studentSet.add(log.student._id);
    });
    const totalStudents = studentSet.size;

    return { totalLogs, pendingLogs, approvedLogs, totalStudents };
  }, [logs]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Supervisor Overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor student log submissions, track pending reviews, and keep approvals moving.
          </p>
        </div>
        <Link
          to="/reviews"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5"
        >
          Open Reviews <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Assigned Students', summary.totalStudents, 'Students logging under your supervision.'],
          ['Total Logs', summary.totalLogs, 'Total logbook entries submitted so far.'],
          ['Pending Reviews', summary.pendingLogs, 'Logs awaiting your approval or rejection.'],
          ['Approved Logs', summary.approvedLogs, 'Logs you have successfully approved.'],
        ].map(([label, value, hint]) => (
          <SurfaceCard key={label} className="p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
          </SurfaceCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SurfaceCard className="p-6 lg:col-span-3">
          <div className="flex items-center gap-3 text-slate-900">
            <CheckSquare className="text-brand" size={20} />
            <h2 className="text-lg font-semibold">Review guidance</h2>
          </div>
          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading supervisor overview...</p>
          ) : error ? (
            <p className="mt-6 text-sm text-rose-600">{error}</p>
          ) : (
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
          )}
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

  const gradingQueue = useMemo(() => (
    sessions
      .filter((session) => session.finalGrade === 'Pending')
      .sort((left, right) => {
        if (left.isActive !== right.isActive) {
          return Number(right.isActive) - Number(left.isActive);
        }

        return (right.stats?.approvedLogs || 0) - (left.stats?.approvedLogs || 0);
      })
      .slice(0, 4)
  ), [sessions]);

  const coverage = useMemo(() => {
    const companies = new Set();
    let approvedLogs = 0;
    let totalLogs = 0;

    sessions.forEach((session) => {
      if (session.company?.name) {
        companies.add(session.company.name);
      }

      approvedLogs += session.stats?.approvedLogs || 0;
      totalLogs += session.stats?.totalLogs || 0;
    });

    return {
      companies: companies.size,
      approvedLogs,
      totalLogs,
      completionRate: totalLogs ? Math.round((approvedLogs / totalLogs) * 100) : 0,
    };
  }, [sessions]);

  const recentlyCompleted = useMemo(() => (
    sessions
      .filter((session) => !session.isActive)
      .slice(0, 3)
  ), [sessions]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Assessor Overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor assigned students, keep an eye on grading backlog, and jump into student reviews only when you need the full grading workspace.
          </p>
        </div>
        <Link
          to="/students"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5"
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
            <h2 className="text-lg font-semibold text-slate-900">Priority grading queue</h2>
          </div>
          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading assigned students...</p>
          ) : error ? (
            <p className="mt-6 text-sm text-rose-600">{error}</p>
          ) : gradingQueue.length ? (
            <div className="mt-5 space-y-4">
              {gradingQueue.map((session) => (
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
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Next focus</div>
                      <div className="mt-1 text-sm text-slate-700">{session.isActive ? 'Track progress before grading' : 'Ready for final grade'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">No sessions are currently waiting for a final grade.</p>
          )}
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <div className="flex items-center gap-3">
            <Users className="text-brand" size={20} />
            <h2 className="text-lg font-semibold text-slate-900">Coverage snapshot</h2>
          </div>
          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading assessor coverage...</p>
          ) : error ? (
            <p className="mt-6 text-sm text-rose-600">{error}</p>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Companies Covered</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{coverage.companies}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">Distinct workplaces across your current assignment load.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Approved Log Progress</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{coverage.approvedLogs} / {coverage.totalLogs}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{coverage.completionRate}% of all visible logs have already cleared supervisor review.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recently Completed</div>
                {recentlyCompleted.length ? (
                  <div className="mt-3 space-y-2">
                    {recentlyCompleted.map((session) => (
                      <div key={session._id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">{session.student?.name}</div>
                          <div className="truncate text-xs text-slate-500">{session.company?.name}</div>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {session.finalGrade}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-500">Completed sessions will appear here after final grading.</p>
                )}
              </div>
            </div>
          )}
        </SurfaceCard>
      </div>

      <SurfaceCard className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recommended assessor workflow</h2>
            <p className="mt-1 text-sm text-slate-500">Keep the overview for triage, then use the student review tab only for detailed review and grading.</p>
          </div>
          <Link
            to="/students"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
          >
            Go To Student Reviews <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ['Start with pending grades', 'Use the queue above to spot sessions that still need a final decision.'],
            ['Review one week at a time', 'Open a student record and use the weekly log modal to stay focused.'],
            ['Grade without losing history', 'Completed sessions remain visible in the student reviews tab after grading.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </SurfaceCard>
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

  return <AdminDashboard activeTab="overview" />;
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
    <div className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-light/30 via-slate-50 to-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/change-password" element={<Navigate to="/" replace />} />
          <Route path="/companies" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard activeTab="companies" /></RoleRoute>} />
          <Route path="/users" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard activeTab="users" /></RoleRoute>} />
          <Route path="/sessions" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard activeTab="sessions" /></RoleRoute>} />
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

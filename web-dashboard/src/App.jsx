import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { MapPin, Users, CheckSquare, LayoutDashboard, Settings, Shield } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import AdminDashboard from './pages/AdminDashboard';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AssessorDashboard from './pages/AssessorDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ForceChangePassword from './pages/ForceChangePassword';

function Navbar() {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  
  // A helper function to apply an active style if the link matches the current path
  const navLinkClass = (path) => {
    const base = "font-medium flex items-center gap-2 transition-colors py-2 border-b-2 ";
    return location.pathname === path 
      ? base + "border-brand text-brand" 
      : base + "border-transparent text-slate-600 hover:text-brand";
  };

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand rounded-lg text-white">
              <MapPin size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">KaziLog</span>
          </div>
          
          <div className="hidden md:flex space-x-8 h-full items-center">
            <Link to="/" className={navLinkClass('/')}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            {['supervisor', 'admin'].includes(user?.role) && (
              <Link to="/reviews" className={navLinkClass('/reviews')}>
                <CheckSquare size={18} /> {user?.role === 'admin' ? 'Supervisor View' : 'Reviews'}
              </Link>
            )}
            {['assessor', 'admin'].includes(user?.role) && (
              <Link to="/students" className={navLinkClass('/students')}>
                <Users size={18} /> {user?.role === 'admin' ? 'Assessor View' : 'Students'}
              </Link>
            )}
            {['admin', 'supervisor', 'assessor'].includes(user?.role) && (
              <Link to="/admin" className={navLinkClass('/admin')}>
                <Settings size={18} /> Admin Setup
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                </div>
                <button 
                  onClick={() => logout()}
                  className="text-sm font-medium text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
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

function DashboardPlaceholder() {
  const user = useAuthStore(state => state.user);

  const actions = [
    {
      to: '/admin',
      title: user?.role === 'admin' ? 'System Setup' : 'Admin Setup',
      description: 'Manage users, companies, and attachment sessions.',
      icon: Settings,
      visible: ['admin', 'supervisor', 'assessor'].includes(user?.role),
    },
    {
      to: '/reviews',
      title: user?.role === 'admin' ? 'Supervisor Workflow Preview' : 'Review Student Logs',
      description: user?.role === 'admin'
        ? 'Open the supervisor experience exactly as a reviewer would see it during development.'
        : 'Approve or reject student daily log submissions.',
      icon: CheckSquare,
      visible: ['admin', 'supervisor'].includes(user?.role),
    },
    {
      to: '/students',
      title: user?.role === 'admin' ? 'Assessor Workflow Preview' : 'Track Assigned Students',
      description: user?.role === 'admin'
        ? 'Open the assessor experience and verify grading flows without changing accounts.'
        : 'Inspect approved logs and submit final grades.',
      icon: Users,
      visible: ['admin', 'assessor'].includes(user?.role),
    },
  ].filter(action => action.visible);

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Welcome to KaziLog</h1>
        <p className="text-slate-500 mt-2">Your central dashboard for managing industrial attachments.</p>
      </div>
      
      {user?.role === 'admin' && (
        <div className="mb-6 rounded-xl border border-brand/20 bg-brand/5 p-4 flex items-start gap-3">
          <Shield size={20} className="text-brand mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Development cross-role access is enabled.</p>
            <p className="text-sm text-slate-600 mt-1">
              You can open the supervisor and assessor protected views from this dashboard without switching accounts.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.to}
              to={action.to}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-brand/20 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">
                <Icon size={22} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{action.title}</h2>
              <p className="text-sm text-slate-500 mt-2 leading-6">{action.description}</p>
            </Link>
          );
        })}

        {!actions.length && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center lg:col-span-3">
             <LayoutDashboard size={48} className="mb-4 text-brand/30" />
             <h2 className="text-xl font-medium text-slate-700">Dashboard Overview</h2>
             <p className="text-slate-500 mt-2 text-center max-w-md">Use the navigation bar above to manage companies, review logs, or track student progress based on your role.</p>
          </div>
        )}
      </div>
    </div>
  );
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

  // If not logged in, force them to the Login or Auth pages
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
      <Routes>
        <Route path="/" element={<DashboardPlaceholder />} />
        <Route path="/change-password" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<RoleRoute allowedRoles={['admin', 'supervisor', 'assessor']}><AdminDashboard /></RoleRoute>} />
        <Route path="/reviews" element={<RoleRoute allowedRoles={['admin', 'supervisor']}><SupervisorDashboard /></RoleRoute>} />
        <Route path="/students" element={<RoleRoute allowedRoles={['admin', 'assessor']}><AssessorDashboard /></RoleRoute>} />
        <Route path="*" element={<DashboardPlaceholder />} />
      </Routes>
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

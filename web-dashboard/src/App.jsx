import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { MapPin, Users, CheckSquare, LayoutDashboard, Settings } from 'lucide-react';
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
                <CheckSquare size={18} /> Reviews
              </Link>
            )}
            {['assessor', 'admin'].includes(user?.role) && (
              <Link to="/students" className={navLinkClass('/students')}>
                <Users size={18} /> Students
              </Link>
            )}
            {['admin', 'supervisor', 'assessor'].includes(user?.role) && (
              <Link to="/admin" className={navLinkClass('/admin')}>
                <Settings size={18} /> Admin
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

function DashboardPlaceholder() {
  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Welcome to KaziLog</h1>
        <p className="text-slate-500 mt-2">Your central dashboard for managing industrial attachments.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center">
         <LayoutDashboard size={48} className="mb-4 text-brand/30" />
         <h2 className="text-xl font-medium text-slate-700">Dashboard Overview</h2>
         <p className="text-slate-500 mt-2 text-center max-w-md">Use the navigation bar above to manage companies, review logs, or track student progress based on your role.</p>
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
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/reviews" element={<SupervisorDashboard />} />
        <Route path="/students" element={<AssessorDashboard />} />
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

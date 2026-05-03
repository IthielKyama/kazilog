import { useState } from 'react';
import { Lock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy';
import PasswordField from '../components/PasswordField';
import { api, buildAuthConfig, extractApiError } from '../lib/api';

const getDefaultRoute = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'supervisor') return '/reviews';
  if (role === 'assessor') return '/students';
  return '/';
};

export default function ForceChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from the current password');
      return;
    }

    if (!isStrongPassword(newPassword)) {
      toast.error(PASSWORD_POLICY_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.put(
        '/auth/change-password',
        { currentPassword, newPassword },
        buildAuthConfig(token)
      );

      login(
        {
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          mustChangePassword: data.mustChangePassword,
        },
        data.token
      );

      toast.success('Password updated successfully. Welcome to KaziLog!');
      navigate(getDefaultRoute(data.role), { replace: true });
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to update password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-light/40 via-slate-50 to-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-brand to-brand-dark rounded-2xl shadow-lg shadow-brand/20 text-white">
            <Lock size={24} />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold text-slate-900">
          Change Default Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          For security reasons, please change your default password before continuing.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in duration-700">
        <div className="bg-white/80 backdrop-blur-xl py-10 px-4 shadow-2xl shadow-slate-200/50 border border-slate-200/60 sm:rounded-[2rem] sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand via-brand-light to-brand opacity-80" />
          
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Signed in as <strong>{user?.email}</strong>. {PASSWORD_POLICY_MESSAGE}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <PasswordField
              label="Current Password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />

            <PasswordField
              label="New Password"
              required
              minLength={8}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirm New Password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-brand/20 text-sm font-bold text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? 'Updating...' : 'Update Password & Continue'}
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

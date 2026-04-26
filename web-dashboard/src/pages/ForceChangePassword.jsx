import { useState } from 'react';
import { MapPin, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy';
import PasswordField from '../components/PasswordField';

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
      const { data } = await axios.put(
        'http://localhost:5000/api/auth/change-password',
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
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
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="p-3 bg-brand rounded-xl shadow-sm text-white">
            <MapPin size={32} />
          </div>
          <span className="font-extrabold text-3xl tracking-tight text-slate-900">KaziLog</span>
        </div>
        <h2 className="mt-2 text-center text-2xl font-bold text-slate-900">
          Change your temporary password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Your account was created with a temporary password. Update it now before continuing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in duration-700">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
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
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand transition-colors disabled:opacity-70"
              >
                {loading ? 'Updating password...' : 'Update password'}
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

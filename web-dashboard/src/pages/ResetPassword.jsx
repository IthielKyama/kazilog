import { useState } from 'react';
import { MapPin, Check } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy';
import PasswordField from '../components/PasswordField';
import { api, extractApiError } from '../lib/api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!isStrongPassword(password)) {
      toast.error(PASSWORD_POLICY_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      await api.put(`/auth/resetpassword/${token}`, { password });
      setSuccess(true);
      toast.success('Password reset successfully!', {
        icon: '🎉',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      
      // Auto redirect to login after a few seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      toast.error(extractApiError(error, 'Invalid or expired token'));
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
          Create new password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          {PASSWORD_POLICY_MESSAGE}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in duration-700">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Password Updated!</h3>
              <p className="text-sm text-slate-500 mb-6">
                Your password has been changed successfully. You will be redirected to the login page momentarily.
              </p>
              <Link to="/login" className="text-brand hover:text-brand-dark font-medium">
                Click here to login now
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <PasswordField
                label="New Password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
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

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand transition-colors disabled:opacity-70"
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

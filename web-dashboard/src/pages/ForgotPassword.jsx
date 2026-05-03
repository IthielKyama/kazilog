import { useState } from 'react';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgotpassword', { email });
      setEmailSent(true);
      toast.success('Password reset link sent to your email', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
    } catch (error) {
      toast.error(extractApiError(error, 'Error sending email'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-light/40 via-slate-50 to-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-brand to-brand-dark rounded-2xl shadow-lg shadow-brand/20 text-white">
            <KeyRound size={24} />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold text-slate-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in duration-700">
        <div className="bg-white/80 backdrop-blur-xl py-10 px-4 shadow-2xl shadow-slate-200/50 border border-slate-200/60 sm:rounded-[2rem] sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand via-brand-light to-brand opacity-80" />
          
          {emailSent ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <Mail className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Check your inbox</h3>
              <p className="text-sm text-slate-500 mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
              </p>
              <Link to="/login" className="text-brand hover:text-brand-dark font-medium flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Back to login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand sm:text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-brand/20 text-sm font-bold text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? 'Sending link...' : <><Mail size={18} /> Send reset link</>}
                </button>
              </div>

              <div className="text-center">
                <Link to="/login" className="text-sm text-brand hover:text-brand-dark font-medium">
                  Back to login
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

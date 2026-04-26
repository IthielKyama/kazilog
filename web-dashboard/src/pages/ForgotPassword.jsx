import { useState } from 'react';
import { MapPin, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/forgotpassword', { email });
      setEmailSent(true);
      toast.success('Password reset link sent to your email', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error sending email');
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
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in duration-700">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          
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
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand transition-colors disabled:opacity-70"
                >
                  {loading ? 'Sending link...' : 'Send reset link'}
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

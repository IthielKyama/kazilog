import { useState } from 'react';
import { MapPin, LogIn } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import PasswordField from '../components/PasswordField';
import { api, extractApiError } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      // Store in Zustand
      login({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        mustChangePassword: data.mustChangePassword,
      }, data.token);

      toast.success(`Welcome back, ${data.name}!`, {
        icon: '👋',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });

      // Redirect based on role
      if (data.mustChangePassword) navigate('/change-password');
      else if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'supervisor') navigate('/reviews');
      else navigate('/');

    } catch (error) {
      toast.error(extractApiError(error, 'Invalid email or password'));
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
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in duration-700">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
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
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-brand hover:text-brand-dark transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1">
                <PasswordField
                  label="Password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  showLabel={false}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand transition-colors disabled:opacity-70"
              >
                {loading ? 'Signing in...' : <><LogIn size={18} /> Sign in</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

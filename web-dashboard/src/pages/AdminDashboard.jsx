import { useState, useEffect } from 'react';
import { Building, MapPin, Save, UserPlus, Briefcase, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { api, buildAuthConfig, extractApiError } from '../lib/api';

// --- Custom Select Component (No Browser Defaults) ---
const CustomSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div 
        className="w-full px-4 py-2 border border-slate-300 rounded-lg flex items-center justify-between cursor-pointer bg-white focus-within:ring-2 focus-within:ring-brand focus-within:border-brand transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value ? options.find(o => o.value === value)?.label : placeholder}
        </span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <>
          {/* Invisible backdrop to close dropdown when clicking outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
            {options.map((option) => (
              <div 
                key={option.value}
                className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className={value === option.value ? "font-medium text-brand" : "text-slate-700"}>
                  {option.label}
                </span>
                {value === option.value && <Check size={16} className="text-brand" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('company');
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const token = useAuthStore(state => state.token);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const config = buildAuthConfig(token);
      const [compRes, userRes] = await Promise.all([
        api.get('/admin/companies', config),
        api.get('/admin/users', config)
      ]);
      setCompanies(compRes.data?.data || []);
      setUsers(userRes.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Configuration</h1>
          <p className="text-slate-500 mt-2">Manage companies, users, and attachment sessions.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 flex-wrap">
          <button 
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'company' ? 'border-b-2 border-brand text-brand' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Building size={18} /> Register Company
          </button>
          <button 
            onClick={() => setActiveTab('user')}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'user' ? 'border-b-2 border-brand text-brand' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <UserPlus size={18} /> Register User
          </button>
          <button 
            onClick={() => setActiveTab('session')}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'session' ? 'border-b-2 border-brand text-brand' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Briefcase size={18} /> Create Session
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'company' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <CompanyForm onSuccess={fetchData} />
              <CompanyList companies={companies} loading={loadingData} />
            </div>
          )}
          {activeTab === 'user' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <UserForm onSuccess={fetchData} />
              <UserList users={users} loading={loadingData} />
            </div>
          )}
          {activeTab === 'session' && (
            <SessionForm companies={companies} users={users} onSuccess={fetchData} />
          )}
        </div>
      </div>
    </div>
  );
}

// --- Company Form ---
function CompanyForm({ onSuccess }) {
  const [formData, setFormData] = useState({ name: '', address: '', latitude: '', longitude: '', allowedRadiusMeters: 200 });
  const [loading, setLoading] = useState(false);
  const token = useAuthStore(state => state.token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        allowedRadiusMeters: Number(formData.allowedRadiusMeters)
      };
      
      await api.post('/admin/companies', payload, buildAuthConfig(token));
      toast.success(`${formData.name} has been registered successfully!`, {
        icon: '🏢',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      setFormData({ name: '', address: '', latitude: '', longitude: '', allowedRadiusMeters: 200 });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to register company.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-in fade-in">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Building className="text-brand" /> Add New Company
      </h2>
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
          <input 
            type="text" 
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Safaricom PLC"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Physical Address</label>
          <input 
            type="text" 
            required
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            placeholder="e.g. Waiyaki Way, Nairobi"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin size={16} />
              </div>
              <input 
                type="number" 
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                placeholder="-1.286389"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin size={16} />
              </div>
              <input 
                type="number" 
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                placeholder="36.817223"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Allowed GPS Radius (Meters)</label>
          <input 
            type="number" 
            required
            value={formData.allowedRadiusMeters}
            onChange={(e) => setFormData({...formData, allowedRadiusMeters: parseInt(e.target.value)})}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
          />
          <p className="text-xs text-slate-500 mt-2">
            The maximum distance a student can be from the coordinates to successfully log their attendance.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button 
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-70"
          >
            <Save size={18} /> {loading ? 'Saving...' : 'Save Company'}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- User Form ---
function UserForm({ onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'student', registrationNumber: '' });
  const [loading, setLoading] = useState(false);
  const token = useAuthStore(state => state.token);

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'supervisor', label: 'Industry Supervisor' },
    { value: 'assessor', label: 'School Assessor' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      if (formData.role === 'student') {
        payload.registrationNumber = formData.registrationNumber;
      }

      await api.post('/auth/register', payload, buildAuthConfig(token));
      toast.success(`${formData.name} registered! A temporary password has been emailed to ${formData.email}.`, {
        icon: '📧',
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
        duration: 5000
      });
      setFormData({ name: '', email: '', role: 'student', registrationNumber: '' });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(extractApiError(error, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-in fade-in">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <UserPlus className="text-brand" /> Register New User
      </h2>
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
            />
          </div>
        </div>

        <div className="relative z-20">
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          {/* Custom Select Component replaces native <select> */}
          <CustomSelect 
            options={roleOptions} 
            value={formData.role} 
            onChange={(val) => setFormData({
              ...formData,
              role: val,
              registrationNumber: val === 'student' ? formData.registrationNumber : '',
            })} 
            placeholder="Select a role..."
          />
        </div>

        {formData.role === 'student' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
            <input
              type="text"
              required
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              placeholder="e.g. STU-2026-001"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
            />
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 z-0 relative">
          <button 
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-70"
          >
            <Save size={18} /> {loading ? 'Registering...' : 'Register User'}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Session Form ---
function SessionForm({ companies, users, onSuccess }) {
  const [formData, setFormData] = useState({ 
    student: '', 
    company: '', 
    supervisor: '', 
    assessor: '', 
    startDate: '', 
    endDate: '' 
  });
  const [loading, setLoading] = useState(false);
  const token = useAuthStore(state => state.token);

  const studentOptions = users.filter(u => u.role === 'student').map(u => ({ value: u._id, label: u.name }));
  const supervisorOptions = users.filter(u => u.role === 'supervisor').map(u => ({ value: u._id, label: u.name }));
  const assessorOptions = users.filter(u => u.role === 'assessor').map(u => ({ value: u._id, label: u.name }));
  const companyOptions = companies.map(c => ({ value: c._id, label: c.name }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Ensure no empty IDs are sent
    if (!formData.student || !formData.company || !formData.supervisor || !formData.assessor) {
      toast.error('Please select all user roles and a company.');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select valid start and end dates.');
      return;
    }

    setLoading(true);
    
    try {
      await api.post('/admin/sessions', formData, buildAuthConfig(token));
      toast.success('Session created successfully!', {
        icon: '💼',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      setFormData({ student: '', company: '', supervisor: '', assessor: '', startDate: '', endDate: '' });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to create session.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-in fade-in">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Briefcase className="text-brand" /> Create Attachment Session
      </h2>
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-40">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
            <CustomSelect 
              options={studentOptions} 
              value={formData.student} 
              onChange={(val) => setFormData({...formData, student: val})} 
              placeholder="Select a student..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
            <CustomSelect 
              options={companyOptions} 
              value={formData.company} 
              onChange={(val) => setFormData({...formData, company: val})} 
              placeholder="Select a company..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-30">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Industry Supervisor</label>
            <CustomSelect 
              options={supervisorOptions} 
              value={formData.supervisor} 
              onChange={(val) => setFormData({...formData, supervisor: val})} 
              placeholder="Select a supervisor..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">School Assessor</label>
            <CustomSelect 
              options={assessorOptions} 
              value={formData.assessor} 
              onChange={(val) => setFormData({...formData, assessor: val})} 
              placeholder="Select an assessor..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input 
              type="date" 
              required
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input 
              type="date" 
              required
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 relative z-0">
          <button 
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-70"
          >
            <Save size={18} /> {loading ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- List Components ---
function CompanyList({ companies, loading }) {
  if (loading) return <div className="text-slate-500">Loading companies...</div>;
  if (!companies.length) return <div className="text-slate-500">No companies registered yet.</div>;
  
  return (
    <div className="animate-in fade-in">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        Registered Companies
      </h3>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Address</th>
              <th className="px-6 py-3">Radius</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                <td className="px-6 py-4">{c.address}</td>
                <td className="px-6 py-4">{c.allowedRadiusMeters}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserList({ users, loading }) {
  if (loading) return <div className="text-slate-500">Loading users...</div>;
  if (!users.length) return <div className="text-slate-500">No users registered yet.</div>;
  
  return (
    <div className="animate-in fade-in">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        Registered Users
      </h3>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                <td className="px-6 py-4 capitalize">{u.role}</td>
                <td className="px-6 py-4">{u.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

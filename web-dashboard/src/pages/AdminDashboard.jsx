import React, { useEffect, useMemo, useState } from 'react';
import { Building, MapPin, Save, UserPlus, Briefcase, LayoutDashboard, Users, Building2, ClipboardList, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/authStore';
import { api, buildAuthConfig, extractApiError } from '../lib/api';
import { CustomSelect, StyledDateInput } from '../components/CustomSelect';

function SurfaceCard({ children, className = '' }) {
  return <div className={`rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-xl shadow-slate-200/40 ${className}`}>{children}</div>;
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
    </div>
  );
}

export default function AdminDashboard({ activeTab = 'overview' }) {
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const token = useAuthStore(state => state.token);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const config = buildAuthConfig(token);
      const [compRes, userRes, sessionRes] = await Promise.all([
        api.get('/admin/companies', config),
        api.get('/admin/users', config),
        api.get('/admin/sessions', config),
      ]);
      setCompanies(compRes.data?.data || []);
      setUsers(userRes.data?.data || []);
      setSessions(sessionRes.data?.data || []);
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to fetch dashboard data'));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      void fetchData();
    }
  }, [token]);

  const summary = useMemo(() => ({
    companies: companies.length,
    users: users.length,
    students: users.filter((user) => user.role === 'student').length,
    sessions: sessions.length,
  }), [companies, users, sessions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Setup Workspace</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Configure companies, users, and student attachment sessions without leaving the admin setup area.
        </p>
      </div>



      <SurfaceCard className="p-8">
        {activeTab === 'overview' && (
          <div className="space-y-10">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Total Users" value={summary.users} hint="All registered accounts" />
              <SummaryCard label="Students" value={summary.students} hint="Registered student accounts" />
              <SummaryCard label="Companies" value={summary.companies} hint="Registered workplace locations" />
              <SummaryCard label="Sessions" value={summary.sessions} hint="Configured attachment sessions" />
            </div>
            <SetupGuidance />
          </div>
        )}
        {activeTab === 'companies' && (
          <div className="grid gap-8 xl:grid-cols-2 xl:items-start">
            <CompanyForm onSuccess={fetchData} />
            <CompanyList companies={companies} loading={loadingData} />
          </div>
        )}
        {activeTab === 'users' && (
          <div className="grid gap-8 xl:grid-cols-2 xl:items-start">
            <UserForm onSuccess={fetchData} />
            <UserList users={users} loading={loadingData} />
          </div>
        )}
        {activeTab === 'sessions' && (
          <div className="grid gap-8 xl:grid-cols-2 xl:items-start">
            <SessionForm companies={companies} users={users} onSuccess={fetchData} />
            <SessionList sessions={sessions} loading={loadingData} />
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}

function SetupGuidance() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="text-brand" size={20} />
        <h3 className="text-lg font-semibold text-slate-900">Recommended setup order</h3>
      </div>
      <div className="mt-5 space-y-4">
        {[
          ['1. Register the company', 'Capture the workplace location and allowed radius before the student starts logging.'],
          ['2. Create the user accounts', 'Add the student, supervisor, and assessor with the correct role and contact information.'],
          ['3. Create the session', 'Link the student to one company, one supervisor, and one assessor for the attachment dates.'],
        ].map(([title, description]) => (
          <div key={title} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <Icon className="text-brand" size={20} />
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}

function CompanyForm({ onSuccess }) {
  const [formData, setFormData] = useState({ name: '', address: '', latitude: '', longitude: '', allowedRadiusMeters: '200' });
  const [loading, setLoading] = useState(false);
  const token = useAuthStore(state => state.token);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        allowedRadiusMeters: Number(formData.allowedRadiusMeters),
      };

      await api.post('/admin/companies', payload, buildAuthConfig(token));
      toast.success(`${formData.name} has been registered successfully!`);
      setFormData({ name: '', address: '', latitude: '', longitude: '', allowedRadiusMeters: '200' });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to register company.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <SectionHeading
        icon={Building}
        title="Add New Company"
        description="Save the workplace details and geofence radius students must be inside when submitting logs."
      />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="company-name" className="mb-1 block text-sm font-medium text-slate-700">Company Name</label>
            <input
              id="company-name"
              type="text"
              required
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              placeholder="e.g. Safaricom PLC"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="company-address" className="mb-1 block text-sm font-medium text-slate-700">Physical Address</label>
            <input
              id="company-address"
              type="text"
              required
              value={formData.address}
              onChange={(event) => setFormData({ ...formData, address: event.target.value })}
              placeholder="e.g. Waiyaki Way, Nairobi"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label htmlFor="company-latitude" className="mb-1 block text-sm font-medium text-slate-700">Latitude</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <MapPin size={16} />
              </div>
              <input
                id="company-latitude"
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(event) => setFormData({ ...formData, latitude: event.target.value })}
                placeholder="-1.286389"
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
          <div>
            <label htmlFor="company-longitude" className="mb-1 block text-sm font-medium text-slate-700">Longitude</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <MapPin size={16} />
              </div>
              <input
                id="company-longitude"
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(event) => setFormData({ ...formData, longitude: event.target.value })}
                placeholder="36.817223"
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <label htmlFor="company-radius" className="mb-1 block text-sm font-medium text-slate-700">Allowed GPS Radius (Meters)</label>
          <input
            id="company-radius"
            type="number"
            required
            value={formData.allowedRadiusMeters}
            onChange={(event) => setFormData({ ...formData, allowedRadiusMeters: event.target.value })}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            The maximum distance a student can be from the saved company coordinates when submitting a log.
          </p>
        </div>

        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-70 md:w-auto"
        >
          <Save size={18} /> {loading ? 'Saving...' : 'Save Company'}
        </button>
      </form>
    </div>
  );
}

function UserForm({ onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'student', registrationNumber: '' });
  const [loading, setLoading] = useState(false);
  const token = useAuthStore(state => state.token);

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'supervisor', label: 'Industry Supervisor' },
    { value: 'assessor', label: 'School Assessor' },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      toast.success(`${formData.name} registered successfully.`);
      setFormData({ name: '', email: '', role: 'student', registrationNumber: '' });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(extractApiError(error, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <SectionHeading
        icon={UserPlus}
        title="Register New User"
        description="Create student, supervisor, and assessor accounts with the role-specific information each person needs."
      />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="user-name" className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
            <input
              id="user-name"
              type="text"
              required
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label htmlFor="user-email" className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
            <input
              id="user-email"
              type="email"
              required
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              placeholder="e.g. student@college.ac.ke"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
          <CustomSelect
            options={roleOptions}
            value={formData.role}
            onChange={(value) => setFormData({
              ...formData,
              role: value,
              registrationNumber: value === 'student' ? formData.registrationNumber : '',
            })}
            placeholder="Select a role..."
          />
        </div>

        {formData.role === 'student' && (
          <div>
            <label htmlFor="registration-number" className="mb-1 block text-sm font-medium text-slate-700">Registration Number</label>
            <input
              id="registration-number"
              type="text"
              required
              value={formData.registrationNumber}
              onChange={(event) => setFormData({ ...formData, registrationNumber: event.target.value })}
              placeholder="e.g. STU-2026-001"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </div>
        )}

        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-70 md:w-auto"
        >
          <Save size={18} /> {loading ? 'Registering...' : 'Register User'}
        </button>
      </form>
    </div>
  );
}

function SessionForm({ companies, users, onSuccess }) {
  const [formData, setFormData] = useState({
    student: '',
    company: '',
    supervisor: '',
    assessor: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const token = useAuthStore(state => state.token);

  const studentOptions = users.filter((user) => user.role === 'student').map((user) => ({
    value: user._id,
    label: `${user.name}${user.registrationNumber ? ` (${user.registrationNumber})` : ''}`,
  }));
  const supervisorOptions = users.filter((user) => user.role === 'supervisor').map((user) => ({ value: user._id, label: user.name }));
  const assessorOptions = users.filter((user) => user.role === 'assessor').map((user) => ({ value: user._id, label: user.name }));
  const companyOptions = companies.map((company) => ({ value: company._id, label: company.name }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.student || !formData.company || !formData.supervisor || !formData.assessor) {
      toast.error('Please select a student, company, supervisor, and assessor.');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select valid start and end dates.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/admin/sessions', formData, buildAuthConfig(token));
      toast.success('Session created successfully!');
      setFormData({ student: '', company: '', supervisor: '', assessor: '', startDate: '', endDate: '' });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to create session.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <SectionHeading
        icon={Briefcase}
        title="Create Attachment Session"
        description="Connect one student to the correct company, supervisor, and assessor for the attachment date range."
      />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="session-student" className="mb-1 block text-sm font-medium text-slate-700">Student</label>
            <CustomSelect
              inputId="session-student"
              options={studentOptions}
              value={formData.student}
              onChange={(value) => setFormData({ ...formData, student: value })}
              placeholder="Student"
            />
          </div>
          <div>
            <label htmlFor="session-company" className="mb-1 block text-sm font-medium text-slate-700">Company</label>
            <CustomSelect
              inputId="session-company"
              options={companyOptions}
              value={formData.company}
              onChange={(value) => setFormData({ ...formData, company: value })}
              placeholder="Company"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="session-supervisor" className="mb-1 block text-sm font-medium text-slate-700">Industry Supervisor</label>
            <CustomSelect
              inputId="session-supervisor"
              options={supervisorOptions}
              value={formData.supervisor}
              onChange={(value) => setFormData({ ...formData, supervisor: value })}
              placeholder="Industry Supervisor"
            />
          </div>
          <div>
            <label htmlFor="session-assessor" className="mb-1 block text-sm font-medium text-slate-700">School Assessor</label>
            <CustomSelect
              inputId="session-assessor"
              options={assessorOptions}
              value={formData.assessor}
              onChange={(value) => setFormData({ ...formData, assessor: value })}
              placeholder="School Assessor"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="session-start-date" className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
            <StyledDateInput
              id="session-start-date"
              required
              value={formData.startDate}
              onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="session-end-date" className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
            <StyledDateInput
              id="session-end-date"
              required
              value={formData.endDate}
              onChange={(event) => setFormData({ ...formData, endDate: event.target.value })}
            />
          </div>
        </div>

        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-70 md:w-auto"
        >
          <Save size={18} /> {loading ? 'Creating...' : 'Create Session'}
        </button>
      </form>
    </div>
  );
}

function CompanyList({ companies, loading }) {
  if (loading) return <div className="text-sm text-slate-500">Loading companies...</div>;
  if (!companies.length) return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No companies registered yet.</div>;

  return (
    <div>
      <SectionHeading icon={Building2} title="Registered Companies" description="Saved workplaces students can be attached to for logging." />
      <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500">
            <thead className="border-b border-slate-200/60 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Address</th>
              <th className="px-6 py-3">Radius</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{company.name}</td>
                <td className="px-6 py-4">{company.address}</td>
                <td className="px-6 py-4">{company.allowedRadiusMeters}m</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UserList({ users, loading }) {
  if (loading) return <div className="text-sm text-slate-500">Loading users...</div>;
  if (!users.length) return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No users registered yet.</div>;

  return (
    <div>
      <SectionHeading icon={Users} title="Registered Users" description="Accounts available for session assignment and review workflows." />
      <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500">
            <thead className="border-b border-slate-200/60 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                <td className="px-6 py-4 capitalize">{user.role}</td>
                <td className="px-6 py-4">{user.email}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SessionList({ sessions, loading }) {
  if (loading) return <div className="text-sm text-slate-500">Loading sessions...</div>;
  if (!sessions.length) return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No attachment sessions configured yet.</div>;

  return (
    <div>
      <SectionHeading icon={Briefcase} title="Configured Attachment Sessions" description="Student attachments currently defined in the system." />
      <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm text-slate-500">
            <thead className="border-b border-slate-200/60 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Student Name</th>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Industry Supervisor</th>
              <th className="px-6 py-3">School Assessor</th>
              <th className="px-6 py-3">Date Range</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{session.student?.name || 'Unknown'}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{session.company?.name || 'Unknown'}</td>
                <td className="px-6 py-4">{session.supervisor?.name || 'Unknown'}</td>
                <td className="px-6 py-4">{session.assessor?.name || 'Unknown'}</td>
                <td className="px-6 py-4">
                  {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${session.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {session.isActive ? 'Ongoing' : 'Completed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

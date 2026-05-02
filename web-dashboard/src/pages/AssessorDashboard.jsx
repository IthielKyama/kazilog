import React, { useState, useEffect, useMemo } from 'react';
import { Users, GraduationCap, X, Search, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { api, buildAuthConfig, extractApiError } from '../lib/api';
import { CustomSelect } from '../components/CustomSelect';

const GradeSelect = ({ value, onChange, disabled }) => {
  const gradeOptions = ['Pending', 'A', 'B', 'C', 'D', 'E', 'F'].map((grade) => ({
    value: grade,
    label: grade,
  }));

  return (
    <CustomSelect
      options={gradeOptions}
      value={value}
      onChange={onChange}
      placeholder="Grade"
      disabled={disabled}
      className={disabled ? 'opacity-50' : ''}
      buttonClassName={`${
        value === 'Pending'
          ? 'bg-amber-50 border-amber-200 text-amber-700'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
      }`}
      menuClassName="right-0"
    />
  );
};

const StudentLogsModal = ({ session, onClose, token }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      const fetchLogs = async () => {
        setLoading(true);
        try {
          const { data } = await api.get(`/logs/session/${session._id}`, buildAuthConfig(token));
          setLogs(data.data);
        } catch (error) {
          toast.error(extractApiError(error, 'Failed to fetch logs'));
        } finally {
          setLoading(false);
        }
      };
      void fetchLogs();
    }
  }, [session, token]);

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Logs for {session.student?.name}</h2>
            <p className="text-sm text-slate-500">{session.company?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {loading ? (
            <div className="text-center text-slate-500 py-12">Loading approved logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-slate-500 py-12 bg-white rounded-lg border border-slate-200">No approved logs found.</div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log._id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-sm font-medium text-slate-500">Date: {new Date(log.date).toLocaleDateString()}</div>
                    <div className="flex gap-2 text-xs font-semibold">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">Approved</span>
                      {!log.isWithinBoundary && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200">Geofence Issue</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Tasks Done</h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.tasksDone}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Skills Learned</h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.skillsLearned}</p>
                    </div>
                  </div>
                  {log.supervisorComment && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Supervisor Comment</h4>
                      <p className="text-sm text-slate-600 italic">"{log.supervisorComment}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AssessorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  
  const [selectedSession, setSelectedSession] = useState(null);
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const fetchAssignedSessions = async () => {
      try {
        const { data } = await api.get('/assessor/sessions', buildAuthConfig(token));
        setSessions(data.data);
      } catch (error) {
        toast.error(extractApiError(error, 'Failed to fetch assigned students'));
      } finally {
        setLoading(false);
      }
    };

    void fetchAssignedSessions();
  }, [token]);

  const handleGradeChange = async (sessionId, newGrade) => {
    try {
      await api.put(
        `/assessor/sessions/${sessionId}/grade`,
        { finalGrade: newGrade },
        buildAuthConfig(token)
      );
      
      toast.success(`Grade updated to ${newGrade}`, { icon: '🎓', style: { background: '#333', color: '#fff' } });
      
      // Update local state
      setSessions(sessions.map(s => s._id === sessionId ? { ...s, finalGrade: newGrade, isActive: newGrade === 'Pending' } : s));
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to update grade'));
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch = s.student?.name?.toLowerCase().includes(search.toLowerCase()) || 
                            s.student?.registrationNumber?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : statusFilter === 'Active' ? s.isActive : !s.isActive;
      const matchesCompany = companyFilter === 'All' ? true : s.company?.name === companyFilter;
      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [sessions, search, statusFilter, companyFilter]);

  const uniqueCompanies = useMemo(() => {
    const companies = new Set(sessions.map(s => s.company?.name).filter(Boolean));
    return Array.from(companies);
  }, [sessions]);

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Completed', label: 'Completed' },
  ];

  const companyOptions = [
    { value: 'All', label: 'All Companies' },
    ...uniqueCompanies.map((company) => ({ value: company, label: company })),
  ];

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <GraduationCap className="text-brand" size={32} /> Assessor Dashboard
          </h1>
          <p className="text-slate-500 mt-2">Track the progress of your assigned students and submit final grades.</p>
          {user?.role === 'admin' && (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand mt-3">
              Development preview: assessor workflow
            </p>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-brand outline-none"
            />
          </div>
          <div className="min-w-40">
            <CustomSelect
            options={statusOptions}
            value={statusFilter} 
            onChange={setStatusFilter}
            placeholder="Status"
            buttonClassName="text-sm rounded-md py-2"
          />
          </div>
          <div className="min-w-52">
            <CustomSelect
            options={companyOptions}
            value={companyFilter} 
            onChange={setCompanyFilter}
            placeholder="Company"
            buttonClassName="text-sm rounded-md py-2"
          />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Logbook Progress</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Final Grade</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading student data...</td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <Users size={48} className="mx-auto mb-4 text-slate-300" />
                    No students match your filters.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{session.student?.name}</div>
                          <div className="text-sm text-slate-500">{session.student?.registrationNumber || 'No Reg No.'}</div>
                        </div>
                        <button 
                          onClick={() => setSelectedSession(session)}
                          className="p-1.5 text-brand hover:bg-brand/10 rounded-md transition-colors"
                          title="View Logs"
                          aria-label={`View logs for ${session.student?.name}`}
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{session.company?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-1 max-w-[150px]">
                        <div 
                          className="bg-brand h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, (session.stats.approvedLogs / (session.stats.totalLogs || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {session.stats.approvedLogs} approved / {session.stats.totalLogs} total
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        session.isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {session.isActive ? 'Active' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end">
                      <GradeSelect 
                        value={session.finalGrade} 
                        onChange={(val) => handleGradeChange(session._id, val)} 
                        disabled={!session.isActive && session.finalGrade !== 'Pending'}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StudentLogsModal 
        session={selectedSession} 
        onClose={() => setSelectedSession(null)} 
        token={token} 
      />
    </div>
  );
}

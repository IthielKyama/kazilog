import React, { useState, useEffect } from 'react';
import { CheckSquare, Check, X, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { api, buildAuthConfig, extractApiError } from '../lib/api';
import { CustomSelect } from '../components/CustomSelect';

export default function SupervisorDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [comments, setComments] = useState({});
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);

  const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/logs/supervisor?status=${statusFilter}`, buildAuthConfig(token));
        setLogs(data.data);
      } catch (error) {
        toast.error(extractApiError(error, 'Failed to fetch pending logs'));
      } finally {
        setLoading(false);
      }
    };

    void fetchLogs();
  }, [token, statusFilter]);

  const handleReview = async (logId, status) => {
    try {
      await api.put(`/logs/${logId}/review`, { status, comment: comments[logId] || '' }, buildAuthConfig(token));
      toast.success(`Log ${status}!`, { style: { background: '#333', color: '#fff' } });
      
      // Update the log in local state
      if (statusFilter === 'Pending') {
        setLogs(logs.filter(log => log._id !== logId));
      } else {
        setLogs(logs.map(log => log._id === logId ? { ...log, supervisorStatus: status, supervisorComment: comments[logId] || '' } : log));
      }
      setComments({ ...comments, [logId]: '' });
    } catch (error) {
      toast.error(extractApiError(error, `Failed to ${status.toLowerCase()} log`));
    }
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <CheckSquare className="text-brand" size={32} /> Logbook Reviews
          </h1>
          <p className="text-slate-500 mt-2">Review and manage daily tasks submitted by your attached students.</p>
          {user?.role === 'admin' && (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand mt-3">
              Development preview: supervisor workflow
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Filter by Status:</label>
          <div className="w-44">
            <CustomSelect
            options={statusOptions}
            value={statusFilter} 
            onChange={setStatusFilter}
            placeholder="Select status"
          />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading pending logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <CheckSquare size={48} className="mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-500">All caught up!</p>
            <p className="text-sm">There are no pending logs to review at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {logs.map((log) => (
              <div key={log._id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                  {/* Student Info & GPS */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{log.student?.name || 'Unknown Student'}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <Clock size={14} /> Submitted: {new Date(log.date).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Badges */}
                      <div className="flex gap-2">
                        {log.supervisorStatus && log.supervisorStatus !== 'Pending' && (
                           <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold ${log.supervisorStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                             {log.supervisorStatus}
                           </div>
                        )}
                        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold ${log.isWithinBoundary ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          <MapPin size={12} />
                          {log.isWithinBoundary ? 'Inside Geofence' : 'Outside Geofence'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tasks Done</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.tasksDone}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skills Learned</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.skillsLearned}</p>
                      </div>
                    </div>
                    {/* Comments section */}
                    {log.supervisorComment && log.supervisorStatus !== 'Pending' && (
                      <div className="mt-4 bg-amber-50 p-3 rounded border border-amber-100">
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">Your Comment</span>
                        <p className="text-sm text-slate-700">{log.supervisorComment}</p>
                      </div>
                    )}
                    
                    {log.supervisorStatus === 'Pending' && (
                      <div className="mt-4">
                        <textarea
                          placeholder="Add a comment (optional)..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                          rows="2"
                          value={comments[log._id] || ''}
                          onChange={(e) => setComments({ ...comments, [log._id]: e.target.value })}
                        ></textarea>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {log.supervisorStatus === 'Pending' && (
                    <div className="flex md:flex-col gap-3 justify-end items-end md:w-32 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                      <button 
                        onClick={() => handleReview(log._id, 'Approved')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button 
                        onClick={() => handleReview(log._id, 'Rejected')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg font-medium hover:bg-rose-50 transition-colors"
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { CheckSquare, Check, X, Clock, MapPin } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function SupervisorDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    const fetchPendingLogs = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/logs/supervisor', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(data.data);
      } catch {
        toast.error('Failed to fetch pending logs');
      } finally {
        setLoading(false);
      }
    };

    void fetchPendingLogs();
  }, [token]);

  const handleReview = async (logId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/logs/${logId}/review`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Log ${status}!`, { style: { background: '#333', color: '#fff' } });
      // Remove the reviewed log from the local state
      setLogs(logs.filter(log => log._id !== logId));
    } catch {
      toast.error(`Failed to ${status.toLowerCase()} log`);
    }
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <CheckSquare className="text-brand" size={32} /> Pending Logbook Reviews
        </h1>
        <p className="text-slate-500 mt-2">Review and approve daily tasks submitted by your attached students.</p>
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
                      
                      {/* GPS Badge */}
                      <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold ${log.isWithinBoundary ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        <MapPin size={12} />
                        {log.isWithinBoundary ? 'Inside Geofence' : 'Outside Geofence'}
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
                  </div>

                  {/* Actions */}
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

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Users, GraduationCap, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { api, buildAuthConfig, extractApiError } from '../lib/api';

// Custom Select Component for Grading (No Browser Defaults)
const GradeSelect = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const grades = ['Pending', 'A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className={`relative ${disabled ? 'opacity-50' : ''}`}>
      <div 
        className={`px-4 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
          value === 'Pending' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span>{value}</span>
        {!disabled && <ChevronDown size={16} className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </div>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 z-50 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
            {grades.map((grade) => (
              <div 
                key={grade}
                className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                onClick={() => {
                  onChange(grade);
                  setIsOpen(false);
                }}
              >
                <span className={value === grade ? "font-bold text-brand" : "text-slate-700 font-medium"}>
                  {grade}
                </span>
                {value === grade && <Check size={16} className="text-brand" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function AssessorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore(state => state.token);

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

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <GraduationCap className="text-brand" size={32} /> Assessor Dashboard
        </h1>
        <p className="text-slate-500 mt-2">Track the progress of your assigned students and submit final grades.</p>
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
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <Users size={48} className="mx-auto mb-4 text-slate-300" />
                    You have no students assigned to you yet.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{session.student?.name}</div>
                      <div className="text-sm text-slate-500">{session.student?.registrationNumber || 'No Reg No.'}</div>
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
    </div>
  );
}

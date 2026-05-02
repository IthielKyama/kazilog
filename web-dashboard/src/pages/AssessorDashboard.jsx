import React, { useEffect, useMemo, useState } from 'react';
import { Users, GraduationCap, X, Search, FileText, Building2, ClipboardCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/authStore';
import { api, buildAuthConfig, extractApiError } from '../lib/api';
import { CustomSelect } from '../components/CustomSelect';
import { formatLogDay, groupLogsByWeek, getLogDate } from '../utils/logs';

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
      className={disabled ? 'opacity-60' : ''}
      buttonClassName={`${
        value === 'Pending'
          ? 'bg-amber-50 border-amber-200 text-amber-700'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
      }`}
      menuClassName="right-0"
    />
  );
};

function SummaryCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
    </div>
  );
}

const StudentLogsModal = ({ session, onClose, token }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeekKey, setSelectedWeekKey] = useState('');

  useEffect(() => {
    if (!session) {
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/logs/session/${session._id}`, buildAuthConfig(token));
        setLogs(data.data || []);
      } catch (error) {
        toast.error(extractApiError(error, 'Failed to fetch logs'));
      } finally {
        setLoading(false);
      }
    };

    void fetchLogs();
  }, [session, token]);

  const groupedLogs = useMemo(() => groupLogsByWeek(logs), [logs]);

  useEffect(() => {
    if (!groupedLogs.length) {
      setSelectedWeekKey('');
      return;
    }

    setSelectedWeekKey((current) => {
      if (current && groupedLogs.some((group) => group.key === current)) {
        return current;
      }

      return groupedLogs[0].key;
    });
  }, [groupedLogs]);

  const selectedWeek = useMemo(
    () => groupedLogs.find((group) => group.key === selectedWeekKey) ?? groupedLogs[0] ?? null,
    [groupedLogs, selectedWeekKey],
  );

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Logs for {session.student?.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{session.company?.name}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-5">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500">No logs found for this student.</div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Review week</div>
                <div className="flex flex-wrap gap-2">
                  {groupedLogs.map((group) => {
                    const selected = selectedWeek?.key === group.key;
                    return (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => setSelectedWeekKey(group.key)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                          selected
                            ? 'bg-brand text-white'
                            : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {group.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedWeek ? (
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Week: {selectedWeek.label}
                  </h3>
                  <div className="space-y-4">
                    {selectedWeek.logs.map((log) => (
                      <div key={log._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="text-sm font-medium text-slate-500">{formatLogDay(getLogDate(log))}</div>
                          <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            <span className={`rounded-full px-3 py-1 ${log.supervisorStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : log.supervisorStatus === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                              {log.supervisorStatus || 'Pending'}
                            </span>
                            {!log.isWithinBoundary ? (
                              <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-amber-700">
                                Geofence Issue
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tasks Done</h4>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{log.tasksDone}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Skills Learned</h4>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{log.skillsLearned}</p>
                          </div>
                        </div>

                        {log.supervisorComment ? (
                          <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-4">
                            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Supervisor Comment</h4>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{log.supervisorComment}</p>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [selectedSession, setSelectedSession] = useState(null);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    const fetchAssignedSessions = async () => {
      try {
        const { data } = await api.get('/assessor/sessions', buildAuthConfig(token));
        setSessions(data.data || []);
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
        buildAuthConfig(token),
      );

      toast.success(`Grade updated to ${newGrade}`);

      setSessions((current) =>
        current.map((session) =>
          session._id === sessionId
            ? { ...session, finalGrade: newGrade, isActive: newGrade === 'Pending' }
            : session,
        ),
      );
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to update grade'));
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch =
        session.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
        session.student?.registrationNumber?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'All' ? true : statusFilter === 'Active' ? session.isActive : !session.isActive;
      const matchesCompany = companyFilter === 'All' ? true : session.company?.name === companyFilter;

      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [sessions, search, statusFilter, companyFilter]);

  const summary = useMemo(() => ({
    assignedStudents: sessions.length,
    activeSessions: sessions.filter((session) => session.isActive).length,
    completedSessions: sessions.filter((session) => !session.isActive).length,
    gradingPending: sessions.filter((session) => session.finalGrade === 'Pending').length,
  }), [sessions]);

  const uniqueCompanies = useMemo(() => {
    const companies = new Set(sessions.map((session) => session.company?.name).filter(Boolean));
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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
            <GraduationCap className="text-brand" size={32} /> Student Review Workspace
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Track assigned students, review their weekly logs, and submit final grades without losing their full session history.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative min-w-56">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="min-w-40">
              <CustomSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status" />
            </div>
            <div className="min-w-52">
              <CustomSelect options={companyOptions} value={companyFilter} onChange={setCompanyFilter} placeholder="Company" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Assigned Students" value={summary.assignedStudents} hint="Students currently attached to you." />
        <SummaryCard label="Active Sessions" value={summary.activeSessions} hint="Students who are still logging in the field." />
        <SummaryCard label="Completed Sessions" value={summary.completedSessions} hint="Students with finished attachment sessions." />
        <SummaryCard label="Grades Pending" value={summary.gradingPending} hint="Sessions still waiting for a final grade." />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Assigned Students</h2>
            <p className="mt-1 text-sm text-slate-500">Review progress, inspect weekly logs, and capture the final grade.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500 md:flex">
            <ClipboardCheck size={16} className="text-brand" />
            {filteredSessions.length} visible
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Student</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Company</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Progress</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Session Status</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Final Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading student data...</td>
                </tr>
              ) : !filteredSessions.length ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <Users size={48} className="mx-auto mb-4 text-slate-300" />
                    No students match your current filters.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session._id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold text-slate-900">{session.student?.name}</div>
                          <div className="mt-1 text-sm text-slate-500">{session.student?.registrationNumber || 'No registration number'}</div>
                        </div>
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="rounded-full p-2 text-brand transition-colors hover:bg-brand/10"
                          title="View Logs"
                          aria-label={`View logs for ${session.student?.name}`}
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <Building2 size={16} className="text-slate-400" />
                        {session.company?.name}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="max-w-52">
                        <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-2.5 rounded-full bg-brand"
                            style={{ width: `${Math.min(100, (session.stats.approvedLogs / (session.stats.totalLogs || 1)) * 100)}%` }}
                          />
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                          {session.stats.approvedLogs} approved / {session.stats.totalLogs} total logs
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${session.isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                        {session.isActive ? 'Active' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end">
                        <div className="min-w-28">
                          <GradeSelect
                            value={session.finalGrade}
                            onChange={(value) => handleGradeChange(session._id, value)}
                            disabled={!session.isActive && session.finalGrade !== 'Pending'}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StudentLogsModal session={selectedSession} onClose={() => setSelectedSession(null)} token={token} />
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Check, X, Clock, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/authStore';
import { api, buildAuthConfig, extractApiError } from '../lib/api';
import { CustomSelect } from '../components/CustomSelect';
import { formatLogDay, groupLogsByWeek, getLogDate } from '../utils/logs';

function SummaryCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
    </div>
  );
}

export default function SupervisorDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [studentFilter, setStudentFilter] = useState('All');
  const [weekFilter, setWeekFilter] = useState('');
  const [comments, setComments] = useState({});
  const token = useAuthStore(state => state.token);

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/logs/supervisor?status=${statusFilter}`, buildAuthConfig(token));
        setLogs(data.data || []);
      } catch (error) {
        toast.error(extractApiError(error, 'Failed to fetch supervisor logs'));
      } finally {
        setLoading(false);
      }
    };

    void fetchLogs();
  }, [statusFilter, token]);

  const studentOptions = useMemo(() => {
    const map = new Map();
    logs.forEach((log) => {
      if (log.student?._id && !map.has(log.student._id)) {
        map.set(log.student._id, log.student.name);
      }
    });

    return [
      { value: 'All', label: 'All Students' },
      ...Array.from(map.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [logs]);

  const studentFilteredLogs = useMemo(() => {
    if (studentFilter === 'All') {
      return logs;
    }

    return logs.filter((log) => log.student?._id === studentFilter);
  }, [logs, studentFilter]);

  const groupedLogs = useMemo(() => groupLogsByWeek(studentFilteredLogs), [studentFilteredLogs]);

  useEffect(() => {
    if (!groupedLogs.length) {
      setWeekFilter('');
      return;
    }

    setWeekFilter((current) => {
      if (current && groupedLogs.some((group) => group.key === current)) {
        return current;
      }

      return groupedLogs[0].key;
    });
  }, [groupedLogs]);

  const weekOptions = useMemo(
    () => groupedLogs.map((group) => ({ value: group.key, label: group.label })),
    [groupedLogs],
  );

  const visibleGroups = useMemo(() => {
    if (!weekFilter) {
      return [];
    }

    return groupedLogs.filter((group) => group.key === weekFilter);
  }, [groupedLogs, weekFilter]);

  const summary = useMemo(() => ({
    totalLogs: logs.length,
    students: studentOptions.length - 1,
    pending: logs.filter((log) => log.supervisorStatus === 'Pending').length,
    selectedWeekLogs: visibleGroups[0]?.logs.length || 0,
  }), [logs, studentOptions.length, visibleGroups]);

  const handleReview = async (logId, status) => {
    try {
      await api.put(`/logs/${logId}/review`, { status, comment: comments[logId] || '' }, buildAuthConfig(token));
      toast.success(`Log ${status.toLowerCase()} successfully.`);

      if (statusFilter === 'Pending') {
        setLogs((current) => current.filter((log) => log._id !== logId));
      } else {
        setLogs((current) =>
          current.map((log) =>
            log._id === logId ? { ...log, supervisorStatus: status, supervisorComment: comments[logId] || '' } : log,
          ),
        );
      }

      setComments((current) => ({ ...current, [logId]: '' }));
    } catch (error) {
      toast.error(extractApiError(error, `Failed to ${status.toLowerCase()} log`));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
            <CheckSquare className="text-brand" size={30} /> Weekly Supervisor Reviews
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review one student and one week at a time so comments stay specific and approvals stay manageable.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="min-w-48">
              <CustomSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Status" />
            </div>
            <div className="min-w-56">
              <CustomSelect options={studentOptions} value={studentFilter} onChange={setStudentFilter} placeholder="Student" />
            </div>
            <div className="min-w-56">
              <CustomSelect
                options={weekOptions}
                value={weekFilter}
                onChange={setWeekFilter}
                placeholder={groupedLogs.length ? 'Select week' : 'No weeks available'}
                disabled={!groupedLogs.length}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Loaded Logs" value={summary.totalLogs} hint="Logs returned for the selected review status." />
        <SummaryCard label="Students" value={summary.students} hint="Students represented in the current review pool." />
        <SummaryCard label="Pending Reviews" value={summary.pending} hint="Entries still waiting for your decision." />
        <SummaryCard label="Selected Week" value={summary.selectedWeekLogs} hint="Entries currently shown for the chosen week." />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading supervisor review queue...</div>
        ) : !logs.length ? (
          <div className="p-16 text-center text-slate-500">
            <CheckSquare size={44} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-semibold text-slate-700">No logs found for this status.</p>
            <p className="mt-2 text-sm">Try another status filter to inspect a different review set.</p>
          </div>
        ) : !visibleGroups.length ? (
          <div className="p-16 text-center text-slate-500">
            <Users size={44} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-semibold text-slate-700">No logs match the current student and week filter.</p>
            <p className="mt-2 text-sm">Choose a different student or week to continue reviewing.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {visibleGroups.map((group) => (
              <div key={group.key} className="p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Week: {group.label}</h2>
                    <p className="mt-1 text-sm text-slate-400">{group.logs.length} logs in this review window</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {group.logs.map((log) => (
                    <div key={log._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                      <div className="flex flex-col gap-6 xl:flex-row">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{log.student?.name || 'Unknown Student'}</h3>
                              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                                <Clock size={14} /> {formatLogDay(getLogDate(log))}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${log.supervisorStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : log.supervisorStatus === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                {log.supervisorStatus}
                              </span>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${log.isWithinBoundary ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                <MapPin size={12} className="mr-1 inline" />
                                {log.isWithinBoundary ? 'Inside Geofence' : 'Outside Geofence'}
                              </span>
                            </div>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tasks Done</h4>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{log.tasksDone}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Skills Learned</h4>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{log.skillsLearned}</p>
                            </div>
                          </div>

                          {log.supervisorComment && log.supervisorStatus !== 'Pending' ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                              <div className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Previous Comment</div>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{log.supervisorComment}</p>
                            </div>
                          ) : null}

                          {log.supervisorStatus === 'Pending' ? (
                            <textarea
                              placeholder="Add a comment for the student (optional)..."
                              className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                              value={comments[log._id] || ''}
                              onChange={(event) => setComments((current) => ({ ...current, [log._id]: event.target.value }))}
                            />
                          ) : null}
                        </div>

                        {log.supervisorStatus === 'Pending' ? (
                          <div className="flex gap-3 xl:w-44 xl:flex-col xl:justify-end">
                            <button
                              onClick={() => handleReview(log._id, 'Approved')}
                              className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                            >
                              <span className="flex items-center justify-center gap-2"><Check size={16} /> Approve</span>
                            </button>
                            <button
                              onClick={() => handleReview(log._id, 'Rejected')}
                              className="flex-1 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                            >
                              <span className="flex items-center justify-center gap-2"><X size={16} /> Reject</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

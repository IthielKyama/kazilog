import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AssessorDashboard from './AssessorDashboard';
import { useAuthStore } from '../store/authStore';

const { apiMock, downloadSessionLogsPdfMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    put: vi.fn(),
  },
  downloadSessionLogsPdfMock: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  api: apiMock,
  buildAuthConfig: (token) => ({
    headers: { Authorization: `Bearer ${token}` },
  }),
  extractApiError: (error, fallback) => error?.response?.data?.message || fallback,
}));

vi.mock('../utils/sessionExport', () => ({
  downloadSessionLogsPdf: downloadSessionLogsPdfMock,
}));

describe('AssessorDashboard', () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.put.mockReset();
    downloadSessionLogsPdfMock.mockReset();

    useAuthStore.setState({
      user: { _id: 'assessor-1', name: 'Assessor User', email: 'assessor@test.com', role: 'assessor', mustChangePassword: false },
      token: 'assessor-token',
    });

    apiMock.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              _id: 'session-1',
              isActive: true,
              finalGrade: 'Pending',
              sessionStatus: 'Ongoing',
              sessionStatusCode: 'active',
              weekProgress: { label: 'Week 3/17' },
              student: { _id: 'student-1', name: 'Amina Njeri', registrationNumber: 'TVET-ATT-2026-001' },
              company: { name: 'Demo Company' },
              stats: { approvedLogs: 1, rejectedLogs: 0, totalLogs: 2, pendingLogs: 1 },
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              _id: 'log-1',
              date: '2026-05-02T00:00:00.000Z',
              tasksDone: 'Configured user accounts',
              skillsLearned: 'Identity provisioning',
              supervisorComment: 'Good progress.',
              supervisorStatus: 'Approved',
              isWithinBoundary: true,
            },
          ],
        },
      });
  });

  test('opens logs and submits a pass grade', async () => {
    const user = userEvent.setup();
    apiMock.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          _id: 'session-1',
          finalGrade: 'Pass',
          sessionStatus: 'Graded',
          sessionStatusCode: 'graded',
          weekProgress: { label: 'Week 17/17' },
          isActive: false,
        },
      },
    });

    render(<AssessorDashboard />);

    expect(await screen.findByText(/amina njeri/i)).toBeInTheDocument();
    expect(screen.getByText(/week 3\/17/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /view logs for amina njeri/i }));
    expect(await screen.findByText(/logs for amina njeri/i)).toBeInTheDocument();
    expect(screen.getByText(/good progress/i)).toBeInTheDocument();

    const gradeCell = screen.getAllByRole('button', { name: /pending/i }).find((button) => button.getAttribute('aria-haspopup') === 'listbox');
    await user.click(gradeCell);
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Pass' }));

    await waitFor(() => {
      expect(apiMock.put).toHaveBeenCalledWith(
        '/assessor/sessions/session-1/grade',
        { finalGrade: 'Pass' },
        expect.objectContaining({
          headers: { Authorization: 'Bearer assessor-token' },
        }),
      );
    });

    expect(screen.getAllByText(/graded/i).length).toBeGreaterThan(0);
  });

  test('downloads the selected student report and filters modal logs by week', async () => {
    const user = userEvent.setup();

    apiMock.get
      .mockReset()
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              _id: 'session-1',
              isActive: false,
              finalGrade: 'Pending',
              sessionStatus: 'Completed but awaiting grading',
              sessionStatusCode: 'completed_awaiting_grading',
              weekProgress: { label: 'Week 17/17' },
              student: { _id: 'student-1', name: 'Amina Njeri', registrationNumber: 'TVET-ATT-2026-001' },
              company: { name: 'Demo Company' },
              stats: { approvedLogs: 1, rejectedLogs: 0, totalLogs: 2, pendingLogs: 1 },
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              _id: 'log-1',
              date: '2026-05-12T00:00:00.000Z',
              tasksDone: 'Configured user accounts',
              skillsLearned: 'Identity provisioning',
              supervisorComment: 'Good progress.',
              supervisorStatus: 'Approved',
              isWithinBoundary: true,
            },
            {
              _id: 'log-2',
              date: '2026-05-01T00:00:00.000Z',
              tasksDone: 'Prepared inventory sheet',
              skillsLearned: 'Stock handling',
              supervisorComment: '',
              supervisorStatus: 'Pending',
              isWithinBoundary: true,
            },
          ],
        },
      });

    render(<AssessorDashboard />);

    expect((await screen.findAllByText(/assigned students/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/ongoing sessions/i)).toBeInTheDocument();
    expect(screen.getAllByText(/completed but awaiting grading/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /download amina njeri pdf/i }));
    await waitFor(() => {
      expect(downloadSessionLogsPdfMock).toHaveBeenCalledWith(
        'session-1',
        'assessor-token',
        'Amina Njeri-logs.pdf',
      );
    });

    await user.click(screen.getByRole('button', { name: /view logs for amina njeri/i }));
    expect(await screen.findByText(/logs for amina njeri/i)).toBeInTheDocument();
    expect(screen.getByText(/configured user accounts/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /27 apr - 03 may 2026/i }));
    expect(screen.getByText(/prepared inventory sheet/i)).toBeInTheDocument();
    expect(screen.queryByText(/configured user accounts/i)).not.toBeInTheDocument();
  });
});

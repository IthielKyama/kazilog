import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AssessorDashboard from './AssessorDashboard';
import { useAuthStore } from '../store/authStore';

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('../lib/api', () => ({
  api: apiMock,
  buildAuthConfig: (token) => ({
    headers: { Authorization: `Bearer ${token}` },
  }),
  extractApiError: (error, fallback) => error?.response?.data?.message || fallback,
}));

describe('AssessorDashboard', () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.put.mockReset();
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
              student: { name: 'Amina Njeri', registrationNumber: 'TVET-ATT-2026-001' },
              company: { name: 'Demo Company' },
              stats: { approvedLogs: 1, totalLogs: 2 },
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
              isWithinBoundary: true,
            },
          ],
        },
      });
  });

  test('opens approved logs and submits a final grade', async () => {
    const user = userEvent.setup();
    apiMock.put.mockResolvedValueOnce({ data: { success: true } });

    render(<AssessorDashboard />);

    expect(await screen.findByText(/amina njeri/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /view logs/i }));
    expect(await screen.findByText(/logs for amina njeri/i)).toBeInTheDocument();
    expect(screen.getByText(/good progress/i)).toBeInTheDocument();

    const gradeCell = screen.getByRole('button', { name: /pending/i });
    await user.click(gradeCell);
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'A' }));

    await waitFor(() => {
      expect(apiMock.put).toHaveBeenCalledWith(
        '/assessor/sessions/session-1/grade',
        { finalGrade: 'A' },
        expect.objectContaining({
          headers: { Authorization: 'Bearer assessor-token' },
        }),
      );
    });
  });

  test('shows overview metrics and filters modal logs by week', async () => {
    const user = userEvent.setup();

    apiMock.get
      .mockReset()
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              _id: 'session-1',
              isActive: true,
              finalGrade: 'Pending',
              student: { name: 'Amina Njeri', registrationNumber: 'TVET-ATT-2026-001' },
              company: { name: 'Demo Company' },
              stats: { approvedLogs: 1, totalLogs: 2 },
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
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /view logs for amina njeri/i }));
    expect(await screen.findByText(/logs for amina njeri/i)).toBeInTheDocument();
    expect(screen.getByText(/configured user accounts/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /27 apr - 03 may 2026/i }));
    expect(screen.getByText(/prepared inventory sheet/i)).toBeInTheDocument();
    expect(screen.queryByText(/configured user accounts/i)).not.toBeInTheDocument();
  });
});

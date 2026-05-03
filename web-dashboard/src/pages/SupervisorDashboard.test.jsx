import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import SupervisorDashboard from './SupervisorDashboard';
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

describe('SupervisorDashboard', () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.put.mockReset();
    useAuthStore.setState({
      user: { _id: 'supervisor-1', name: 'Supervisor User', email: 'supervisor@test.com', role: 'supervisor', mustChangePassword: false },
      token: 'supervisor-token',
    });

    apiMock.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'log-1',
            date: '2026-05-02T00:00:00.000Z',
            tasksDone: 'Reviewed service tickets',
            skillsLearned: 'Incident handling',
            supervisorStatus: 'Pending',
            supervisorComment: '',
            isWithinBoundary: true,
            student: { name: 'Amina Njeri' },
          },
        ],
      },
    });
  });

  test('submits review comments with approval', async () => {
    const user = userEvent.setup();
    apiMock.put.mockResolvedValueOnce({ data: { success: true } });

    render(<SupervisorDashboard />);

    expect(await screen.findByText(/reviewed service tickets/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/add a comment/i), 'Great documentation and clear task summary.');
    await user.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(() => {
      expect(apiMock.put).toHaveBeenCalledWith(
        '/logs/log-1/review',
        {
          status: 'Approved',
          comment: 'Great documentation and clear task summary.',
        },
        expect.objectContaining({
          headers: { Authorization: 'Bearer supervisor-token' },
        }),
      );
    });
  });

  test('filters the review list by student and week', async () => {
    const user = userEvent.setup();

    apiMock.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: 'log-1',
            date: '2026-05-12T00:00:00.000Z',
            tasksDone: 'Reviewed service tickets',
            skillsLearned: 'Incident handling',
            supervisorStatus: 'Pending',
            supervisorComment: '',
            isWithinBoundary: true,
            student: { _id: 'student-2', name: 'Brian Otieno' },
          },
          {
            _id: 'log-2',
            date: '2026-05-01T00:00:00.000Z',
            tasksDone: 'Network setup support',
            skillsLearned: 'LAN troubleshooting',
            supervisorStatus: 'Pending',
            supervisorComment: '',
            isWithinBoundary: true,
            student: { _id: 'student-2', name: 'Brian Otieno' },
          },
          {
            _id: 'log-3',
            date: '2026-05-05T00:00:00.000Z',
            tasksDone: 'Filed support reports',
            skillsLearned: 'Documentation',
            supervisorStatus: 'Pending',
            supervisorComment: '',
            isWithinBoundary: true,
            student: { _id: 'student-1', name: 'Amina Njeri' },
          },
        ],
      },
    });

    render(<SupervisorDashboard />);

    expect(await screen.findByText(/reviewed service tickets/i)).toBeInTheDocument();

    const allSelectButtons = screen.getAllByRole('button');
    await user.click(allSelectButtons.find((button) => /all students/i.test(button.textContent || '')));
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: /brian otieno/i }));

    expect(screen.getAllByText(/brian otieno/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/filed support reports/i)).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button').find((button) => /may 2026/i.test(button.textContent || '')));
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: /27 apr - 03 may 2026/i }));
    expect(screen.getByText(/network setup support/i)).toBeInTheDocument();
    expect(screen.queryByText(/reviewed service tickets/i)).not.toBeInTheDocument();
  });
});

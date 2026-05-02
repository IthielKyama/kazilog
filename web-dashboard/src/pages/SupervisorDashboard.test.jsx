import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

    expect(await screen.findByText(/amina njeri/i)).toBeInTheDocument();
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
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AdminDashboard from './AdminDashboard';
import { useAuthStore } from '../store/authStore';

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../lib/api', () => ({
  api: apiMock,
  buildAuthConfig: (token) => ({
    headers: { Authorization: `Bearer ${token}` },
  }),
  extractApiError: (error, fallback) => error?.response?.data?.message || fallback,
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.post.mockReset();
    useAuthStore.setState({
      user: { _id: 'admin-1', name: 'Admin User', email: 'admin@test.com', role: 'admin', mustChangePassword: false },
      token: 'admin-token',
    });

    apiMock.get
      .mockResolvedValueOnce({ data: { data: [{ _id: 'company-1', name: 'Demo Company', address: 'Nairobi', allowedRadiusMeters: 200 }] } })
      .mockResolvedValueOnce({ data: { data: [
        { _id: 'student-1', name: 'Amina Njeri', role: 'student', email: 'student@test.com' },
        { _id: 'supervisor-1', name: 'Mercy Wanjiku', role: 'supervisor', email: 'supervisor@test.com' },
        { _id: 'assessor-1', name: 'Dr. Peter Otieno', role: 'assessor', email: 'assessor@test.com' },
      ] } })
      .mockResolvedValueOnce({ data: { data: [] } });
  });

  test('submits company registration from the dashboard', async () => {
    const user = userEvent.setup();
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });

    render(<AdminDashboard />);

    await user.click(screen.getByRole('button', { name: /register company/i }));
    await user.type(screen.getByLabelText(/company name/i), 'Safaricom PLC');
    await user.type(screen.getByLabelText(/physical address/i), 'Waiyaki Way, Nairobi');
    await user.type(screen.getByLabelText(/latitude/i), '-1.286389');
    await user.type(screen.getByLabelText(/longitude/i), '36.817223');
    await user.clear(screen.getByLabelText(/allowed gps radius/i));
    await user.type(screen.getByLabelText(/allowed gps radius/i), '150');
    await user.click(screen.getByRole('button', { name: /save company/i }));

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith(
        '/admin/companies',
        expect.objectContaining({
          name: 'Safaricom PLC',
          address: 'Waiyaki Way, Nairobi',
          latitude: -1.286389,
          longitude: 36.817223,
          allowedRadiusMeters: 150,
        }),
        expect.objectContaining({
          headers: { Authorization: 'Bearer admin-token' },
        }),
      );
    });
  });

  test('submits attachment session creation from the dashboard', async () => {
    const user = userEvent.setup();
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });

    render(<AdminDashboard />);

    await user.click(screen.getAllByRole('button', { name: /create session/i })[0]);
    await user.click(screen.getByRole('button', { name: /^student$/i }));
    await user.click(screen.getByRole('option', { name: /amina njeri/i }));
    await user.click(screen.getByRole('button', { name: /^company$/i }));
    await user.click(screen.getByRole('option', { name: /demo company/i }));
    await user.click(screen.getByRole('button', { name: /industry supervisor/i }));
    await user.click(screen.getByRole('option', { name: /mercy wanjiku/i }));
    await user.click(screen.getByRole('button', { name: /school assessor/i }));
    await user.click(screen.getByRole('option', { name: /dr\. peter otieno/i }));
    await user.type(screen.getByLabelText(/start date/i), '2026-05-01');
    await user.type(screen.getByLabelText(/end date/i), '2026-08-31');
    await user.click(screen.getAllByRole('button', { name: /create session/i })[1]);

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith(
        '/admin/sessions',
        expect.objectContaining({
          student: 'student-1',
          company: 'company-1',
          supervisor: 'supervisor-1',
          assessor: 'assessor-1',
          startDate: '2026-05-01',
          endDate: '2026-08-31',
        }),
        expect.objectContaining({
          headers: { Authorization: 'Bearer admin-token' },
        }),
      );
    });
  });
});

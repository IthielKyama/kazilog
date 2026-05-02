import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import App from './App';
import { useAuthStore } from './store/authStore';

describe('App role navigation', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  test('shows setup-only navigation for admins', () => {
    useAuthStore.setState({
      user: { _id: 'admin-1', name: 'Admin User', email: 'admin@test.com', role: 'admin', mustChangePassword: false },
      token: 'admin-token',
    });

    render(<App />);

    expect(screen.getAllByRole('link', { name: /admin setup/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /reviews/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /students/i })).not.toBeInTheDocument();
  });

  test('shows review navigation for supervisors only', () => {
    useAuthStore.setState({
      user: { _id: 'supervisor-1', name: 'Supervisor User', email: 'supervisor@test.com', role: 'supervisor', mustChangePassword: false },
      token: 'supervisor-token',
    });

    render(<App />);

    expect(screen.queryByRole('link', { name: /admin setup/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /reviews/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /students/i })).not.toBeInTheDocument();
  });
});

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

    expect(screen.getAllByRole('link', { name: /^overview$/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /companies/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^users$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /attachment sessions/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /reviews/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /student reviews/i })).not.toBeInTheDocument();
  });

  test('shows review navigation for supervisors only', () => {
    useAuthStore.setState({
      user: { _id: 'supervisor-1', name: 'Supervisor User', email: 'supervisor@test.com', role: 'supervisor', mustChangePassword: false },
      token: 'supervisor-token',
    });

    render(<App />);

    expect(screen.getAllByRole('link', { name: /^overview$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /reviews/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /student reviews/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /companies/i })).not.toBeInTheDocument();
  });

  test('shows overview and student review navigation for assessors', () => {
    useAuthStore.setState({
      user: { _id: 'assessor-1', name: 'Assessor User', email: 'assessor@test.com', role: 'assessor', mustChangePassword: false },
      token: 'assessor-token',
    });

    render(<App />);

    expect(screen.getAllByRole('link', { name: /^overview$/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /^student reviews$/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^dashboard$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^reviews$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /companies/i })).not.toBeInTheDocument();
  });
});

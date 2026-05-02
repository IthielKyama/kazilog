import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import App from './App';
import { useAuthStore } from './store/authStore';

describe('App admin development navigation', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    useAuthStore.setState({
      user: { _id: 'admin-1', name: 'Admin User', email: 'admin@test.com', role: 'admin', mustChangePassword: false },
      token: 'admin-token',
    });
  });

  test('shows explicit admin preview links for supervisor and assessor routes', () => {
    render(<App />);

    expect(screen.getByText(/development cross-role access is enabled/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /supervisor workflow preview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /assessor workflow preview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /system setup/i })).toBeInTheDocument();
  });
});

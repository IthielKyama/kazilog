import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { CustomSelect } from './CustomSelect';

describe('CustomSelect', () => {
  test('opens options and applies a new selection', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <CustomSelect
        options={[
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
        ]}
        value="pending"
        onChange={handleChange}
        placeholder="Select status"
      />,
    );

    await user.click(screen.getByRole('button', { name: /pending/i }));
    await user.click(screen.getByRole('option', { name: /approved/i }));

    expect(handleChange).toHaveBeenCalledWith('approved');
  });
});

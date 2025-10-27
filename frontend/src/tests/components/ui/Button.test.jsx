import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../../components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button variant="primary">Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeTruthy();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);

    const button = screen.getByRole('button');
    expect(button.disabled).toBe(true);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    expect(screen.getByRole('button').disabled).toBe(true);
  });
});

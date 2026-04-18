import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login screen', () => {
  render(<App />);

  expect(screen.getAllByText(/iniciar sesión/i)).toHaveLength(2);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  expect(screen.getByText(/no tienes cuenta/i)).toBeInTheDocument();
});

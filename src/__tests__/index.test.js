import { render, screen } from '@testing-library/react';
import App from '../src/App';

// Boiler plate test expected to fail. Left it for example code for now.
test('Tests home page route', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

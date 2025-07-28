import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createStore } from '@reduxjs/toolkit';
import App from './App';

// Mock store for testing
const mockStore = createStore(() => ({
  inventory: {
    products: [],
    isLoading: false,
    error: null
  },
  orders: {
    orders: [],
    isLoading: false,
    error: null
  }
}));

test('renders header with navigation', () => {
  render(
    <Provider store={mockStore}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  );
  
  const dashboardLink = screen.getByText(/dashboard/i);
  expect(dashboardLink).toBeInTheDocument();
  
  const inventoryLink = screen.getByText(/inventory/i);
  expect(inventoryLink).toBeInTheDocument();
  
  const ordersLink = screen.getByText(/orders/i);
  expect(ordersLink).toBeInTheDocument();
});
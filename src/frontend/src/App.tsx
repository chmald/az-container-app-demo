import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import InventoryPage from './pages/InventoryPage';
import OrdersPage from './pages/OrdersPage';
import NotificationsPage from './pages/NotificationsPage';

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
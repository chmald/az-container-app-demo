import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Store, ShoppingCart, Assessment, TrendingUp } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { fetchProducts } from '../store/inventorySlice';
import { fetchOrders } from '../store/orderSlice';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, isLoading: inventoryLoading, error: inventoryError } = useSelector(
    (state: RootState) => state.inventory
  );
  const { orders, isLoading: ordersLoading, error: ordersError } = useSelector(
    (state: RootState) => state.orders
  );

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchOrders());
  }, [dispatch]);

  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const lowStockProducts = products.filter(product => product.quantity < 10).length;

  const stats = [
    {
      title: 'Total Products',
      value: totalProducts,
      icon: <Store fontSize="large" color="primary" />,
      color: '#1976d2',
    },
    {
      title: 'Total Orders',
      value: totalOrders,
      icon: <ShoppingCart fontSize="large" color="secondary" />,
      color: '#dc004e',
    },
    {
      title: 'Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: <TrendingUp fontSize="large" color="success" />,
      color: '#2e7d32',
    },
    {
      title: 'Low Stock Items',
      value: lowStockProducts,
      icon: <Assessment fontSize="large" color="warning" />,
      color: '#ed6c02',
    },
  ];

  if (inventoryLoading || ordersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {(inventoryError || ordersError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {inventoryError || ordersError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h5" component="div">
                      {stat.value}
                    </Typography>
                  </Box>
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Welcome to Azure Container Apps Demo
        </Typography>
        <Typography variant="body1" color="textSecondary">
          This demo showcases a microservices-based e-commerce platform built with Azure Container Apps
          and Dapr integration. Navigate to the Inventory or Orders sections to explore the functionality.
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
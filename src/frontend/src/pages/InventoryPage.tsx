import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import { Store, Add } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { fetchProducts } from '../store/inventorySlice';

const InventoryPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, isLoading, error } = useSelector(
    (state: RootState) => state.inventory
  );

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { label: 'Out of Stock', color: 'error' as const };
    } else if (quantity < 10) {
      return { label: 'Low Stock', color: 'warning' as const };
    } else {
      return { label: 'In Stock', color: 'success' as const };
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Inventory Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            // TODO: Implement add product functionality
            console.log('Add product clicked');
          }}
        >
          Add Product
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {products.length === 0 && !isLoading ? (
        <Box textAlign="center" py={4}>
          <Store sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            No products found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            The inventory service might be starting up or unavailable.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => {
            const stockStatus = getStockStatus(product.quantity);
            return (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {product.description}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" color="primary">
                        ${product.price.toFixed(2)}
                      </Typography>
                      <Chip
                        label={stockStatus.label}
                        color={stockStatus.color}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">
                        Quantity: {product.quantity}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Category: {product.category}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default InventoryPage;
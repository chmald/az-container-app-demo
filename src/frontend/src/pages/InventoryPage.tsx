import React, { useEffect, useState } from 'react';
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import { Store, Add, Warning, Search } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { fetchProducts, fetchLowStockProducts, createProduct, updateInventoryQuantity } from '../store/inventorySlice';
import { Product } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const InventoryPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, lowStockProducts, isLoading, error } = useSelector(
    (state: RootState) => state.inventory
  );

  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    category: '',
  });

  useEffect(() => {
    dispatch(fetchProducts({}));
    dispatch(fetchLowStockProducts(10)); // Fetch products with less than 10 items
  }, [dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearch = () => {
    dispatch(fetchProducts({ search: searchTerm }));
  };

  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.price && newProduct.quantity !== undefined) {
      await dispatch(createProduct(newProduct as Omit<Product, 'id'>));
      setOpenAddDialog(false);
      setNewProduct({ name: '', description: '', price: 0, quantity: 0, category: '' });
      dispatch(fetchProducts({})); // Refresh the list
    }
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    await dispatch(updateInventoryQuantity({ id: productId, quantity: newQuantity }));
  };

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

  const renderProductGrid = (productList: Product[]) => (
    <Grid container spacing={3}>
      {Array.isArray(productList) && productList.map((product) => {
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
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body2">
                    Quantity: {product.quantity}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Category: {product.category}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => handleUpdateQuantity(product.id, product.quantity + 1)}
                  sx={{ mr: 1 }}
                >
                  +1
                </Button>
                <Button
                  size="small"
                  onClick={() => handleUpdateQuantity(product.id, Math.max(0, product.quantity - 1))}
                  disabled={product.quantity === 0}
                >
                  -1
                </Button>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Inventory Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenAddDialog(true)}
        >
          Add Product
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          variant="outlined"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={<Search />}
          onClick={handleSearch}
        >
          Search
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="All Products" />
        <Tab
          label={
            <Badge badgeContent={lowStockProducts.length} color="error">
              Low Stock Alerts
            </Badge>
          }
          icon={<Warning />}
          iconPosition="start"
        />
      </Tabs>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {products.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Store sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No products found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchTerm ? 'Try adjusting your search terms.' : 'The inventory service might be starting up or unavailable.'}
            </Typography>
          </Box>
        ) : (
          renderProductGrid(products)
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {lowStockProducts.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Warning sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No low stock alerts
            </Typography>
            <Typography variant="body2" color="textSecondary">
              All products have sufficient inventory levels.
            </Typography>
          </Box>
        ) : (
          renderProductGrid(lowStockProducts)
        )}
      </TabPanel>

      {/* Add Product Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Product Name"
            fullWidth
            variant="outlined"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            variant="outlined"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={newProduct.quantity}
            onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Category"
            fullWidth
            variant="outlined"
            value={newProduct.category}
            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddProduct} variant="contained">Add Product</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;
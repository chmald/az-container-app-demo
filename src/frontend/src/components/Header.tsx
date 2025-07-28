import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Store, ShoppingCart, Dashboard } from '@mui/icons-material';

const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Dashboard /> },
    { path: '/inventory', label: 'Inventory', icon: <Store /> },
    { path: '/orders', label: 'Orders', icon: <ShoppingCart /> },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Azure Container Apps Demo
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={RouterLink}
              to={item.path}
              color="inherit"
              startIcon={item.icon}
              variant={location.pathname === item.path ? 'outlined' : 'text'}
              sx={{
                borderColor: location.pathname === item.path ? 'inherit' : 'transparent',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
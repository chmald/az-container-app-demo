import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Fab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Notifications, Add, Send } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { 
  sendNotification, 
  fetchNotificationHistory, 
  checkNotificationHealth 
} from '../store/notificationSlice';

const NotificationsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, notificationHistory, isLoading, error } = useSelector(
    (state: RootState) => state.notifications
  );

  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [newNotification, setNewNotification] = useState({
    type: 'info',
    message: '',
    recipient: '',
  });
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchNotificationHistory({}));
    dispatch(checkNotificationHealth()).then((result) => {
      if (result.type === 'notifications/checkHealth/fulfilled') {
        setHealthStatus(result.payload);
      }
    });
  }, [dispatch]);

  const handleSendNotification = async () => {
    if (newNotification.message.trim()) {
      await dispatch(sendNotification({
        type: newNotification.type,
        message: newNotification.message,
        recipient: newNotification.recipient || undefined,
      }));
      setOpenSendDialog(false);
      setNewNotification({ type: 'info', message: '', recipient: '' });
      // Refresh history
      dispatch(fetchNotificationHistory({}));
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
      default:
        return 'info';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
          Notifications
        </Typography>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => setOpenSendDialog(true)}
        >
          Send Notification
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Health Status */}
      {healthStatus && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification Service Status
            </Typography>
            <Chip 
              label={healthStatus.status || 'Unknown'} 
              color={healthStatus.status === 'healthy' ? 'success' : 'error'}
              sx={{ mr: 1 }}
            />
            {healthStatus.timestamp && (
              <Typography variant="body2" color="textSecondary">
                Last checked: {formatDate(healthStatus.timestamp)}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Notifications */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Notifications
          </Typography>
          {notifications.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No recent notifications
            </Typography>
          ) : (
            <List>
              {notifications.slice(0, 5).map((notification, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={notification.type} 
                          color={getNotificationTypeColor(notification.type) as any}
                          size="small"
                        />
                        <Typography variant="body1">
                          {notification.message}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      notification.createdAt ? formatDate(notification.createdAt) : 'Just now'
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Notification History
          </Typography>
          {notificationHistory.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Notifications sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No notification history
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Notifications will appear here once they are sent.
              </Typography>
            </Box>
          ) : (
            <List>
              {notificationHistory.map((notification, index) => (
                <ListItem key={notification.id || index} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={notification.type} 
                          color={getNotificationTypeColor(notification.type) as any}
                          size="small"
                        />
                        <Typography variant="body1">
                          {notification.message}
                        </Typography>
                        {notification.status && (
                          <Chip 
                            label={notification.status} 
                            color={notification.status === 'delivered' ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {notification.recipient && (
                          <Typography variant="body2" color="textSecondary">
                            To: {notification.recipient}
                          </Typography>
                        )}
                        <Typography variant="body2" color="textSecondary">
                          {notification.createdAt ? formatDate(notification.createdAt) : 'Unknown time'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={openSendDialog} onClose={() => setOpenSendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={newNotification.type}
              label="Type"
              onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
            >
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="error">Error</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Message"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newNotification.message}
            onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Recipient (optional)"
            fullWidth
            variant="outlined"
            value={newNotification.recipient}
            onChange={(e) => setNewNotification({ ...newNotification, recipient: e.target.value })}
            helperText="Leave empty for broadcast notification"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSendNotification} 
            variant="contained"
            disabled={!newNotification.message.trim()}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="send notification"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setOpenSendDialog(true)}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default NotificationsPage;

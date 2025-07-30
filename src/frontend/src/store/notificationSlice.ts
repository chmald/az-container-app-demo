import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LoadingState } from '../types';
import { notificationApi } from '../services/api';

interface Notification {
  id: string;
  type: string;
  message: string;
  recipient?: string;
  status: 'sent' | 'delivered' | 'failed';
  createdAt: string;
  metadata?: any;
}

interface NotificationState extends LoadingState {
  notifications: Notification[];
  notificationHistory: Notification[];
  selectedNotification: Notification | null;
}

const initialState: NotificationState = {
  notifications: [],
  notificationHistory: [],
  selectedNotification: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const sendNotification = createAsyncThunk(
  'notifications/sendNotification',
  async (notificationData: {
    type: string;
    message: string;
    recipient?: string;
    metadata?: any;
  }, { rejectWithValue }) => {
    try {
      const result = await notificationApi.sendNotification(notificationData);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send notification');
    }
  }
);

export const fetchNotification = createAsyncThunk(
  'notifications/fetchNotification',
  async (id: string, { rejectWithValue }) => {
    try {
      const notification = await notificationApi.getNotification(id);
      return notification;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notification');
    }
  }
);

export const fetchNotificationHistory = createAsyncThunk(
  'notifications/fetchNotificationHistory',
  async (params: { recipient?: string; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const history = await notificationApi.getNotificationHistory(params);
      return history;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notification history');
    }
  }
);

export const checkNotificationHealth = createAsyncThunk(
  'notifications/checkHealth',
  async (_, { rejectWithValue }) => {
    try {
      const health = await notificationApi.healthCheck();
      return health;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check notification service health');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedNotification: (state, action: PayloadAction<Notification | null>) => {
      state.selectedNotification = action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Send notification
      .addCase(sendNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add the sent notification to the list if it has an ID
        if (action.payload.id) {
          state.notifications.unshift(action.payload);
        }
      })
      .addCase(sendNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch notification
      .addCase(fetchNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedNotification = action.payload;
      })
      .addCase(fetchNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch notification history
      .addCase(fetchNotificationHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notificationHistory = action.payload;
      })
      .addCase(fetchNotificationHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Check notification health
      .addCase(checkNotificationHealth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkNotificationHealth.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(checkNotificationHealth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setSelectedNotification, 
  addNotification, 
  clearNotifications 
} = notificationSlice.actions;

export default notificationSlice.reducer;

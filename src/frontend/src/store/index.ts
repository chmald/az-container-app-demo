import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './inventorySlice';
import orderReducer from './orderSlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    orders: orderReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
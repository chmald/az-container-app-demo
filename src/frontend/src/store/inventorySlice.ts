import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product, LoadingState } from '../types';
import { inventoryApi } from '../services/api';

interface InventoryState extends LoadingState {
  products: Product[];
  lowStockProducts: Product[];
  selectedProduct: Product | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const initialState: InventoryState = {
  products: [],
  lowStockProducts: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'inventory/fetchProducts',
  async (params: { page?: number; pageSize?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const products = await inventoryApi.getProducts(params);
      return products;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'inventory/fetchProduct',
  async (id: string, { rejectWithValue }) => {
    try {
      const product = await inventoryApi.getProduct(id);
      return product;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch product');
    }
  }
);

export const createProduct = createAsyncThunk(
  'inventory/createProduct',
  async (productData: Omit<Product, 'id'>, { rejectWithValue }) => {
    try {
      const product = await inventoryApi.createProduct(productData);
      return product;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'inventory/updateProduct',
  async ({ id, productData }: { id: string; productData: Partial<Product> }, { rejectWithValue }) => {
    try {
      const product = await inventoryApi.updateProduct(id, productData);
      return product;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update product');
    }
  }
);

export const updateInventoryQuantity = createAsyncThunk(
  'inventory/updateInventoryQuantity',
  async ({ id, quantity }: { id: string; quantity: number }, { rejectWithValue }) => {
    try {
      const product = await inventoryApi.updateInventoryQuantity(id, quantity);
      return product;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update inventory');
    }
  }
);

export const fetchLowStockProducts = createAsyncThunk(
  'inventory/fetchLowStockProducts',
  async (threshold: number = 10, { rejectWithValue }) => {
    try {
      const products = await inventoryApi.getLowStockProducts(threshold);
      return products;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch low stock products');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    setPagination: (state, action: PayloadAction<{ page: number; pageSize: number; total: number }>) => {
      state.pagination = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch single product
      .addCase(fetchProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update inventory quantity
      .addCase(updateInventoryQuantity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateInventoryQuantity.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
      })
      .addCase(updateInventoryQuantity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch low stock products
      .addCase(fetchLowStockProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLowStockProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lowStockProducts = action.payload;
      })
      .addCase(fetchLowStockProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedProduct, setPagination } = inventorySlice.actions;
export default inventorySlice.reducer;
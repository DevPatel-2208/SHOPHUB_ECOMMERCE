import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params = {}) => {
  const { page = 1, limit = 10, search, category, subcategory, brand, sort, order, isActive } = params;
  const query = new URLSearchParams({ page, limit });
  if (search) query.append('search', search);
  if (category) query.append('category', category);
  if (subcategory) query.append('subcategory', subcategory);
  if (brand) query.append('brand', brand);
  if (sort) query.append('sort', sort);
  if (order) query.append('order', order);
  if (isActive) query.append('isActive', isActive);
  const { data } = await api.get(`/admin/products?${query.toString()}`);
  return data;
});

export const fetchProduct = createAsyncThunk('products/fetchOne', async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
});

export const createProduct = createAsyncThunk('products/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create product');
  }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update product');
  }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/products/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete product');
  }
});

export const toggleProductStatus = createAsyncThunk('products/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/admin/products/${id}/status`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to toggle status');
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    products: [],
    currentProduct: null,
    totalPages: 1,
    currentPage: 1,
    total: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearCurrentProduct: (state) => { state.currentProduct = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.isLoading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products || [];
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchProducts.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchProduct.pending, (state) => { state.isLoading = true; })
      .addCase(fetchProduct.fulfilled, (state, action) => { state.isLoading = false; state.currentProduct = action.payload.product; })
      .addCase(fetchProduct.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(deleteProduct.fulfilled, (state, action) => { state.products = state.products.filter(p => p._id !== action.payload); })
      .addCase(toggleProductStatus.fulfilled, (state, action) => {
        const idx = state.products.findIndex(p => p._id === action.payload.product?._id);
        if (idx !== -1) state.products[idx] = action.payload.product;
      });
  },
});

export const { clearCurrentProduct, clearError } = productSlice.actions;
export default productSlice.reducer;
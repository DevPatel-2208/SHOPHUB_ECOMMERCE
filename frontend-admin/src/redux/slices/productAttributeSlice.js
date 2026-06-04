import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchProductAttributes = createAsyncThunk('productAttributes/fetchAll', async (params = {}) => {
  const { page = 1, limit = 10, product, attribute, category, subcategory, sort, order } = params;
  const query = new URLSearchParams({ page, limit });
  if (product) query.append('product', product);
  if (attribute) query.append('attribute', attribute);
  if (category) query.append('category', category);
  if (subcategory) query.append('subcategory', subcategory);
  if (sort) query.append('sort', sort);
  if (order) query.append('order', order);
  const { data } = await api.get(`/admin/product-attributes?${query.toString()}`);
  return data;
});

export const createProductAttribute = createAsyncThunk('productAttributes/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/admin/product-attributes', formData);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create product attribute'); }
});

export const updateProductAttribute = createAsyncThunk('productAttributes/update', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/admin/product-attributes/${id}`, formData);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update product attribute'); }
});

export const deleteProductAttribute = createAsyncThunk('productAttributes/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/product-attributes/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete product attribute'); }
});

const productAttributeSlice = createSlice({
  name: 'productAttributes',
  initialState: { productAttributes: [], totalPages: 1, currentPage: 1, total: 0, isLoading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductAttributes.pending, (state) => { state.isLoading = true; })
      .addCase(fetchProductAttributes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productAttributes = action.payload.productAttributes || [];
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchProductAttributes.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createProductAttribute.fulfilled, (state, action) => { state.productAttributes.unshift(action.payload.productAttribute); })
      .addCase(updateProductAttribute.fulfilled, (state, action) => {
        const idx = state.productAttributes.findIndex(pa => pa._id === action.payload.productAttribute._id);
        if (idx !== -1) state.productAttributes[idx] = action.payload.productAttribute;
      })
      .addCase(deleteProductAttribute.fulfilled, (state, action) => { state.productAttributes = state.productAttributes.filter(pa => pa._id !== action.payload); });
  },
});

export const { clearError } = productAttributeSlice.actions;
export default productAttributeSlice.reducer;
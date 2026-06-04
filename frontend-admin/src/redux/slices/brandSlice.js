import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchBrands = createAsyncThunk('brands/fetchAll', async (params = {}) => {
  const { page = 1, limit = 10, search, subcategory, category, isActive, sort, order } = params;
  const query = new URLSearchParams({ page, limit });
  if (search) query.append('search', search);
  if (subcategory) query.append('subcategory', subcategory);
  if (category) query.append('category', category);
  if (isActive) query.append('isActive', isActive);
  if (sort) query.append('sort', sort);
  if (order) query.append('order', order);
  const { data } = await api.get(`/admin/brands?${query.toString()}`);
  return data;
});

export const createBrand = createAsyncThunk('brands/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/admin/brands', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create brand'); }
});

export const updateBrand = createAsyncThunk('brands/update', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/admin/brands/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update brand'); }
});

export const deleteBrand = createAsyncThunk('brands/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/brands/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete brand'); }
});

export const toggleBrandStatus = createAsyncThunk('brands/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/admin/brands/${id}/status`);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to toggle status'); }
});

const brandSlice = createSlice({
  name: 'brands',
  initialState: { brands: [], totalPages: 1, currentPage: 1, total: 0, isLoading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => { state.isLoading = true; })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.isLoading = false;
        state.brands = action.payload.brands || [];
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchBrands.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createBrand.fulfilled, (state, action) => { state.brands.unshift(action.payload.brand); })
      .addCase(updateBrand.fulfilled, (state, action) => {
        const idx = state.brands.findIndex(b => b._id === action.payload.brand._id);
        if (idx !== -1) state.brands[idx] = action.payload.brand;
      })
      .addCase(deleteBrand.fulfilled, (state, action) => { state.brands = state.brands.filter(b => b._id !== action.payload); })
      .addCase(toggleBrandStatus.fulfilled, (state, action) => {
        const idx = state.brands.findIndex(b => b._id === action.payload.brand._id);
        if (idx !== -1) state.brands[idx] = action.payload.brand;
      });
  },
});

export const { clearError } = brandSlice.actions;
export default brandSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (params = {}) => {
  const { page = 1, limit = 10, search, isActive, sort, order } = params;
  const query = new URLSearchParams({ page, limit });
  if (search) query.append('search', search);
  if (isActive) query.append('isActive', isActive);
  if (sort) query.append('sort', sort);
  if (order) query.append('order', order);
  const { data } = await api.get(`/categories/admin?${query.toString()}`);
  return data;
});

export const fetchAllCategories = createAsyncThunk('categories/fetchAllList', async () => {
  const { data } = await api.get('/categories');
  return data;
});

export const createCategory = createAsyncThunk('categories/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create category'); }
});

export const updateCategory = createAsyncThunk('categories/update', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/categories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update category'); }
});

export const deleteCategory = createAsyncThunk('categories/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/categories/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete category'); }
});

const categorySlice = createSlice({
  name: 'categories',
  initialState: { categories: [], allCategories: [], isLoading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.isLoading = false; state.categories = action.payload.categories || []; })
      .addCase(fetchCategories.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchAllCategories.fulfilled, (state, action) => { state.allCategories = action.payload.categories || []; })
      .addCase(createCategory.fulfilled, (state, action) => { state.categories.unshift(action.payload.category); })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.categories.findIndex(c => c._id === action.payload.category._id);
        if (idx !== -1) state.categories[idx] = action.payload.category;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => { state.categories = state.categories.filter(c => c._id !== action.payload); });
  },
});

export const { clearError } = categorySlice.actions;
export default categorySlice.reducer;
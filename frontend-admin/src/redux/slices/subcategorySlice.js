import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchSubcategories = createAsyncThunk('subcategories/fetchAll', async (params = {}) => {
  const { page = 1, limit = 10, search, category, isActive, sort, order } = params;
  const query = new URLSearchParams({ page, limit });
  if (search) query.append('search', search);
  if (category) query.append('category', category);
  if (isActive) query.append('isActive', isActive);
  if (sort) query.append('sort', sort);
  if (order) query.append('order', order);
  const { data } = await api.get(`/categories/subcategories/admin?${query.toString()}`);
  return data;
});

export const fetchAllSubcategories = createAsyncThunk('subcategories/fetchAllList', async (categoryId) => {
  const query = categoryId ? `?category=${categoryId}` : '';
  const { data } = await api.get(`/categories/subcategories${query}`);
  return data;
});

export const createSubcategory = createAsyncThunk('subcategories/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/categories/subcategories', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create subcategory'); }
});

export const updateSubcategory = createAsyncThunk('subcategories/update', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/categories/subcategories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update subcategory'); }
});

export const deleteSubcategory = createAsyncThunk('subcategories/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/categories/subcategories/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete subcategory'); }
});

const subcategorySlice = createSlice({
  name: 'subcategories',
  initialState: { subcategories: [], allSubcategories: [], isLoading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubcategories.pending, (state) => { state.isLoading = true; })
      .addCase(fetchSubcategories.fulfilled, (state, action) => { state.isLoading = false; state.subcategories = action.payload.subcategories || []; })
      .addCase(fetchSubcategories.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchAllSubcategories.fulfilled, (state, action) => { state.allSubcategories = action.payload.subcategories || []; })
      .addCase(createSubcategory.fulfilled, (state, action) => { state.subcategories.unshift(action.payload.subcategory); })
      .addCase(updateSubcategory.fulfilled, (state, action) => {
        const idx = state.subcategories.findIndex(s => s._id === action.payload.subcategory._id);
        if (idx !== -1) state.subcategories[idx] = action.payload.subcategory;
      })
      .addCase(deleteSubcategory.fulfilled, (state, action) => { state.subcategories = state.subcategories.filter(s => s._id !== action.payload); });
  },
});

export const { clearError } = subcategorySlice.actions;
export default subcategorySlice.reducer;
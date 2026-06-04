import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchAttributes = createAsyncThunk('attributes/fetchAll', async (params = {}) => {
  const { page = 1, limit = 10, search, category, subcategory, brand, isActive, sort, order } = params;
  const query = new URLSearchParams({ page, limit });
  if (search) query.append('search', search);
  if (category) query.append('category', category);
  if (subcategory) query.append('subcategory', subcategory);
  if (brand) query.append('brand', brand);
  if (isActive) query.append('isActive', isActive);
  if (sort) query.append('sort', sort);
  if (order) query.append('order', order);
  const { data } = await api.get(`/admin/attributes?${query.toString()}`);
  return data;
});

export const createAttribute = createAsyncThunk('attributes/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/admin/attributes', formData);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create attribute'); }
});

export const updateAttribute = createAsyncThunk('attributes/update', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/admin/attributes/${id}`, formData);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update attribute'); }
});

export const deleteAttribute = createAsyncThunk('attributes/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/attributes/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete attribute'); }
});

const attributeSlice = createSlice({
  name: 'attributes',
  initialState: { attributes: [], totalPages: 1, currentPage: 1, total: 0, isLoading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttributes.pending, (state) => { state.isLoading = true; })
      .addCase(fetchAttributes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attributes = action.payload.attributes || [];
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchAttributes.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createAttribute.fulfilled, (state, action) => { state.attributes.unshift(action.payload.attribute); })
      .addCase(updateAttribute.fulfilled, (state, action) => {
        const idx = state.attributes.findIndex(a => a._id === action.payload.attribute._id);
        if (idx !== -1) state.attributes[idx] = action.payload.attribute;
      })
      .addCase(deleteAttribute.fulfilled, (state, action) => { state.attributes = state.attributes.filter(a => a._id !== action.payload); });
  },
});

export const { clearError } = attributeSlice.actions;
export default attributeSlice.reducer;
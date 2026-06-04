import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchOffers = createAsyncThunk('offers/fetchAll', async (params = {}) => {
  const { page = 1, limit = 10, search, status, applyOn, isActive, sort, order } = params;
  const query = new URLSearchParams({ page, limit });
  if (search) query.append('search', search);
  if (status) query.append('status', status);
  if (applyOn) query.append('applyOn', applyOn);
  if (isActive) query.append('isActive', isActive);
  if (sort) query.append('sort', sort);
  if (order) query.append('order', order);
  const { data } = await api.get(`/admin/offers?${query.toString()}`);
  return data;
});

export const fetchOffer = createAsyncThunk('offers/fetchOne', async (id) => {
  const { data } = await api.get(`/admin/offers/${id}`);
  return data;
});

export const createOffer = createAsyncThunk('offers/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/admin/offers', formData);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create offer'); }
});

export const updateOffer = createAsyncThunk('offers/update', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/admin/offers/${id}`, formData);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update offer'); }
});

export const deleteOffer = createAsyncThunk('offers/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/offers/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete offer'); }
});

export const toggleOfferStatus = createAsyncThunk('offers/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/admin/offers/${id}/status`);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to toggle status'); }
});

const offerSlice = createSlice({
  name: 'offers',
  initialState: { offers: [], stats: null, totalPages: 1, currentPage: 1, total: 0, isLoading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOffers.pending, (state) => { state.isLoading = true; })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.offers = action.payload.offers || [];
        state.stats = action.payload.stats || null;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchOffers.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchOffer.fulfilled, (state, action) => { state.currentOffer = action.payload.offer; })
      .addCase(createOffer.fulfilled, (state, action) => { state.offers.unshift(action.payload.offer); })
      .addCase(updateOffer.fulfilled, (state, action) => {
        const idx = state.offers.findIndex(o => o._id === action.payload.offer._id);
        if (idx !== -1) state.offers[idx] = action.payload.offer;
      })
      .addCase(deleteOffer.fulfilled, (state, action) => { state.offers = state.offers.filter(o => o._id !== action.payload); })
      .addCase(toggleOfferStatus.fulfilled, (state, action) => {
        const idx = state.offers.findIndex(o => o._id === action.payload.offer._id);
        if (idx !== -1) state.offers[idx] = action.payload.offer;
      });
  },
});

export const { clearError } = offerSlice.actions;
export default offerSlice.reducer;
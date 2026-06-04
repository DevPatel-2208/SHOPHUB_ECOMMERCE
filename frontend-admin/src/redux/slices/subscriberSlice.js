import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch subscribers with pagination, search, filter
export const fetchSubscribers = createAsyncThunk(
  'subscribers/fetchSubscribers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search = '', status = '' } = params;
      const queryString = new URLSearchParams({ page, limit, search, status }).toString();
      const { data } = await api.get(`/admin/subscribers?${queryString}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscribers');
    }
  }
);

// Add a new subscriber
export const addSubscriber = createAsyncThunk(
  'subscribers/addSubscriber',
  async (subscriberData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/admin/subscribers', subscriberData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add subscriber');
    }
  }
);

// Toggle subscriber status
export const toggleSubscriberStatus = createAsyncThunk(
  'subscribers/toggleSubscriberStatus',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/subscribers/${id}/status`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle subscriber status');
    }
  }
);

// Delete subscriber
export const deleteSubscriber = createAsyncThunk(
  'subscribers/deleteSubscriber',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/admin/subscribers/${id}`);
      return { id, ...data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete subscriber');
    }
  }
);

// Export subscribers CSV
export const exportSubscribers = createAsyncThunk(
  'subscribers/exportSubscribers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/subscribers/export', { responseType: 'blob' });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to export subscribers');
    }
  }
);

const subscriberSlice = createSlice({
  name: 'subscribers',
  initialState: {
    subscribers: [],
    totalPages: 1,
    currentPage: 1,
    total: 0,
    isLoading: false,
    isExporting: false,
    error: null,
    success: null,
  },
  reducers: {
    clearSubscriberMessages: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Subscribers
      .addCase(fetchSubscribers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscribers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscribers = action.payload.subscribers;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.total = action.payload.total;
      })
      .addCase(fetchSubscribers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add Subscriber
      .addCase(addSubscriber.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addSubscriber.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscribers.unshift(action.payload.subscriber);
        state.total += 1;
        state.success = 'Subscriber added successfully';
      })
      .addCase(addSubscriber.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Toggle Subscriber Status
      .addCase(toggleSubscriberStatus.fulfilled, (state, action) => {
        const index = state.subscribers.findIndex(
          (s) => s._id === action.payload.subscriber._id
        );
        if (index !== -1) {
          state.subscribers[index].isActive = action.payload.subscriber.isActive;
        }
        state.success = 'Subscriber status updated';
      })
      .addCase(toggleSubscriberStatus.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete Subscriber
      .addCase(deleteSubscriber.fulfilled, (state, action) => {
        state.subscribers = state.subscribers.filter(
          (s) => s._id !== action.payload.id
        );
        state.total -= 1;
        state.success = 'Subscriber deleted successfully';
      })
      .addCase(deleteSubscriber.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Export Subscribers
      .addCase(exportSubscribers.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportSubscribers.fulfilled, (state) => {
        state.isExporting = false;
        state.success = 'Subscribers exported successfully';
      })
      .addCase(exportSubscribers.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload;
      });
  },
});

export const { clearSubscriberMessages } = subscriberSlice.actions;
export default subscriberSlice.reducer;
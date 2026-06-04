import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch orders with pagination, search, filter, sort
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search = '', status = '', sort = '-createdAt' } = params;
      const queryString = new URLSearchParams({ page, limit, search, status, sort }).toString();
      const { data } = await api.get(`/admin/orders?${queryString}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

// Fetch single order
export const fetchOrder = createAsyncThunk(
  'orders/fetchOrder',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/admin/orders/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
    }
  }
);

// Update order status
export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status, note }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/orders/${id}/status`, { status, note });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

// Update order tracking
export const updateOrderTracking = createAsyncThunk(
  'orders/updateOrderTracking',
  async ({ id, trackingData }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/orders/${id}/tracking`, trackingData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tracking');
    }
  }
);

// Delete order
export const deleteOrder = createAsyncThunk(
  'orders/deleteOrder',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/admin/orders/${id}`);
      return { id, ...data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete order');
    }
  }
);

// Fetch order stats for dashboard
export const fetchOrderStats = createAsyncThunk(
  'orders/fetchOrderStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/orders/stats');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order stats');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    currentOrder: null,
    stats: {
      totalOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      refundedOrders: 0,
      totalRevenue: 0,
    },
    totalPages: 1,
    currentPage: 1,
    total: 0,
    isLoading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearOrderMessages: (state) => {
      state.error = null;
      state.success = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.total = action.payload.total;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single Order
      .addCase(fetchOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.order;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (o) => o._id === action.payload.order._id
        );
        if (index !== -1) {
          state.orders[index] = action.payload.order;
        }
        if (state.currentOrder && state.currentOrder._id === action.payload.order._id) {
          state.currentOrder = action.payload.order;
        }
        state.success = 'Order status updated successfully';
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Update Order Tracking
      .addCase(updateOrderTracking.fulfilled, (state, action) => {
        if (state.currentOrder && state.currentOrder._id === action.payload.order._id) {
          state.currentOrder = action.payload.order;
        }
        state.success = 'Tracking updated successfully';
      })
      .addCase(updateOrderTracking.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete Order
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter((o) => o._id !== action.payload.id);
        state.total -= 1;
        state.success = 'Order deleted successfully';
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch Order Stats
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.stats = action.payload.stats;
      })
      .addCase(fetchOrderStats.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearOrderMessages, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
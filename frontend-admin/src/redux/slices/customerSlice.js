import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch customers with pagination, search, filter
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search = '', role = '', status = '', sort = '-createdAt' } = params;
      const queryString = new URLSearchParams({ page, limit, search, role, status, sort }).toString();
      const { data } = await api.get(`/admin/customers?${queryString}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
    }
  }
);

// Fetch single customer
export const fetchCustomer = createAsyncThunk(
  'customers/fetchCustomer',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/admin/customers/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer');
    }
  }
);

// Update customer
export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, customerData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/admin/customers/${id}`, customerData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer');
    }
  }
);

// Delete customer
export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/admin/customers/${id}`);
      return { id, ...data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete customer');
    }
  }
);

// Toggle customer status (block/unblock)
export const toggleCustomerStatus = createAsyncThunk(
  'customers/toggleCustomerStatus',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/customers/${id}/status`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle customer status');
    }
  }
);

// Fetch customer stats
export const fetchCustomerStats = createAsyncThunk(
  'customers/fetchCustomerStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/customers/stats');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer stats');
    }
  }
);

const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    customers: [],
    currentCustomer: null,
    stats: {
      totalCustomers: 0,
      activeCustomers: 0,
      blockedCustomers: 0,
      newCustomersThisMonth: 0,
    },
    totalPages: 1,
    currentPage: 1,
    total: 0,
    isLoading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearCustomerMessages: (state) => {
      state.error = null;
      state.success = null;
    },
    clearCurrentCustomer: (state) => {
      state.currentCustomer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers = action.payload.customers || [];
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single Customer
      .addCase(fetchCustomer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCustomer = action.payload.customer || null;
      })
      .addCase(fetchCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Customer
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const updated = action.payload.customer;
        if (updated) {
          const index = state.customers.findIndex((c) => c._id === updated._id);
          if (index !== -1) state.customers[index] = updated;
          if (state.currentCustomer && state.currentCustomer._id === updated._id) {
            state.currentCustomer = updated;
          }
        }
        state.success = 'Customer updated successfully';
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete Customer
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter((c) => c._id !== action.payload.id);
        state.total -= 1;
        state.success = 'Customer deleted successfully';
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Toggle Customer Status
      .addCase(toggleCustomerStatus.fulfilled, (state, action) => {
        const updated = action.payload.customer;
        if (updated) {
          const index = state.customers.findIndex((c) => c._id === updated._id);
          if (index !== -1) state.customers[index] = updated;
          if (state.currentCustomer && state.currentCustomer._id === updated._id) {
            state.currentCustomer = updated;
          }
        }
        state.success = 'Customer status updated';
      })
      .addCase(toggleCustomerStatus.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch Customer Stats
      .addCase(fetchCustomerStats.fulfilled, (state, action) => {
        state.stats = action.payload.stats || state.stats;
      })
      .addCase(fetchCustomerStats.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearCustomerMessages, clearCurrentCustomer } = customerSlice.actions;
export default customerSlice.reducer;
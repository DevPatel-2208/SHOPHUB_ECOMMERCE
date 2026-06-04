import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api.js'

export const fetchOrders = createAsyncThunk('order/fetchOrders', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/orders')
    return data.orders
  } catch (error) {
    return rejectWithValue(error.response?.data?.message)
  }
})

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orders: [],
    currentOrder: null,
    isLoading: false,
  },
  reducers: {
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => { state.isLoading = true })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false
        state.orders = action.payload
      })
      .addCase(fetchOrders.rejected, (state) => {
        state.isLoading = false
      })
  },
})

export const { setCurrentOrder } = orderSlice.actions
export default orderSlice.reducer

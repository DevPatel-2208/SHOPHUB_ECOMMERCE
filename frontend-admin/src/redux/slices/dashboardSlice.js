import { createSlice } from '@reduxjs/toolkit'

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    isLoading: false,
  },
  reducers: {
    setStats: (state, action) => {
      state.stats = action.payload
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
  },
})

export const { setStats, setLoading } = dashboardSlice.actions
export default dashboardSlice.reducer
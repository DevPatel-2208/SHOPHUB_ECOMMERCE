import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Send newsletter
export const sendNewsletter = createAsyncThunk(
  'newsletter/sendNewsletter',
  async (newsletterData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/admin/newsletter/send', newsletterData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send newsletter');
    }
  }
);

// Get newsletter stats
export const fetchNewsletterStats = createAsyncThunk(
  'newsletter/fetchNewsletterStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/newsletter/stats');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch newsletter stats');
    }
  }
);

const newsletterSlice = createSlice({
  name: 'newsletter',
  initialState: {
    stats: {
      totalSent: 0,
      totalSubscribers: 0,
      lastSentAt: null,
    },
    isSending: false,
    isLoadingStats: false,
    error: null,
    success: null,
  },
  reducers: {
    clearNewsletterMessages: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send Newsletter
      .addCase(sendNewsletter.pending, (state) => {
        state.isSending = true;
        state.error = null;
        state.success = null;
      })
      .addCase(sendNewsletter.fulfilled, (state, action) => {
        state.isSending = false;
        state.success = action.payload.message || 'Newsletter sent successfully';
        state.stats.totalSent += action.payload.sentCount || 0;
      })
      .addCase(sendNewsletter.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload;
      })
      // Fetch Newsletter Stats
      .addCase(fetchNewsletterStats.pending, (state) => {
        state.isLoadingStats = true;
      })
      .addCase(fetchNewsletterStats.fulfilled, (state, action) => {
        state.isLoadingStats = false;
        state.stats = action.payload.stats;
      })
      .addCase(fetchNewsletterStats.rejected, (state, action) => {
        state.isLoadingStats = false;
        state.error = action.payload;
      });
  },
});

export const { clearNewsletterMessages } = newsletterSlice.actions;
export default newsletterSlice.reducer;
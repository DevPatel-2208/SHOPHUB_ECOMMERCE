import Subscriber from '../models/Subscriber.js';
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Send newsletter
// @route   POST /api/admin/newsletter/send
export const sendNewsletter = async (req, res) => {
  try {
    const { subject, content, htmlContent, sendToAll, testEmail } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ success: false, message: 'Subject and content are required' });
    }

    // If test email
    if (testEmail) {
      await sendEmail({
        to: testEmail,
        subject,
        html: htmlContent || `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">${content}</div>`,
      });
      return res.json({ success: true, message: 'Test email sent successfully' });
    }

    // Get active subscribers
    const subscribers = sendToAll
      ? await Subscriber.find({ isActive: true }).select('email name')
      : await Subscriber.find({ isActive: true, _id: { $in: req.body.subscriberIds } }).select('email name');

    if (subscribers.length === 0) {
      return res.status(400).json({ success: false, message: 'No active subscribers found' });
    }

    // Send emails in batches
    const batchSize = 50;
    const totalBatches = Math.ceil(subscribers.length / batchSize);
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < totalBatches; i++) {
      const batch = subscribers.slice(i * batchSize, (i + 1) * batchSize);
      const promises = batch.map(async (subscriber) => {
        try {
          await sendEmail({
            to: subscriber.email,
            subject,
            html: htmlContent || `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">${content}</div>`,
          });
          sentCount++;
        } catch (err) {
          failedCount++;
          console.error(`Failed to send to ${subscriber.email}:`, err.message);
        }
      });
      await Promise.allSettled(promises);
    }

    res.json({
      success: true,
      message: `Newsletter sent to ${sentCount} subscribers`,
      sentCount,
      failedCount,
      totalSubscribers: subscribers.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get newsletter stats
// @route   GET /api/admin/newsletter/stats
export const getNewsletterStats = async (req, res) => {
  try {
    const totalSubscribers = await Subscriber.countDocuments({ isActive: true });
    const totalAll = await Subscriber.countDocuments();
    res.json({ success: true, stats: { activeSubscribers: totalSubscribers, totalSubscribers: totalAll } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
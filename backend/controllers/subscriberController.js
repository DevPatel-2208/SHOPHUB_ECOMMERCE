import Subscriber from '../models/Subscriber.js';

// @desc    Get all subscribers
// @route   GET /api/admin/subscribers
export const getSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (search) query.email = { $regex: search, $options: 'i' };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const subscribers = await Subscriber.find(query).sort(sortObj).limit(limit * 1).skip((page - 1) * limit);
    const count = await Subscriber.countDocuments(query);

    res.json({ success: true, subscribers, totalPages: Math.ceil(count / limit), currentPage: Number(page), total: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add subscriber manually
// @route   POST /api/admin/subscribers
export const addSubscriber = async (req, res) => {
  try {
    const { email, name, source } = req.body;
    const subscriber = await Subscriber.create({ email, name: name || '', source: source || 'manual' });
    res.status(201).json({ success: true, subscriber });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Email already subscribed' });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle subscriber status
// @route   PATCH /api/admin/subscribers/:id/status
export const toggleSubscriberStatus = async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ success: false, message: 'Subscriber not found' });
    subscriber.isActive = !subscriber.isActive;
    subscriber.unsubscribedAt = subscriber.isActive ? null : new Date();
    await subscriber.save();
    res.json({ success: true, subscriber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete subscriber
// @route   DELETE /api/admin/subscribers/:id
export const deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) return res.status(404).json({ success: false, message: 'Subscriber not found' });
    res.json({ success: true, message: 'Subscriber deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export subscribers CSV
// @route   GET /api/admin/subscribers/export
export const exportSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find({ isActive: true }).select('email name source subscribedAt createdAt');
    const csvHeader = 'Email,Name,Source,Subscribed At,Created At\n';
    const csvData = subscribers.map(s => `${s.email},${s.name},${s.source},${s.subscribedAt?.toISOString() || ''},${s.createdAt.toISOString()}`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
    res.send(csvHeader + csvData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
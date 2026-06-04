import Shipment from '../models/Shipment.js';
import Order from '../models/Order.js';

// @desc    Get all shipments (Admin)
// @route   GET /api/shipments
export const getShipments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const shipments = await Shipment.find(query)
      .populate('order', 'orderItems totalPrice status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Shipment.countDocuments(query);
    res.json({ success: true, shipments, totalPages: Math.ceil(count / limit), currentPage: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create/update shipment (Admin)
// @route   PUT /api/shipments/:orderId
export const updateShipment = async (req, res) => {
  try {
    const { awb, courier, status, timeline, estimatedDelivery } = req.body;

    let shipment = await Shipment.findOne({ order: req.params.orderId });
    if (!shipment) {
      shipment = new Shipment({ order: req.params.orderId });
    }

    if (awb) shipment.awb = awb;
    if (courier) shipment.courier = courier;
    if (status) shipment.status = status;
    if (estimatedDelivery) shipment.estimatedDelivery = estimatedDelivery;
    if (timeline) shipment.timeline.push(timeline);

    await shipment.save();

    // Update order tracking
    await Order.findByIdAndUpdate(req.params.orderId, {
      shipmentRef: shipment._id,
      trackingStatus: status === 'delivered' ? 'delivered' : undefined,
    });

    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Track by AWB (Public)
// @route   GET /api/shipments/track/:awb
export const trackByAWB = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ awb: req.params.awb }).populate('order', 'status totalPrice');
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    awb: { type: String, unique: true, sparse: true },
    courier: { type: String },
    courierId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'label_generated', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    timeline: [
      {
        status: String,
        location: String,
        remark: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date },
    shippingLabel: { type: String },
    weight: { type: Number },
    dimensions: { length: Number, width: Number, height: Number },
    charges: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Shipment = mongoose.model('Shipment', shipmentSchema);
export default Shipment;

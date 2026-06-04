import mongoose from 'mongoose';

const specKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'boolean', 'select'], default: 'text' },
    options: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    isFilterable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SpecKey = mongoose.model('SpecKey', specKeySchema);
export default SpecKey;

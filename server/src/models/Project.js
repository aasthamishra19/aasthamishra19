import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    key: { type: String, required: true, uppercase: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
  },
  { timestamps: true }
);

projectSchema.index({ key: 1 }, { unique: true });

export default mongoose.model('Project', projectSchema);

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const columnSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => uuidv4() },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, default: 'Main board' },
    columns: [columnSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Board', boardSchema);

import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    columnId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    labels: [{ type: String }],
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

taskSchema.index({ board: 1, columnId: 1, order: 1 });

export default mongoose.model('Task', taskSchema);

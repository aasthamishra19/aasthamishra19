import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['assign', 'comment', 'mention', 'sprint', 'project'],
      default: 'assign',
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    read: { type: Boolean, default: false },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);

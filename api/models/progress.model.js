import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
        progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
        lastReadPosition: { type: Number, default: 0, min: 0 },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

progressSchema.index({ user: 1, post: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;

import mongoose from 'mongoose';

const seriesSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String, default: '' },
        category: { type: String, default: 'uncategorized' },
        published: { type: Boolean, default: false },
    },
    { timestamps: true }
);

seriesSchema.index({ published: 1, createdAt: -1 });

const Series = mongoose.model('Series', seriesSchema);
export default Series;

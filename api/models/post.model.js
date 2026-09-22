import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, required: true, unique: true },
        content: { type: String, required: true },
        excerpt: { type: String, default: '' },
        coverImage: { type: String, default: '' },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        category: { type: String, default: 'uncategorized' },
        tags: { type: [String], default: [] },
        published: { type: Boolean, default: false },
        readTimeMins: { type: Number, default: 1 },
        series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', default: null },
        seriesOrder: { type: Number, default: null },
    },
    { timestamps: true }
);

postSchema.index({ published: 1, createdAt: -1 });
postSchema.index({ category: 1, published: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ series: 1, seriesOrder: 1 });
postSchema.index(
    { title: 'text', tags: 'text', excerpt: 'text', content: 'text' },
    { weights: { title: 10, tags: 5, excerpt: 3, content: 1 }, name: 'post_text' }
);

const Post = mongoose.model('Post', postSchema);
export default Post;

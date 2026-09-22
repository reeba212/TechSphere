import mongoose from 'mongoose';
import { EMBEDDING_DIMENSIONS } from '../utils/aiClient.js';

const chunkSchema = new mongoose.Schema(
    {
        post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
        text: { type: String, required: true },
        embedding: {
            type: [Number],
            required: true,
            validate: {
                validator: (v) => v.length === EMBEDDING_DIMENSIONS,
                message: `embedding must have ${EMBEDDING_DIMENSIONS} dimensions`,
            },
        },
        position: { type: Number, required: true },
        headingPath: { type: String, default: null },
    },
    { timestamps: true }
);

// Used to delete/replace a post's chunks on re-index; the vector index itself
// (on `embedding`) is created separately in Atlas (M0 has no Mongoose API for it).
chunkSchema.index({ post: 1, position: 1 });

const Chunk = mongoose.model('Chunk', chunkSchema);
export default Chunk;

import { v2 as cloudinary } from 'cloudinary';
import { errorHandler } from './error.js';

// Credentials come from CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
// in the server's environment. Configured lazily so tests and dev work without them.
let configured = false;
const configure = () => {
    if (configured) return;
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw errorHandler(503, 'Image uploads are not configured on the server');
    }
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
    });
    configured = true;
};

export const uploadImageBuffer = (buffer) => {
    configure();
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'techsphere', resource_type: 'image' },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
    });
};

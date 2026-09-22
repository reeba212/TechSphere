import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';
import { seedCategories } from './utils/seedCategories.js';

dotenv.config();

const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO)
    .then(async () => {
        console.log('MongoDB is connected');
        await seedCategories();
    })
    .catch((err) => console.log(err));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

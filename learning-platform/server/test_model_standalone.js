
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("URI:", process.env.MONGODB_URI);

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB.");

        // Try to require the model
        try {
            const Content = require('./models/Content');
            console.log("Model Loaded:", Content.modelName);

            const count = await Content.countDocuments();
            console.log("Content Count:", count);

            const first = await Content.findOne();
            console.log("First Doc:", first ? first.title : "None");

        } catch (e) {
            console.error("Model Error:", e);
        }

    } catch (err) {
        console.error("Connection Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

run();


const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Content = require('./models/Content'); // Check if this path is correct relative to execution

dotenv.config({ path: path.resolve(__dirname, '.env') });

const debugModel = async () => {
    try {
        console.log("URI:", process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        console.log("Model Collection Name:", Content.collection.name);

        const count = await Content.countDocuments();
        console.log("Count via Model:", count);

        const items = await Content.find().limit(1);
        console.log("First Item via Model:", JSON.stringify(items, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

debugModel();


const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Content = require('../models/Content');
const { upsertContent } = require('../services/vectorStore');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const indexAll = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        const contents = await Content.find({});
        console.log(`Found ${contents.length} documents. Indexing...`);

        for (const doc of contents) {
            console.log(`Indexing: ${doc.title}`);
            await upsertContent(doc);
        }

        console.log("Indexing Complete! 🎉");
        process.exit(0);
    } catch (error) {
        console.error("Indexing Failed:", error);
        process.exit(1);
    }
};

indexAll();

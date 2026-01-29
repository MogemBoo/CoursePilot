
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const checkDB = async () => {
    try {
        let report = "DB Report:\n";
        await mongoose.connect(process.env.MONGODB_URI);
        report += "Connected!\n";

        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const dbs = await admin.listDatabases();
        report += "Databases: " + dbs.databases.map(db => db.name).join(', ') + "\n";

        report += "\n--- Checking 'learning_platform' ---\n";
        const collections = await mongoose.connection.db.listCollections().toArray();
        if (collections.length === 0) report += "No collections found.\n";
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            report += ` - ${col.name}: ${count}\n`;
        }

        report += "\n--- Checking 'test' DB (Default) ---\n";
        const testDb = mongoose.connection.useDb('test');
        const testCollections = await testDb.db.listCollections().toArray();
        if (testCollections.length === 0) report += "No collections found.\n";
        for (const col of testCollections) {
            const count = await testDb.db.collection(col.name).countDocuments();
            report += ` - ${col.name}: ${count}\n`;
        }

        fs.writeFileSync(path.resolve(__dirname, 'db_report.txt'), report);
        console.log("Report written to db_report.txt");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkDB();

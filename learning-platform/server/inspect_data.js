
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const col = mongoose.connection.db.collection('coursematerials');
        const fs = require('fs');
        // ...
        const doc = await col.findOne({});
        fs.writeFileSync(path.resolve(__dirname, 'doc_inspect.txt'), JSON.stringify(doc, null, 2));
        console.log("Written to doc_inspect.txt");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkData();

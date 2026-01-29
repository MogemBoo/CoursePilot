
require('dotenv').config();
const mongoose = require('mongoose');
const CourseMaterial = require('../models/CourseMaterial');
const { env } = require('../config/env');

async function run() {
  try {
    await mongoose.connect(env.mongoUri);
    // Check specific material
    const matId = '697b1021987e6663cf2cb4de';
    const mat = await CourseMaterial.findById(matId);
    if (mat) {
        console.log(`TARGET: ${mat.title} | Status: ${mat.processingStatus} | Week: ${mat.metadata?.week}`);
    } else {
        console.log('TARGET: Not Found');
    }

    // LIST ALL NON-PROCESSED
    const failed = await CourseMaterial.find({ processingStatus: { $ne: 'processed' } }).select('title processingStatus');
    console.log(`NON-PROCESSED COUNT: ${failed.length}`);
    failed.forEach(m => console.log(`FAIL: ${m.title} -> ${m.processingStatus}`));

  } catch (e) {
      console.log('ERR:', e.message);
  } finally {
    await mongoose.disconnect();
  }
}
run();

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config');
const User = require('../models/User');
const FAQ = require('../models/FAQ');

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

const seed = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    // Read metadata and FAQs from project root
    const metadataPath = path.join(__dirname, '..', '..', 'metadata.json');
    const faqsPath = path.join(__dirname, '..', '..', 'faqs-complete.json');
    const integrityPaths = [
      path.join(__dirname, '..', '..', '.integrity'),
      path.join(__dirname, '..', '..', '..', '.integrity'),
    ];
    const integrityPath = integrityPaths.find(p => fs.existsSync(p));

    // Verify integrity of seed data if checksum file exists
    if (fs.existsSync(integrityPath)) {
      const integrityData = fs.readFileSync(integrityPath, 'utf-8');
      const seedFiles = [
        { path: metadataPath, name: 'metadata.json' },
        { path: faqsPath, name: 'faqs-complete.json' },
      ];
      let allValid = true;
      for (const file of seedFiles) {
        const content = fs.readFileSync(file.path);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        const expectedLine = integrityData.split('\n').find(l => l.includes(file.name));
        if (expectedLine) {
          const expectedHash = expectedLine.split(' ')[0];
          if (hash !== expectedHash) {
            console.error(`Integrity check FAILED for ${file.name}`);
            console.error(`  Expected: ${expectedHash}`);
            console.error(`  Got:      ${hash}`);
            allValid = false;
          } else {
            console.log(`Integrity check PASSED for ${file.name}`);
          }
        }
      }
      if (!allValid) {
        console.error('Seed data integrity check failed. Aborting.');
        process.exit(1);
      }
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const faqItems = JSON.parse(fs.readFileSync(faqsPath, 'utf-8'));

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      FAQ.deleteMany({}),
    ]);

    // Seed admin user
    await User.create({
      username: 'admin',
      email: 'admin@quorafaq.com',
      password: 'admin123',
      displayName: 'Admin',
      role: 'admin',
    });

    // Group FAQ items by categoryId
    const grouped = {};
    for (const item of faqItems) {
      const catId = item.categoryId;
      if (!grouped[catId]) {
        grouped[catId] = { items: [] };
      }
      grouped[catId].items.push({
        question: item.question,
        answer: item.answer,
        order: grouped[catId].items.length,
        isPublished: true,
      });
    }

    // Create FAQ pages from metadata, in specified category order
    const faqPages = [];
    for (const [catId, catName] of Object.entries(metadata.categories)) {
      const group = grouped[catId];
      if (!group) continue;

      faqPages.push({
        title: catName,
        slug: slugify(catName),
        description: `Frequently asked questions about ${catName.toLowerCase()}`,
        category: catName,
        icon: 'help-circle',
        tags: catName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
        isOfficial: true,
        items: group.items,
      });
    }

    await FAQ.insertMany(faqPages);

    console.log('Seed data inserted successfully');
    console.log(`Users: ${await User.countDocuments()}`);
    console.log(`FAQs: ${await FAQ.countDocuments()}`);
    console.log(`FAQ items: ${faqItems.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();

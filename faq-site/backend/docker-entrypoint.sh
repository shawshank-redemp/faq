#!/bin/sh
set -e

echo "Waiting for MongoDB..."
node -e "
const net = require('net');
const connect = () => {
  const s = net.createConnection(27017, 'mongodb', () => { s.end(); process.exit(0); });
  s.on('error', () => { setTimeout(connect, 1000); });
};
connect();
"

echo "Waiting for Redis..."
node -e "
const net = require('net');
const connect = () => {
  const s = net.createConnection(6379, 'redis', () => { s.end(); process.exit(0); });
  s.on('error', () => { setTimeout(connect, 1000); });
};
connect();
"

if [ "$SKIP_SEED" != "1" ]; then
  echo "Verifying seed data integrity..."
  if [ -f /faqs-complete.json ] && [ -f /metadata.json ]; then
    META_HASH=$(sha256sum /metadata.json | cut -d' ' -f1)
    FAQS_HASH=$(sha256sum /faqs-complete.json | cut -d' ' -f1)
    echo "  metadata.json: $META_HASH"
    echo "  faqs-complete.json: $FAQS_HASH"
  fi

  echo "Checking if seeding is needed..."
  SEED_NEEDED=$(node -e "
    const mongoose = require('mongoose');
    const config = require('./config');
    mongoose.connect(config.mongodb.uri).then(async () => {
      const count = await mongoose.model('FAQ').countDocuments();
      console.log(count === 0 ? 'yes' : 'no');
      await mongoose.disconnect();
      process.exit(0);
    }).catch(() => { console.log('yes'); process.exit(0); });
  " 2>/dev/null || echo "yes")

  if [ "$SEED_NEEDED" = "yes" ]; then
    echo "Seeding database..."
    node seeds/seed.js
  else
    echo "Database already seeded."
  fi
fi

echo "Starting backend..."
exec "$@"

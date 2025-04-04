#!/bin/bash

# Create the data directory if it doesn't exist
mkdir -p /app/data

# Run migrations
echo "Running database migrations..."
node dist/db/migrate.js

# Start the server
echo "Starting feed generator server..."
node dist/index.js 
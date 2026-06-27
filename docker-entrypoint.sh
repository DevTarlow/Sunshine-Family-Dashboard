#!/bin/sh

# Initialize database if it doesn't exist
if [ ! -f "prisma/dev.db" ]; then
    echo "Initializing database..."
    npx prisma db push
fi

echo "Starting Family Dashboard..."
exec npm run start
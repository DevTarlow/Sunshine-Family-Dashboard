#!/bin/bash

echo "========================================"
echo "  Family Dashboard - Quick Start"
echo "========================================"
echo

# Create directories if they don't exist
mkdir -p public/photos
mkdir -p public/backgrounds

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed!"
    echo
    echo "Please install Docker Desktop from:"
    echo "  https://www.docker.com/products/docker-desktop"
    echo
    read -p "Press Enter to exit..."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "ERROR: Docker Compose is not installed!"
    echo
    echo "Please install Docker Desktop from:"
    echo "  https://www.docker.com/products/docker-desktop"
    echo
    read -p "Press Enter to exit..."
    exit 1
fi

echo "Starting Family Dashboard with Docker..."
echo
echo "The dashboard will be available at:"
echo "  http://localhost:3000"
echo
echo "To add photos, put image files in the public/photos folder."
echo
echo "Press Ctrl+C to stop the server."
echo

docker compose up --build
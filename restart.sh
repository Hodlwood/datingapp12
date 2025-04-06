#!/bin/bash

# Kill any existing Next.js processes
echo "Stopping any existing Next.js processes..."
pkill -f "next"

# Wait a moment to ensure processes are killed
sleep 2

# Clear the terminal
clear

# Start the Next.js development server
echo "Starting Next.js development server..."
npm run dev 
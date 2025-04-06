#!/bin/bash

# Check if checkpoint number is provided
if [ -z "$1" ]; then
    echo "Please provide a checkpoint number"
    echo "Usage: ./save-checkpoint.sh <number>"
    exit 1
fi

CHECKPOINT_NUM=$1
CHECKPOINT_DIR="checkpoints/checkpoint$CHECKPOINT_NUM"

# Create checkpoint directory if it doesn't exist
mkdir -p "$CHECKPOINT_DIR"

# Copy key files to checkpoint directory
echo "Saving checkpoint $CHECKPOINT_NUM..."
cp src/app/page.tsx "$CHECKPOINT_DIR/"
cp src/app/onboarding/page.tsx "$CHECKPOINT_DIR/"

echo "Checkpoint $CHECKPOINT_NUM saved successfully!" 
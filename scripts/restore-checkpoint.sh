#!/bin/bash

# Check if checkpoint number is provided
if [ -z "$1" ]; then
    echo "Please provide a checkpoint number"
    echo "Usage: ./restore-checkpoint.sh <number>"
    exit 1
fi

CHECKPOINT_NUM=$1
CHECKPOINT_DIR="checkpoints/checkpoint$CHECKPOINT_NUM"

# Check if checkpoint exists
if [ ! -d "$CHECKPOINT_DIR" ]; then
    echo "Checkpoint $CHECKPOINT_NUM does not exist!"
    exit 1
fi

# Restore files from checkpoint
echo "Restoring checkpoint $CHECKPOINT_NUM..."
cp "$CHECKPOINT_DIR/page.tsx" src/app/
cp "$CHECKPOINT_DIR/onboarding/page.tsx" src/app/onboarding/

echo "Checkpoint $CHECKPOINT_NUM restored successfully!"
echo "Please restart your development server to apply changes." 
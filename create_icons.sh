#!/bin/bash

# Create simple placeholder icons for the Flow extension
# These are minimal 1x1 pixel PNGs that will be resized by Chrome

# Base64 encoded 1x1 purple pixel PNG
ICON_DATA="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Create icons directory if it doesn't exist
mkdir -p icons

# Create 16x16 icon
echo "$ICON_DATA" | base64 -d > icons/icon16.png

# Create 48x48 icon
echo "$ICON_DATA" | base64 -d > icons/icon48.png

# Create 128x128 icon
echo "$ICON_DATA" | base64 -d > icons/icon128.png

echo "Placeholder icons created successfully!"

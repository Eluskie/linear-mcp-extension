#!/bin/bash
# Script to create placeholder icons for the Chrome extension
# Uses ImageMagick to create simple colored squares with "LA" text

# Create a simple SVG icon first
cat > icon.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#2563eb" rx="16"/>
  <text x="64" y="80" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">LA</text>
</svg>
EOF

# Convert to PNG files if ImageMagick/rsvg-convert is available
if command -v rsvg-convert &> /dev/null; then
    rsvg-convert -w 16 -h 16 icon.svg -o icon16.png
    rsvg-convert -w 32 -h 32 icon.svg -o icon32.png
    rsvg-convert -w 48 -h 48 icon.svg -o icon48.png
    rsvg-convert -w 128 -h 128 icon.svg -o icon128.png
    echo "✅ Icons created successfully"
elif command -v convert &> /dev/null; then
    convert icon.svg -resize 16x16 icon16.png
    convert icon.svg -resize 32x32 icon32.png
    convert icon.svg -resize 48x48 icon48.png
    convert icon.svg -resize 128x128 icon128.png
    echo "✅ Icons created successfully"
else
    echo "⚠️ ImageMagick or rsvg-convert not found. Creating placeholder files..."
    # Create empty placeholder files
    touch icon16.png icon32.png icon48.png icon128.png
fi

rm icon.svg
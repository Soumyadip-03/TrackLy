const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../public/logo/TrackLy_Logo.png');
const outputDir = path.join(__dirname, '../public');

// Create a circular mask
async function createCircularMask(size) {
  // Create a round mask by drawing a white circle on a black background
  const circleBuffer = Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
    </svg>`
  );
  return circleBuffer;
}

async function generateFavicon() {
  try {
    console.log('Reading source image...');
    const sourceImage = sharp(sourcePath);
    const metadata = await sourceImage.metadata();
    
    console.log(`Source image dimensions: ${metadata.width}x${metadata.height}`);
    
    // Create square version by cropping if needed
    let processedImage = sourceImage;
    
    if (metadata.width !== metadata.height) {
      const minDimension = Math.min(metadata.width, metadata.height);
      console.log(`Cropping to square: ${minDimension}x${minDimension}`);
      
      // Calculate crop area to get center portion
      const left = Math.max(0, Math.floor((metadata.width - minDimension) / 2));
      const top = Math.max(0, Math.floor((metadata.height - minDimension) / 2));
      
      processedImage = sourceImage.extract({
        left,
        top,
        width: minDimension,
        height: minDimension
      });
    }
    
    // Add padding for better visibility
    const paddedImage = processedImage.clone()
      .resize({
        width: Math.floor(metadata.width * 0.8),
        height: Math.floor(metadata.height * 0.8),
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .extend({
        top: Math.floor(metadata.height * 0.1),
        bottom: Math.floor(metadata.height * 0.1),
        left: Math.floor(metadata.width * 0.1),
        right: Math.floor(metadata.width * 0.1),
        background: { r: 28, g: 100, b: 242, alpha: 1 } // Background color (blue)
      });
      
    // Process each size with the circular mask
    async function createRoundIcon(size, outputName) {
      console.log(`Generating ${size}x${size} ${outputName}...`);
      const roundMask = await createCircularMask(size);
      
      await paddedImage
        .clone()
        .resize(size, size)
        .composite([
          {
            input: roundMask,
            blend: 'dest-in'
          }
        ])
        .toFile(path.join(outputDir, outputName));
    }
    
    // Generate all the favicon sizes
    await createRoundIcon(16, 'favicon-16.png');
    await createRoundIcon(32, 'favicon-32.png');
    await createRoundIcon(48, 'favicon-48.png');
    await createRoundIcon(64, 'favicon.png');
    await createRoundIcon(180, 'apple-touch-icon.png');
    await createRoundIcon(192, 'icon-192.png');
    await createRoundIcon(512, 'icon-512.png');
    
    console.log('All circular favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicon(); 
/**
 * Script to update project version
 * Usage: node update-version.js <version> <description> <comma,separated,changes>
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_ENDPOINT = '/api/project/version';
const TOKEN = process.env.AUTH_TOKEN; // Set your admin auth token as env variable

async function updateProjectVersion() {
  try {
    // Get version info from command line arguments
    const [version, description, changesString] = process.argv.slice(2);
    
    if (!version || !description || !changesString) {
      console.error('Usage: node update-version.js <version> <description> <comma,separated,changes>');
      process.exit(1);
    }
    
    // Parse changes from comma-separated string
    const changes = changesString.split(',').map(change => change.trim());
    
    // Get package.json to extract component versions
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    
    // Extract key component versions
    const components = [
      { name: 'Next.js', version: packageJson.dependencies.next },
      { name: 'React', version: packageJson.dependencies.react },
      { name: 'Tailwind CSS', version: packageJson.devDependencies.tailwindcss }
    ];
    
    // Create version payload
    const versionData = {
      version,
      description,
      changes,
      components,
      author: process.env.USER_NAME || 'System'
    };
    
    console.log('Updating project version with data:', versionData);
    
    // Send data to backend
    const response = await fetch(`${API_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(versionData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update project version');
    }
    
    console.log('Project version updated successfully:', data.data);
    
  } catch (error) {
    console.error('Error updating project version:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  updateProjectVersion();
}

module.exports = { updateProjectVersion }; 
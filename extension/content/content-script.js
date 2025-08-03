// Linear Assistant - Content Script
// This script runs on Linear.app pages to enhance the extension functionality

console.log('🔧 Linear Assistant content script loaded on:', window.location.href);

// Future: Add Linear page integration features
// - Detect issue pages and provide quick actions
// - Add floating action button for quick issue creation
// - Integrate with Linear's UI for seamless workflow

// For now, this is a minimal content script to satisfy the manifest
// Content script functionality will be added in future versions

// Example: Detect if we're on a Linear issue page
if (window.location.pathname.includes('/issue/')) {
    console.log('📋 Detected Linear issue page');
    // Future: Add issue-specific functionality
}

// Example: Detect if we're on Linear team page
if (window.location.pathname.includes('/team/')) {
    console.log('👥 Detected Linear team page');
    // Future: Add team-specific functionality
}
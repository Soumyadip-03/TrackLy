// This file suppresses React useLayoutEffect warnings during server-side rendering

// Monkey patch console.error to filter out specific React warnings
const originalConsoleError = console.error;

console.error = function (...args) {
  // Check if this is a useLayoutEffect warning
  if (
    typeof args[0] === 'string' &&
    args[0].includes('useLayoutEffect does nothing on the server')
  ) {
    // Suppress the warning
    return;
  }
  
  // Call original console.error for all other errors
  originalConsoleError.apply(console, args);
};
/**
 * Modern notification sound generator
 * Creates a pleasant 2-3 second notification sound using Web Audio API
 */

(function() {
  // Set up the global function for playing the notification sound
  window.playGeneratedSound = function() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn("Web Audio API not supported in this browser");
        return false;
      }
      
      const audioCtx = new AudioContext();
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.5; // Master volume at 50%
      masterGain.connect(audioCtx.destination);
      
      const now = audioCtx.currentTime;
      
      // Modern soft notification with multiple tones
      createPrimaryTone(audioCtx, masterGain, now);
      createSecondaryTone(audioCtx, masterGain, now + 0.15);
      createTertiaryTone(audioCtx, masterGain, now + 0.4);
      
      // Success!
      return true;
    } catch (err) {
      console.error("Failed to generate notification sound:", err);
      return false;
    }
  };
  
  // Create the primary notification tone (bell-like)
  function createPrimaryTone(context, destination, startTime) {
    // Main oscillator
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, startTime); // A5 note
    
    // Envelope
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.7, startTime + 0.02); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8); // Long decay
    
    // Connect and start
    oscillator.connect(gainNode);
    gainNode.connect(destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 2);
  }
  
  // Create a secondary tone (higher pitch echo)
  function createSecondaryTone(context, destination, startTime) {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1320, startTime); // Higher note (perfect fifth)
    
    // Envelope
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.03); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2); // Decay
    
    // Connect and start
    oscillator.connect(gainNode);
    gainNode.connect(destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 1.5);
  }
  
  // Create a tertiary tone (subtle accent)
  function createTertiaryTone(context, destination, startTime) {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1760, startTime); // One octave higher
    
    // Envelope
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8); // Fast decay
    
    // Connect and start
    oscillator.connect(gainNode);
    gainNode.connect(destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 1);
  }
  
  console.log("Modern notification sound generator initialized");
})(); 
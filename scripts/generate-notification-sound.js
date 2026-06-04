const fs = require('fs');
const path = require('path');

// Generate a proper WAV audio file with a pleasant notification chime
const sampleRate = 22050;
const duration = 0.6;
const numSamples = Math.floor(sampleRate * duration);

// WAV header (44 bytes) + samples
const buffer = Buffer.alloc(44 + numSamples * 2);
let offset = 0;

// RIFF header
buffer.write('RIFF', offset); offset += 4;
buffer.writeUInt32LE(36 + numSamples * 2, offset); offset += 4;
buffer.write('WAVE', offset); offset += 4;

// fmt sub-chunk
buffer.write('fmt ', offset); offset += 4;
buffer.writeUInt32LE(16, offset); offset += 4;  // chunk size
buffer.writeUInt16LE(1, offset); offset += 2;   // PCM
buffer.writeUInt16LE(1, offset); offset += 2;   // mono
buffer.writeUInt32LE(sampleRate, offset); offset += 4;
buffer.writeUInt32LE(sampleRate * 2, offset); offset += 4; // byte rate
buffer.writeUInt16LE(2, offset); offset += 2;   // block align
buffer.writeUInt16LE(16, offset); offset += 2;  // bits per sample

// data sub-chunk
buffer.write('data', offset); offset += 4;
buffer.writeUInt32LE(numSamples * 2, offset); offset += 4;

// Generate a pleasant two-tone notification chime: A5 (880Hz) + C#6 (1108.73Hz)
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const envelope = Math.exp(-t * 8);
  const fade = Math.min(1.0, t * 80);
  
  // First tone: A5 (880Hz) - starts immediately
  const tone1 = Math.sin(2 * Math.PI * 880.0 * t);
  
  // Second tone: C#6 (1108.73Hz) - starts at 0.15s for a pleasant interval
  let tone2 = 0;
  if (t >= 0.15) {
    const t2 = t - 0.15;
    const fade2 = Math.min(1, t2 * 80);
    tone2 = Math.sin(2 * Math.PI * 1108.73 * t) * fade2;
  }
  
  let sample = (tone1 * 0.4 + tone2 * 0.3) * envelope * fade;
  let val = Math.round(sample * 28000);
  if (val > 32767) val = 32767;
  if (val < -32768) val = -32768;
  
  buffer.writeInt16LE(val, offset);
  offset += 2;
}

// Write as .wav file (proper format)
const wavPath = path.join(__dirname, '..', 'frontend-admin', 'public', 'sounds', 'notification.wav');
fs.writeFileSync(wavPath, buffer);
console.log(`✅ WAV notification sound created: ${wavPath} (${buffer.length} bytes)`);

// Also copy to .mp3 path for backward compatibility
const mp3Path = path.join(__dirname, '..', 'frontend-admin', 'public', 'sounds', 'notification.mp3');
fs.writeFileSync(mp3Path, buffer);
console.log(`✅ Also saved as MP3 (compatibility copy): ${mp3Path} (${buffer.length} bytes)`);
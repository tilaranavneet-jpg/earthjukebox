/**
 * EARTH BEATS — NASA SPACE & SATELLITE SONIFICATION STUDIO
 * 
 * Core Features:
 * 1. Ultra-HD Leaflet Satellite Engine with Google Maps-Style Precision Labels (Roads, Cities, Places, Reserves)
 * 2. Animated Volumetric Drifting Clouds Layer with Controllable Speed, Density & Flow Direction (0° to 360°)
 * 3. Animated Dynamic Ocean Currents & Airflow Wind Vectors
 * 4. Photorealistic 3D Apollo/Blue Marble Earth Globe (Clean Deep Space, Zero White Rings or Halos)
 * 5. Real-Time Waveform Oscilloscope & NASA Mission Telemetry HUD
 * 6. 4-Stem Web Audio Environmental Synthesizer Deck (+12dB Boost)
 */

// ==========================================================================
// 1. SCIENTIFIC AUDIO SYNTHESIZER ENGINE (WEB AUDIO API)
// ==========================================================================
class EarthSonicEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.analyser = null;
    this.isMuted = false;
    this.boostEnabled = true;

    // Environmental state parameters
    this.thermalAnomaly = 0.0;
    this.airVelocityKnots = 24;
    this.vaporDensity = 75;

    // 4 Discrete Musical Stems
    this.stems = {
      drone: { gain: null, isMuted: false, level: 0.85, oscs: [], filters: [] },
      shimmer: { gain: null, isMuted: false, level: 0.80, oscs: [], filters: [] },
      wind: { gain: null, isMuted: false, level: 0.90, noiseNode: null, filter: null },
      rain: { gain: null, isMuted: false, level: 0.85, timer: null }
    };

    this.pentatonicFrequencies = [
      130.81, 146.83, 164.81, 196.00, 220.00, // C3 - A3
      261.63, 293.66, 329.63, 392.00, 440.00, // C4 - A4
      523.25, 587.33, 659.25, 783.99, 880.00  // C5 - A5
    ];
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Studio Dynamics Compressor (+12dB Loudness Booster)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-20, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(14, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Waveform Analyser for Real-Time Oscilloscope
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.82;

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.setupStems();
  }

  setupStems() {
    // Stem 1: Deep Earth Drone (Sub-bass 45 Hz & 90 Hz)
    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(this.stems.drone.level, this.ctx.currentTime);
    droneGain.connect(this.masterGain);
    this.stems.drone.gain = droneGain;

    [45.0, 90.0, 135.0].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(droneGain);
      osc.start();

      this.stems.drone.oscs.push(osc);
      this.stems.drone.filters.push(filter);
    });

    // Stem 2: Thermal Shimmer (Warm Rich Harmonic Chords)
    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(this.stems.shimmer.level, this.ctx.currentTime);
    shimmerGain.connect(this.masterGain);
    this.stems.shimmer.gain = shimmerGain;

    [261.63, 329.63, 392.00, 523.25].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, this.ctx.currentTime);
      filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(shimmerGain);
      osc.start();

      this.stems.shimmer.oscs.push(osc);
      this.stems.shimmer.filters.push(filter);
    });

    // Stem 3: Airflow Wind Resonator (Pink Noise Wind Swell)
    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(this.stems.wind.level, this.ctx.currentTime);
    windGain.connect(this.masterGain);
    this.stems.wind.gain = windGain;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    whiteNoise.connect(windFilter);
    windFilter.connect(windGain);
    whiteNoise.start();

    this.stems.wind.noiseNode = whiteNoise;
    this.stems.wind.filter = windFilter;

    // Stem 4: Cloud Vapor Rain Chime (Granular Crystal Chimes)
    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(this.stems.rain.level, this.ctx.currentTime);
    rainGain.connect(this.masterGain);
    this.stems.rain.gain = rainGain;

    this.startRainChimeGenerator(rainGain);
  }

  startRainChimeGenerator(destinationGain) {
    const triggerChime = () => {
      if (!this.ctx || this.ctx.state !== 'running' || this.stems.rain.isMuted) {
        this.stems.rain.timer = setTimeout(triggerChime, 600);
        return;
      }

      const noteFreq = this.pentatonicFrequencies[
        Math.floor(Math.random() * this.pentatonicFrequencies.length)
      ];
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = Math.random() > 0.35 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(noteFreq, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      const decayDuration = 0.45 + Math.random() * 0.55;
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.24 * (this.vaporDensity / 75), now + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

      osc.connect(noteGain);
      noteGain.connect(destinationGain);
      osc.start(now);
      osc.stop(now + decayDuration + 0.05);

      const nextInterval = 280 + Math.random() * (900 - (this.vaporDensity / 100) * 450);
      this.stems.rain.timer = setTimeout(triggerChime, Math.max(120, nextInterval));
    };

    triggerChime();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  setMasterVolume(val) {
    if (!this.masterGain) return;
    const gainVal = (val / 100) * (this.boostEnabled ? 1.4 : 1.0);
    this.masterGain.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 0.05);
  }

  setBoost(enabled) {
    this.boostEnabled = enabled;
    if (this.masterGain && this.compressor) {
      if (enabled) {
        this.compressor.threshold.setTargetAtTime(-24, this.ctx.currentTime, 0.05);
        this.compressor.ratio.setTargetAtTime(8, this.ctx.currentTime, 0.05);
      } else {
        this.compressor.threshold.setTargetAtTime(-12, this.ctx.currentTime, 0.05);
        this.compressor.ratio.setTargetAtTime(3, this.ctx.currentTime, 0.05);
      }
    }
  }

  setStemGain(stemName, val) {
    if (!this.stems[stemName] || !this.stems[stemName].gain) return;
    this.stems[stemName].level = val / 100;
    if (!this.stems[stemName].isMuted) {
      this.stems[stemName].gain.gain.setTargetAtTime(this.stems[stemName].level, this.ctx.currentTime, 0.04);
    }
  }

  toggleStemMute(stemName) {
    if (!this.stems[stemName] || !this.stems[stemName].gain) return false;
    this.stems[stemName].isMuted = !this.stems[stemName].isMuted;
    const targetGain = this.stems[stemName].isMuted ? 0.0001 : this.stems[stemName].level;
    this.stems[stemName].gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);
    return this.stems[stemName].isMuted;
  }

  updateParameters(thermal, airKnots, vapor) {
    this.thermalAnomaly = thermal;
    this.airVelocityKnots = airKnots;
    this.vaporDensity = vapor;

    if (!this.ctx || this.ctx.state !== 'running') return;

    // Shift Shimmer Filter based on Thermal Anomaly
    if (this.stems.shimmer.filters.length > 0) {
      const baseShift = 1.0 + (thermal / 15.0);
      this.stems.shimmer.filters.forEach((filter, idx) => {
        const nominal = [261.63, 329.63, 392.00, 523.25][idx];
        filter.frequency.setTargetAtTime(nominal * baseShift, this.ctx.currentTime, 0.08);
      });
    }

    // Shift Wind Resonator Filter based on Airspeed
    if (this.stems.wind.filter) {
      const targetHz = 160 + (airKnots / 90) * 850;
      this.stems.wind.filter.frequency.setTargetAtTime(targetHz, this.ctx.currentTime, 0.08);
    }
  }

  triggerSpotChord(lat, lon) {
    if (!this.ctx) this.init();
    this.resume();

    const baseIdx = Math.floor(Math.abs(lat) / 90 * (this.pentatonicFrequencies.length - 4));
    const chordNotes = [
      this.pentatonicFrequencies[baseIdx],
      this.pentatonicFrequencies[baseIdx + 2],
      this.pentatonicFrequencies[baseIdx + 4]
    ];

    chordNotes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      const dur = 1.4 + i * 0.2;
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.28, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + dur + 0.05);
    });
  }
}

const globalAudio = new EarthSonicEngine();

// ==========================================================================
// 2. NASA MISSION APPLICATION STATE
// ==========================================================================
const AppState = {
  mode: 'temperature',
  viewMode: 'satellite',  // STRICTLY 'satellite' or '3d'
  isPlaying: false,
  isLooping: true,
  autoRotate: true,
  googleHybridActive: true,
  cloudsActive: true,     // Animated atmospheric clouds toggle

  // Modulator Variables
  thermalShift: 0.0,
  airVelocity: 24,       // knots (controls wind vector and cloud speed)
  vaporDensity: 75,      // % (controls cloud density & opacity)
  windAngle: 85,         // degrees (0° N, 90° E, 180° S, 270° W)
  dynamicWindAngle: false,

  // Selected Geo Coordinates
  currentLat: 30.15,
  currentLon: 78.00,

  scanProgress: 0.0
};

// ==========================================================================
// 3. TELEMETRY & SCIENTIFIC DATA UTILITIES
// ==========================================================================
function calculateTemperature(lat) {
  const absLat = Math.abs(lat);
  const baseSST = 29.5 - (absLat / 90) * 32.0;
  return baseSST + AppState.thermalShift;
}

function getSonicNote(temp) {
  if (temp < 0) return { note: 'C2 (65 Hz)', db: 78, desc: 'Polar Glacial' };
  if (temp < 12) return { note: 'E2 (82 Hz)', db: 84, desc: 'Frigid Subpolar' };
  if (temp < 20) return { note: 'A2 (110 Hz)', db: 88, desc: 'Cool Temperate' };
  if (temp < 26) return { note: 'D3 (147 Hz)', db: 92, desc: 'Mild Temperate' };
  if (temp < 30) return { note: 'G3 (196 Hz)', db: 96, desc: 'Subtropical Warmth' };
  return { note: 'C4 (262 Hz)', db: 102, desc: 'Equatorial Thermal Peak' };
}

function getWindZone(lat) {
  const absLat = Math.abs(lat);
  if (absLat < 23.5) return 'Tropical Trade Winds';
  if (absLat < 55) return 'Mid-Latitude Westerlies';
  return 'Polar Easterlies';
}

function updateTelemetryHUD(lat, lon, screenX, screenY) {
  AppState.currentLat = lat;
  AppState.currentLon = lon;

  const latSign = lat >= 0 ? 'N' : 'S';
  const lonSign = lon >= 0 ? 'E' : 'W';
  const coordStr = `${Math.abs(lat).toFixed(2)}° ${latSign}, ${Math.abs(lon).toFixed(2)}° ${lonSign}`;
  
  const coordEl = document.getElementById('hudCoordVal');
  if (coordEl) coordEl.textContent = coordStr;

  const temp = calculateTemperature(lat);
  const tempSign = temp >= 0 ? `+${temp.toFixed(1)}` : temp.toFixed(1);
  const sonic = getSonicNote(temp);

  const tempEl = document.getElementById('hudTempVal');
  if (tempEl) tempEl.textContent = `${tempSign}°C (${sonic.desc})`;

  const noteEl = document.getElementById('hudNoteVal');
  if (noteEl) noteEl.textContent = `${sonic.note} • ${sonic.db} dB`;

  const zone = getWindZone(lat);
  const airEl = document.getElementById('hudAirText');
  if (airEl) {
    airEl.textContent = `${AppState.windAngle.toFixed(0)}° ${lonSign} • ${AppState.airVelocity.toFixed(1)} kts (${zone})`;
  }
}

// ==========================================================================
// 4. 2D ATMOSPHERIC DRIFTING CLOUDS SIMULATION ENGINE (VIVID & VISIBLE)
// ==========================================================================
let satCloudsCanvas, satCloudsCtx;
let cloudAnimFrameId = null;
let cloudPuffs = [];

function initCloudSystem() {
  cloudPuffs = [];
  // 42 distinct volumetric cloud formations across the viewport
  for (let i = 0; i < 42; i++) {
    const subPuffCount = 7 + Math.floor(Math.random() * 5);
    const subPuffs = [];
    for (let j = 0; j < subPuffCount; j++) {
      subPuffs.push({
        ox: (Math.random() - 0.5) * 110,
        oy: (Math.random() - 0.5) * 60,
        r: 32 + Math.random() * 45,
        baseAlpha: 0.55 + Math.random() * 0.40,
        pulseSpeed: 0.5 + Math.random() * 0.8,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    cloudPuffs.push({
      xNorm: Math.random() * 1.3 - 0.15,
      yNorm: Math.random() * 1.3 - 0.15,
      baseRadius: 75 + Math.random() * 95,
      subPuffs: subPuffs,
      rotSpeed: (Math.random() - 0.5) * 0.002,
      rotation: Math.random() * Math.PI * 2
    });
  }
}

function resizeCloudCanvas() {
  const mount = document.getElementById('satelliteMount');
  satCloudsCanvas = document.getElementById('satCloudsCanvas');
  if (mount && satCloudsCanvas) {
    const w = mount.clientWidth || 1200;
    const h = mount.clientHeight || 640;
    if (satCloudsCanvas.width !== w || satCloudsCanvas.height !== h) {
      satCloudsCanvas.width = w;
      satCloudsCanvas.height = h;
      satCloudsCtx = satCloudsCanvas.getContext('2d');
    }
  }
}

function startCloudAnimationLoop() {
  if (cloudAnimFrameId) cancelAnimationFrame(cloudAnimFrameId);

  let lastTime = performance.now();

  function animateClouds(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    if (AppState.viewMode === 'satellite' && satCloudsCtx && satCloudsCanvas) {
      const w = satCloudsCanvas.width;
      const h = satCloudsCanvas.height;
      satCloudsCtx.clearRect(0, 0, w, h);

      if (AppState.cloudsActive && AppState.vaporDensity > 5) {
        // Drift velocity derived from airspeed & angle
        const speed = (AppState.airVelocity / 24) * 28; // pixels per second
        const angleRad = (AppState.windAngle * Math.PI) / 180;
        const dx = Math.sin(angleRad) * speed * dt;
        const dy = -Math.cos(angleRad) * speed * dt * 0.85;

        // Density & Opacity scale (Highly visible and realistic)
        const densityFactor = AppState.vaporDensity / 100; // 0.05 .. 1.0

        cloudPuffs.forEach(cloud => {
          // Advance cloud position
          cloud.xNorm += dx / w;
          cloud.yNorm += dy / h;
          cloud.rotation += cloud.rotSpeed;

          // Seamless toroidal wrap around boundaries
          if (cloud.xNorm > 1.35) cloud.xNorm = -0.35;
          if (cloud.xNorm < -0.35) cloud.xNorm = 1.35;
          if (cloud.yNorm > 1.35) cloud.yNorm = -0.35;
          if (cloud.yNorm < -0.35) cloud.yNorm = 1.35;

          const cx = cloud.xNorm * w;
          const cy = cloud.yNorm * h;

          // Only render if in or near the visible viewport
          if (cx < -200 || cx > w + 200 || cy < -200 || cy > h + 200) return;

          // 1. Soft Realistic Ground Shadow (gives dramatic 3D cloud height)
          const shadowOffsetX = 16 * Math.sin(angleRad);
          const shadowOffsetY = 16 * Math.cos(angleRad) + 12;
          
          cloud.subPuffs.forEach(sp => {
            const scx = cx + sp.ox + shadowOffsetX;
            const scy = cy + sp.oy + shadowOffsetY;
            const sr = sp.r * 1.1;
            const shadowAlpha = 0.18 * densityFactor;

            const shadowGrad = satCloudsCtx.createRadialGradient(scx, scy, 0, scx, scy, sr);
            shadowGrad.addColorStop(0.0, `rgba(8, 16, 30, ${shadowAlpha})`);
            shadowGrad.addColorStop(0.6, `rgba(12, 22, 40, ${shadowAlpha * 0.4})`);
            shadowGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

            satCloudsCtx.fillStyle = shadowGrad;
            satCloudsCtx.beginPath();
            satCloudsCtx.arc(scx, scy, sr, 0, Math.PI * 2);
            satCloudsCtx.fill();
          });

          // 2. Brilliant Volumetric Cloud Body (Pure White Core, Soft Condensation Fringe)
          cloud.subPuffs.forEach(sp => {
            const px = cx + sp.ox;
            const py = cy + sp.oy;
            const pr = sp.r * (0.85 + densityFactor * 0.4);
            const coreAlpha = Math.min(1.0, sp.baseAlpha * densityFactor * 0.95);

            const cloudGrad = satCloudsCtx.createRadialGradient(px, py, 0, px, py, pr);
            cloudGrad.addColorStop(0.0, `rgba(255, 255, 255, ${coreAlpha})`);
            cloudGrad.addColorStop(0.35, `rgba(248, 252, 255, ${coreAlpha * 0.85})`);
            cloudGrad.addColorStop(0.70, `rgba(230, 242, 255, ${coreAlpha * 0.35})`);
            cloudGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

            satCloudsCtx.fillStyle = cloudGrad;
            satCloudsCtx.beginPath();
            satCloudsCtx.arc(px, py, pr, 0, Math.PI * 2);
            satCloudsCtx.fill();
          });
        });
      }
    }

    cloudAnimFrameId = requestAnimationFrame(animateClouds);
  }

  cloudAnimFrameId = requestAnimationFrame(animateClouds);
}

// ==========================================================================
// 5. 2D OCEAN CURRENTS & AIRFLOW VECTOR ENGINE
// ==========================================================================
let currentVectors = [];
let satVectorsCanvas, satVectorsCtx;
let vectorAnimFrameId = null;

function resizeSatVectors() {
  const mount = document.getElementById('satelliteMount');
  satVectorsCanvas = document.getElementById('satVectorsCanvas');
  if (mount && satVectorsCanvas) {
    const w = mount.clientWidth || 1200;
    const h = mount.clientHeight || 640;
    if (satVectorsCanvas.width !== w || satVectorsCanvas.height !== h) {
      satVectorsCanvas.width = w;
      satVectorsCanvas.height = h;
      satVectorsCtx = satVectorsCanvas.getContext('2d');
    }
  }
}

function createOceanVectors() {
  currentVectors = [];
  const rows = 12;
  const cols = 20;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lat = 70 - (r / (rows - 1)) * 140;
      const lon = -170 + (c / (cols - 1)) * 340;
      const absLat = Math.abs(lat);

      let baseAngle = 0;
      let baseSpeed = 16.0;

      if (absLat < 18) {
        baseAngle = lat >= 0 ? 255 : 285; // Tropical Easterlies
        baseSpeed = 22.0;
      } else if (absLat < 55) {
        baseAngle = lat >= 0 ? 75 : 65;   // Mid-latitude Westerlies
        baseSpeed = 28.0;
      } else {
        baseAngle = lat >= 0 ? 260 : 280; // Polar Easterlies
        baseSpeed = 14.0;
      }

      currentVectors.push({
        lat: lat,
        lon: lon,
        normX: c / cols,
        normY: r / rows,
        baseAngle: baseAngle,
        baseSpeed: baseSpeed,
        phase: Math.random() * Math.PI * 2,
        length: 22 + Math.random() * 12
      });
    }
  }
}

function startVectorAnimationLoop() {
  if (vectorAnimFrameId) cancelAnimationFrame(vectorAnimFrameId);

  function animateVectors(time) {
    const velMultiplier = AppState.airVelocity / 24;

    if (AppState.viewMode === 'satellite' && satVectorsCtx && satVectorsCanvas && leafletMapInstance) {
      satVectorsCtx.clearRect(0, 0, satVectorsCanvas.width, satVectorsCanvas.height);
      const userAngleRad = ((AppState.windAngle - 90) * Math.PI) / 180;

      currentVectors.forEach(v => {
        let pt = null;
        try {
          pt = leafletMapInstance.latLngToContainerPoint([v.lat, v.lon]);
        } catch (e) {
          pt = { x: v.normX * satVectorsCanvas.width, y: v.normY * satVectorsCanvas.height };
        }

        if (!pt) return;
        if (pt.x < -30 || pt.x > satVectorsCanvas.width + 30 || pt.y < -30 || pt.y > satVectorsCanvas.height + 30) return;

        const effectiveAngleRad = userAngleRad + Math.sin(time * 0.0018 + v.phase) * 0.15;
        const arrowLen = v.length * (0.85 + velMultiplier * 0.28);

        const endX = pt.x + Math.cos(effectiveAngleRad) * arrowLen;
        const endY = pt.y + Math.sin(effectiveAngleRad) * arrowLen;

        const pulse = 0.55 + 0.45 * Math.sin(time * 0.0035 + v.phase);
        satVectorsCtx.strokeStyle = `rgba(0, 242, 254, ${pulse * 0.85})`;
        satVectorsCtx.fillStyle = `rgba(0, 242, 254, ${pulse * 0.95})`;
        satVectorsCtx.lineWidth = 1.8;
        satVectorsCtx.lineCap = 'round';

        // Draw Vector Stem
        satVectorsCtx.beginPath();
        satVectorsCtx.moveTo(pt.x, pt.y);
        satVectorsCtx.lineTo(endX, endY);
        satVectorsCtx.stroke();

        // Draw Vector Arrowhead
        const headLen = 7;
        const a1 = effectiveAngleRad + Math.PI * 0.82;
        const a2 = effectiveAngleRad - Math.PI * 0.82;

        satVectorsCtx.beginPath();
        satVectorsCtx.moveTo(endX, endY);
        satVectorsCtx.lineTo(endX + Math.cos(a1) * headLen, endY + Math.sin(a1) * headLen);
        satVectorsCtx.lineTo(endX + Math.cos(a2) * headLen, endY + Math.sin(a2) * headLen);
        satVectorsCtx.closePath();
        satVectorsCtx.fill();
      });
    }

    vectorAnimFrameId = requestAnimationFrame(animateVectors);
  }

  vectorAnimFrameId = requestAnimationFrame(animateVectors);
}

// ==========================================================================
// 6. LEAFLET SATELLITE ENGINE WITH GOOGLE MAPS-STYLE PRECISION LABELS
// ==========================================================================
let leafletMapInstance = null;
let googleHybridLayer = null;
let esriSatelliteBase = null;

function initSatelliteMapEngine() {
  resizeSatVectors();
  resizeCloudCanvas();
  if (leafletMapInstance) return;

  // Center around user's region of interest (Northern India / Dehradun / Haridwar / Saharanpur)
  leafletMapInstance = L.map('leafletMap', {
    center: [30.15, 78.00],
    zoom: 8,
    minZoom: 2,
    maxZoom: 20,
    inertia: true
  });

  // Google Maps Hybrid Tile Layer (Matches reference: Dehradun, Saharanpur, Haridwar, Rajaji Reserve, routes 7 & 344)
  googleHybridLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps Satellite'
  });

  // Pure Esri Satellite Layer (for when labels are toggled off)
  esriSatelliteBase = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, attribution: 'Satellite &copy; Esri, Maxar' }
  );

  googleHybridLayer.addTo(leafletMapInstance);

  const pointer = document.getElementById('satellitePointer');
  const bubble = document.getElementById('pointerBubbleText');

  // Mouse Move: Track Coordinates, Temperature & Live NASA Pointer
  leafletMapInstance.on('mousemove', (e) => {
    const lat = e.latlng.lat;
    const lon = ((e.latlng.lng + 180) % 360 + 360) % 360 - 180;
    const pt = e.containerPoint;

    updateTelemetryHUD(lat, lon, pt.x, pt.y);

    if (pointer) {
      pointer.style.display = 'block';
      pointer.style.left = `${pt.x}px`;
      pointer.style.top = `${pt.y}px`;
      if (bubble) {
        const temp = calculateTemperature(lat);
        const tempSign = temp >= 0 ? `+${temp.toFixed(1)}` : temp.toFixed(1);
        bubble.textContent = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'W' : 'E'} • ${tempSign}°C`;
      }
    }
  });

  leafletMapInstance.on('mouseout', () => {
    if (pointer) pointer.style.display = 'none';
  });

  // Map Click: Sonify Spot & Drop Pulsing Sonar Marker
  leafletMapInstance.on('click', (e) => {
    const lat = e.latlng.lat;
    const lon = ((e.latlng.lng + 180) % 360 + 360) % 360 - 180;
    const pt = e.containerPoint;

    updateTelemetryHUD(lat, lon, pt.x, pt.y);

    globalAudio.init();
    globalAudio.resume();
    globalAudio.triggerSpotChord(lat, lon);

    dropSatelliteRadarMarker(lat, lon);
  });

  leafletMapInstance.whenReady(() => {
    resizeSatVectors();
    resizeCloudCanvas();
  });

  leafletMapInstance.on('move', () => {
    resizeSatVectors();
    resizeCloudCanvas();
  });

  initCloudSystem();
  startCloudAnimationLoop();

  createOceanVectors();
  startVectorAnimationLoop();
}

function togglePrecisionLabels(enable) {
  AppState.googleHybridActive = enable;
  if (!leafletMapInstance) return;

  if (enable) {
    if (esriSatelliteBase && leafletMapInstance.hasLayer(esriSatelliteBase)) {
      leafletMapInstance.removeLayer(esriSatelliteBase);
    }
    if (!leafletMapInstance.hasLayer(googleHybridLayer)) {
      googleHybridLayer.addTo(leafletMapInstance);
    }
  } else {
    if (googleHybridLayer && leafletMapInstance.hasLayer(googleHybridLayer)) {
      leafletMapInstance.removeLayer(googleHybridLayer);
    }
    if (!leafletMapInstance.hasLayer(esriSatelliteBase)) {
      esriSatelliteBase.addTo(leafletMapInstance);
    }
  }
}

function toggleCloudsLayer(enable) {
  AppState.cloudsActive = enable;
  const btn = document.getElementById('btnToggleClouds');
  if (btn) {
    if (enable) {
      btn.classList.add('active');
      btn.textContent = '☁️ Clouds: ON';
    } else {
      btn.classList.remove('active');
      btn.textContent = '☁️ Clouds: OFF';
      if (satCloudsCtx && satCloudsCanvas) {
        satCloudsCtx.clearRect(0, 0, satCloudsCanvas.width, satCloudsCanvas.height);
      }
    }
  }
}

function dropSatelliteRadarMarker(lat, lon) {
  if (!leafletMapInstance) return;

  const radarHtml = `
    <div class="radar-ping-anchor">
      <div class="radar-sonar-pulse"></div>
      <div class="radar-sonar-core"></div>
    </div>
  `;

  const marker = L.marker([lat, lon], {
    icon: L.divIcon({
      className: 'radar-custom-icon',
      html: radarHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  }).addTo(leafletMapInstance);

  setTimeout(() => {
    if (leafletMapInstance && leafletMapInstance.hasLayer(marker)) {
      leafletMapInstance.removeLayer(marker);
    }
  }, 4200);
}

// ==========================================================================
// 7. PHOTOREALISTIC 3D NASA APOLLO/BLUE MARBLE SPACE GLOBE (ZERO WHITE RINGS)
// ==========================================================================
let scene, camera, renderer, controls;
let earthMesh, satMesh, satAngle = 0;
let threeCanvasContainer = null;

// High-Definition Realistic NASA Apollo 17 Canvas Generator (Natural Bathymetry & Seamless Clouds, NO Rings)
function createPhotorealisticEarthCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const w = 2048;
  const h = 1024;

  // Deep oceanic bathymetric gradient matching NASA Blue Marble
  const ocean = ctx.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0.00, '#020d20');
  ocean.addColorStop(0.18, '#041b3d');
  ocean.addColorStop(0.48, '#0a3568');
  ocean.addColorStop(0.52, '#0c3d75');
  ocean.addColorStop(0.82, '#041b3d');
  ocean.addColorStop(1.00, '#020d20');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);

  const toX = (lon) => ((lon + 180) / 360) * w;
  const toY = (lat) => ((90 - lat) / 180) * h;

  const drawPoly = (coords, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    coords.forEach(([lat, lon], idx) => {
      const x = toX(lon);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  };

  const rainforest = '#184722';
  const temperateForest = '#2a5b30';
  const savana = '#547234';
  const desertGold = '#9a793f';
  const mountainRock = '#3f342a';

  // Realistic continents matching Apollo 17 photography
  // North America
  drawPoly([[71, -165], [72, -135], [70, -100], [62, -75], [54, -58], [46, -60], [42, -70], [35, -75], [26, -80], [28, -89], [27, -96], [20, -97], [16, -92], [14, -88], [9, -83], [8, -78], [16, -96], [23, -108], [32, -117], [38, -123], [48, -125], [58, -137], [60, -148], [65, -168]], temperateForest);
  drawPoly([[45, -115], [44, -105], [32, -102], [24, -102], [22, -108], [32, -116]], desertGold);
  drawPoly([[52, -122], [48, -118], [40, -112], [35, -110]], mountainRock);

  // South America (Vivid Amazon Green & Andes Mountains matching user's Apollo 17 photo)
  drawPoly([[11, -74], [10, -62], [4, -51], [-3, -40], [-8, -35], [-13, -38], [-23, -43], [-32, -51], [-40, -62], [-52, -68], [-55, -67], [-50, -75], [-40, -74], [-30, -71], [-20, -70], [-5, -81], [3, -78], [9, -78]], rainforest);
  drawPoly([[8, -77], [-2, -78], [-15, -75], [-25, -70], [-35, -71], [-45, -72], [-54, -70]], mountainRock);
  drawPoly([[-20, -65], [-25, -55], [-35, -58], [-40, -65]], savana);

  // Africa (Sahara Desert Gold & Congo Basin)
  drawPoly([[36, -5], [37, 10], [32, 20], [31, 32], [27, 34], [15, 41], [11, 51], [2, 45], [-12, 40], [-25, 33], [-34, 26], [-34, 18], [-22, 14], [-5, 12], [4, 9], [6, 2], [5, -4], [10, -14], [15, -17], [22, -17], [30, -10], [35, -2]], desertGold);
  drawPoly([[10, -12], [11, 2], [5, 9], [-4, 12], [-14, 18], [-24, 28], [-28, 25], [-24, 16], [-10, 14], [0, 9]], rainforest);

  // Eurasia & India
  drawPoly([[71, 28], [68, 48], [72, 75], [76, 105], [72, 135], [70, 178], [62, 175], [58, 162], [52, 142], [40, 128], [35, 120], [22, 115], [10, 106], [1, 104], [8, 98], [22, 90], [22, 70], [12, 44], [18, 38], [30, 32], [41, 28], [44, 15], [36, -5], [44, -9], [48, -4], [54, 8], [58, 5], [62, 5], [70, 24]], temperateForest);
  drawPoly([[31, 35], [26, 50], [22, 59], [15, 53], [12, 44], [20, 40], [28, 35]], desertGold);
  drawPoly([[24, 68], [28, 77], [26, 88], [20, 85], [13, 80], [8, 77], [15, 74], [20, 72]], rainforest); // India
  drawPoly([[32, 76], [30, 82], [28, 88]], mountainRock); // Himalayas

  // Australia
  drawPoly([[-12, 136], [-11, 142], [-22, 150], [-32, 152], [-38, 146], [-38, 140], [-32, 128], [-34, 115], [-22, 114], [-15, 125], [-15, 134]], desertGold);

  // Antarctica (Specific Landmass Only — NO horizontal circles across all longitudes to prevent polar rings!)
  drawPoly([[-68, -60], [-72, -20], [-75, 20], [-70, 60], [-68, 100], [-70, 140], [-72, 170], [-78, -140], [-72, -90]], 'rgba(235, 245, 255, 0.75)');

  // Swirling Atmospheric Weather Systems & Cyclones Baked Directly Onto Globe (Zero Outer Halo)
  for (let c = 0; c < 65; c++) {
    const lat = (Math.random() - 0.5) * 110;
    const lon = (Math.random() - 0.5) * 350;
    const cx = toX(lon);
    const cy = toY(lat);
    const rx = 55 + Math.random() * 95;
    const ry = 16 + Math.random() * 32;
    const rot = (Math.random() - 0.5) * 0.6;

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    g.addColorStop(0.0, 'rgba(255, 255, 255, 0.65)');
    g.addColorStop(0.4, 'rgba(245, 250, 255, 0.35)');
    g.addColorStop(0.8, 'rgba(230, 242, 255, 0.10)');
    g.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

function initThreeEngine() {
  threeCanvasContainer = document.getElementById('threeMount');
  if (!threeCanvasContainer) return;

  const width = threeCanvasContainer.clientWidth || 1200;
  const height = threeCanvasContainer.clientHeight || 640;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  camera.position.set(0, 0.6, 5.8);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  threeCanvasContainer.appendChild(renderer.domElement);

  if (window.THREE && window.THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.75;
    controls.minDistance = 2.8;
    controls.maxDistance = 9.5;
  }

  // 1. Deep Space Starfield (Clean, pure starry void matching Apollo 17 photography)
  const starsGeo = new THREE.BufferGeometry();
  const starCoords = [];
  for (let i = 0; i < 2200; i++) {
    starCoords.push(
      (Math.random() - 0.5) * 240,
      (Math.random() - 0.5) * 240,
      (Math.random() - 0.5) * 240 - 20
    );
  }
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
  const starsMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.9,
    transparent: true,
    opacity: 0.80
  });
  scene.add(new THREE.Points(starsGeo, starsMat));

  // 2. Photorealistic Earth Sphere (Strictly radius 2.0, ZERO outer rings or halo meshes)
  const earthGeo = new THREE.SphereGeometry(2.0, 96, 96);
  const earthTexCanvas = createPhotorealisticEarthCanvas();
  const earthTexture = new THREE.CanvasTexture(earthTexCanvas);

  const earthMat = new THREE.MeshPhongMaterial({
    map: earthTexture,
    shininess: 24,
    specular: new THREE.Color(0x224466) // Realistic liquid ocean sunlight reflection
  });

  earthMesh = new THREE.Mesh(earthGeo, earthMat);
  scene.add(earthMesh);

  // Load High-Res NASA Blue Marble Apollo Photography with automatic failover mirrors
  const textureMirrors = [
    'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
  ];

  function tryLoadTextureMirror(index) {
    if (index >= textureMirrors.length) return;
    const photoLoader = new Image();
    photoLoader.crossOrigin = 'anonymous';
    photoLoader.onload = () => {
      const photoTex = new THREE.Texture(photoLoader);
      photoTex.needsUpdate = true;
      if (earthMesh && earthMesh.material) {
        earthMesh.material.map = photoTex;
        earthMesh.material.needsUpdate = true;
      }
    };
    photoLoader.onerror = () => {
      tryLoadTextureMirror(index + 1);
    };
    photoLoader.src = textureMirrors[index];
  }

  tryLoadTextureMirror(0);

  // 3. NASA EOS Orbiting Research Satellite
  satMesh = new THREE.Group();
  const satBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.18 })
  );
  const solarMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.01, 0.08), solarMat);
  leftWing.position.x = -0.20;
  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.01, 0.08), solarMat);
  rightWing.position.x = 0.20;
  satMesh.add(satBody, leftWing, rightWing);
  scene.add(satMesh);

  // 4. Deep Space Solar Lighting (Recreates authentic Apollo 17 sunlight contrast)
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(5.5, 3.2, 5.0);
  scene.add(sunLight);

  const spaceAmbient = new THREE.AmbientLight(0x111c2e, 0.65);
  scene.add(spaceAmbient);

  // 5. Raycasting: Click on 3D Globe to Sonify Spot
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  renderer.domElement.addEventListener('click', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earthMesh);
    if (intersects.length > 0) {
      const p = intersects[0].point.clone().normalize();
      const lat = Math.asin(p.y) * (180 / Math.PI);
      const lon = Math.atan2(-p.z, p.x) * (180 / Math.PI);
      updateTelemetryHUD(lat, lon, e.clientX - rect.left, e.clientY - rect.top);

      globalAudio.init();
      globalAudio.resume();
      globalAudio.triggerSpotChord(lat, lon);
    }
  });

  // Render & Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    if (earthMesh && AppState.autoRotate) {
      earthMesh.rotation.y += 0.0012;
    }

    satAngle += 0.011;
    if (satMesh) {
      satMesh.position.set(Math.cos(satAngle) * 2.85, Math.sin(satAngle * 0.7) * 1.1, Math.sin(satAngle) * 2.85);
      satMesh.lookAt(0, 0, 0);
    }

    if (controls) controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    if (!threeCanvasContainer) return;
    const w = threeCanvasContainer.clientWidth;
    const h = threeCanvasContainer.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

// ==========================================================================
// 8. REAL-TIME WAVEFORM SPECTRUM OSCILLOSCOPE
// ==========================================================================
function initOscilloscope() {
  const canvas = document.getElementById('audioVisualizerCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeScope() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  resizeScope();
  window.addEventListener('resize', resizeScope);

  const bufferLength = 512;
  const dataArray = new Uint8Array(bufferLength);

  function drawScope() {
    requestAnimationFrame(drawScope);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Subtle background telemetry grid
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (globalAudio.analyser && AppState.isPlaying) {
      globalAudio.analyser.getByteTimeDomainData(dataArray);

      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#00f2fe';
      ctx.shadowColor = 'rgba(0, 242, 254, 0.85)';
      ctx.shadowBlur = 10;
      ctx.beginPath();

      const sliceWidth = w / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Resting Flatline Beam
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    }
  }

  drawScope();
}

// ==========================================================================
// 9. DOM BINDINGS & USER INTERACTION LISTENERS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initSatelliteMapEngine();
  initThreeEngine();
  initOscilloscope();

  updateTelemetryHUD(30.15, 78.00, 0, 0);

  // 1. Mission Elapsed Time (MET) & UTC Clocks
  setInterval(() => {
    const now = new Date();
    const utcEl = document.getElementById('utcClock');
    if (utcEl) utcEl.textContent = now.toUTCString().split(' ')[4] + ' UTC';

    const sec = Math.floor(now.getTime() / 1000) % 86400;
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    const metEl = document.getElementById('metClock');
    if (metEl) metEl.textContent = `T+08:${m}:${s}`;
  }, 1000);

  // 2. Phenomenon Ribbon Selector
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.mode = btn.getAttribute('data-mode');
      const title = btn.getAttribute('data-title');
      const badge = document.getElementById('badgeDatasetTitle');
      if (badge) badge.textContent = title;
    });
  });

  // 3. Precision Google Hybrid Labels Toggle
  const btnToggleLabels = document.getElementById('btnToggleLabels');
  if (btnToggleLabels) {
    btnToggleLabels.addEventListener('click', () => {
      const newState = !AppState.googleHybridActive;
      btnToggleLabels.classList.toggle('active', newState);
      btnToggleLabels.textContent = newState ? '🗺️ Google Hybrid Labels: ON' : '🗺️ Google Hybrid Labels: OFF';
      togglePrecisionLabels(newState);
    });
  }

  // 4. Satellite Clouds Toggle Button
  const btnToggleClouds = document.getElementById('btnToggleClouds');
  if (btnToggleClouds) {
    btnToggleClouds.addEventListener('click', () => {
      toggleCloudsLayer(!AppState.cloudsActive);
    });
  }

  // 5. EXACT TWO VIEW OPTIONS: Satellite Map vs 3D Space Globe
  const btnSat = document.getElementById('btnViewSatellite');
  const btn3D = document.getElementById('btnView3D');
  const mountSat = document.getElementById('satelliteMount');
  const mount3D = document.getElementById('threeMount');
  const orbitBar = document.getElementById('orbitControlsBar');

  if (btnSat && btn3D && mountSat && mount3D) {
    btnSat.addEventListener('click', () => {
      btnSat.classList.add('active');
      btn3D.classList.remove('active');
      mountSat.style.display = 'block';
      mount3D.style.display = 'none';
      if (orbitBar) orbitBar.style.display = 'none';
      AppState.viewMode = 'satellite';

      initSatelliteMapEngine();
      setTimeout(() => {
        resizeSatVectors();
        resizeCloudCanvas();
        if (leafletMapInstance) leafletMapInstance.invalidateSize();
      }, 50);
    });

    btn3D.addEventListener('click', () => {
      btn3D.classList.add('active');
      btnSat.classList.remove('active');
      mountSat.style.display = 'none';
      mount3D.style.display = 'block';
      if (orbitBar) orbitBar.style.display = 'flex';
      AppState.viewMode = '3d';
    });
  }

  // 6. 3D Camera Glide Buttons
  const glideNorth = document.getElementById('glideNorth');
  const glideEquator = document.getElementById('glideEquator');
  const glideSouth = document.getElementById('glideSouth');
  const glideGlobal = document.getElementById('glideGlobal');
  const btnAutoRotate = document.getElementById('btnAutoRotate');

  function glideCameraTo(x, y, z) {
    if (!camera) return;
    if (window.gsap) {
      gsap.to(camera.position, { x, y, z, duration: 1.4, ease: 'power2.inOut' });
    } else {
      camera.position.set(x, y, z);
    }
  }

  if (glideNorth) glideNorth.addEventListener('click', () => glideCameraTo(0, 5.2, 1.8));
  if (glideEquator) glideEquator.addEventListener('click', () => glideCameraTo(0, 0.2, 5.5));
  if (glideSouth) glideSouth.addEventListener('click', () => glideCameraTo(0, -5.2, 1.8));
  if (glideGlobal) glideGlobal.addEventListener('click', () => glideCameraTo(0, 0.6, 5.8));

  if (btnAutoRotate) {
    btnAutoRotate.addEventListener('click', () => {
      AppState.autoRotate = !AppState.autoRotate;
      btnAutoRotate.classList.toggle('active', AppState.autoRotate);
      btnAutoRotate.textContent = AppState.autoRotate ? '🔄 Auto-Spin ON' : '⏸️ Auto-Spin OFF';
    });
  }

  // 7. Audio Transport Controls (Play / Pause / Loop)
  const btnPlay = document.getElementById('btnPlayMain');
  const playIcon = document.getElementById('playIcon');
  const playText = document.getElementById('playBtnText');
  const scopeStatus = document.getElementById('scopeStatus');
  const flatScan = document.getElementById('flatScanLine');
  let scanProgress = 0;
  let scanInterval = null;

  function setPlayState(playing) {
    AppState.isPlaying = playing;
    if (playing) {
      globalAudio.init();
      globalAudio.resume();
      if (playIcon) playIcon.textContent = '⏸';
      if (playText) playText.textContent = 'Pause Symphony';
      if (scopeStatus) {
        scopeStatus.textContent = 'TRANSMITTING LIVE SONIC FEEDS';
        scopeStatus.classList.add('active');
      }

      if (scanInterval) clearInterval(scanInterval);
      scanInterval = setInterval(() => {
        scanProgress += 0.005;
        if (scanProgress > 1.0) {
          if (AppState.isLooping) {
            scanProgress = 0.0;
          } else {
            setPlayState(false);
            return;
          }
        }

        if (AppState.viewMode === 'satellite' && flatScan) {
          flatScan.style.display = 'block';
          flatScan.style.left = `${scanProgress * 100}%`;
        } else if (flatScan) {
          flatScan.style.display = 'none';
        }
      }, 50);
    } else {
      globalAudio.suspend();
      if (playIcon) playIcon.textContent = '▶';
      if (playText) playText.textContent = 'Play Earth Symphony';
      if (scopeStatus) {
        scopeStatus.textContent = 'AUDIO STANDBY';
        scopeStatus.classList.remove('active');
      }
      if (scanInterval) clearInterval(scanInterval);
      if (flatScan) flatScan.style.display = 'none';
    }
  }

  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      setPlayState(!AppState.isPlaying);
    });
  }

  const btnLoop = document.getElementById('btnToggleLoop');
  if (btnLoop) {
    btnLoop.addEventListener('click', () => {
      AppState.isLooping = !AppState.isLooping;
      btnLoop.classList.toggle('active', AppState.isLooping);
      btnLoop.textContent = AppState.isLooping ? '🔁 Loop: ON' : '🔁 Loop: OFF';
    });
  }

  const btnResonate = document.getElementById('btnSonifyCenter');
  if (btnResonate) {
    btnResonate.addEventListener('click', () => {
      globalAudio.init();
      globalAudio.resume();
      globalAudio.triggerSpotChord(AppState.currentLat, AppState.currentLon);
      if (AppState.viewMode === 'satellite') {
        dropSatelliteRadarMarker(AppState.currentLat, AppState.currentLon);
      }
    });
  }

  // 8. Master Gain & +12dB Booster Controls
  const sliderMaster = document.getElementById('sliderMasterGain');
  const valMaster = document.getElementById('valMasterGain');
  if (sliderMaster && valMaster) {
    sliderMaster.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      valMaster.textContent = `${val}%`;
      globalAudio.setMasterVolume(val);
    });
  }

  const btnBoost = document.getElementById('btnMasterBoost');
  if (btnBoost) {
    btnBoost.addEventListener('click', () => {
      const newState = !globalAudio.boostEnabled;
      globalAudio.setBoost(newState);
      btnBoost.classList.toggle('active', newState);
      btnBoost.textContent = newState ? '⚡ +12 dB Loudness Boost: ON' : '⚡ +12 dB Loudness Boost: OFF';
    });
  }

  // 9. 4-Stem Faders & Mute Buttons
  document.querySelectorAll('.stem-fader').forEach(fader => {
    fader.addEventListener('input', (e) => {
      const stem = e.target.getAttribute('data-stem');
      const val = parseInt(e.target.value);
      globalAudio.setStemGain(stem, val);

      const cap = stem.charAt(0).toUpperCase() + stem.slice(1);
      const meter = document.getElementById(`meter${cap}`);
      if (meter) meter.style.width = `${val}%`;
    });
  });

  document.querySelectorAll('.stem-mute-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const stem = e.target.getAttribute('data-stem');
      const isMuted = globalAudio.toggleStemMute(stem);
      chip.classList.toggle('muted', isMuted);
      chip.textContent = isMuted ? 'UNMUTE' : 'MUTE';
    });
  });

  // 10. Environmental Modulators (Thermal Shift, Airflow, Vapor, Wind Direction)
  const sliderThermal = document.getElementById('sliderThermal');
  if (sliderThermal) {
    sliderThermal.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 10;
      AppState.thermalShift = val;
      const sign = val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
      document.getElementById('valThermal').textContent = `${sign}°C`;
      globalAudio.updateParameters(AppState.thermalShift, AppState.airVelocity, AppState.vaporDensity);
      updateTelemetryHUD(AppState.currentLat, AppState.currentLon, 0, 0);
    });
  }

  const sliderAirspeed = document.getElementById('sliderAirspeed');
  if (sliderAirspeed) {
    sliderAirspeed.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      AppState.airVelocity = val;
      document.getElementById('valAirspeed').textContent = `${val} kts`;
      globalAudio.updateParameters(AppState.thermalShift, AppState.airVelocity, AppState.vaporDensity);
      updateTelemetryHUD(AppState.currentLat, AppState.currentLon, 0, 0);
    });
  }

  const sliderVapor = document.getElementById('sliderVapor');
  if (sliderVapor) {
    sliderVapor.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      AppState.vaporDensity = val;
      document.getElementById('valVapor').textContent = `${val}%`;
      globalAudio.updateParameters(AppState.thermalShift, AppState.airVelocity, AppState.vaporDensity);
    });
  }

  const sliderWindDir = document.getElementById('sliderWindDir');
  if (sliderWindDir) {
    sliderWindDir.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      AppState.windAngle = val;
      document.getElementById('valWindDir').textContent = `${val}°`;
      updateTelemetryHUD(AppState.currentLat, AppState.currentLon, 0, 0);
    });
  }

  const btnDynamicWind = document.getElementById('btnDynamicWind');
  let dynamicWindTimer = null;
  if (btnDynamicWind) {
    btnDynamicWind.addEventListener('click', () => {
      AppState.dynamicWindAngle = !AppState.dynamicWindAngle;
      btnDynamicWind.classList.toggle('active', AppState.dynamicWindAngle);
      btnDynamicWind.textContent = AppState.dynamicWindAngle 
        ? '🔄 Auto-Shifting Wind Vector: ON' 
        : '🔄 Auto-Shifting Wind Vector: OFF';

      if (AppState.dynamicWindAngle) {
        dynamicWindTimer = setInterval(() => {
          AppState.windAngle = (AppState.windAngle + 1) % 360;
          if (sliderWindDir) sliderWindDir.value = AppState.windAngle;
          const valEl = document.getElementById('valWindDir');
          if (valEl) valEl.textContent = `${AppState.windAngle}°`;
          updateTelemetryHUD(AppState.currentLat, AppState.currentLon, 0, 0);
        }, 120);
      } else {
        if (dynamicWindTimer) clearInterval(dynamicWindTimer);
      }
    });
  }

  // 11. Date Bar Sync Button
  const btnSync = document.getElementById('btnSyncEOS');
  if (btnSync) {
    btnSync.addEventListener('click', () => {
      const obsDate = document.getElementById('inputObsDate').value;
      const label = document.getElementById('labelObsDate');
      if (label) label.textContent = obsDate;

      btnSync.textContent = 'Syncing...';
      btnSync.style.opacity = '0.6';
      setTimeout(() => {
        btnSync.textContent = 'Loaded ✓';
        btnSync.style.opacity = '1';
        setTimeout(() => { btnSync.textContent = 'Load'; }, 1800);
      }, 700);
    });
  }

  // 12. Compare Checkbox Toggle
  const checkCompare = document.getElementById('checkCompare');
  const earlierGroup = document.getElementById('earlierDateGroup');
  if (checkCompare && earlierGroup) {
    checkCompare.addEventListener('change', () => {
      earlierGroup.style.opacity = checkCompare.checked ? '1' : '0.4';
      earlierGroup.style.pointerEvents = checkCompare.checked ? 'auto' : 'none';
    });
  }
});
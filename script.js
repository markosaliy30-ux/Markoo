const canvas = document.getElementById('tornadoCanvas');
const ctx = canvas.getContext('2d');
const searchBox = document.getElementById('search-container');
const emergencyBtn = document.getElementById('emergency-btn');

// UI Controls
const efSelect = document.getElementById('ef-scale');
const widthSlider = document.getElementById('funnel-width');
const suctionSlider = document.getElementById('suction-force');
const speedSlider = document.getElementById('orbit-speed');

const widthVal = document.getElementById('width-val');
const suctionVal = document.getElementById('suction-val');
const speedVal = document.getElementById('speed-val');

let efLevel = 3;
let widthMult = 1.0;
let suctionMult = 1.0;
let speedMult = 1.0;

// ==========================================
// 🔊 WEB AUDIO SYNTHESIZER ENGINE
// ==========================================
let audioCtx = null;
let windGain = null;
let windFilter = null;
let isAudioInitialized = false;

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (isAudioInitialized) return;

    // Procedural Wind Generator (Filtered White Noise)
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(140, audioCtx.currentTime);

    windGain = audioCtx.createGain();
    windGain.gain.setValueAtTime(0.2, audioCtx.currentTime);

    whiteNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(audioCtx.destination);
    whiteNoise.start();

    isAudioInitialized = true;
}

// Realistic Thunder Synthesizer (Crack + Rolling Echo + Sub-Bass Thud)
function playThunderSound() {
    if (!audioCtx || audioCtx.state !== 'running') return;

    const now = audioCtx.currentTime;

    // 1. Initial Sharp Crack (Noise Burst)
    const bufferSize = audioCtx.sampleRate * 0.1;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
    }

    const crackSource = audioCtx.createBufferSource();
    crackSource.buffer = noiseBuffer;

    const crackFilter = audioCtx.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.setValueAtTime(800, now);

    const crackGain = audioCtx.createGain();
    crackGain.gain.setValueAtTime(0.6 * (efLevel / 3), now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(audioCtx.destination);
    crackSource.start(now);

    // 2. Deep Rumble & Echo (Filtered Noise Sweep)
    const rumbleDuration = 2.5 + Math.random() * 1.5;
    const rumbleSize = audioCtx.sampleRate * rumbleDuration;
    const rumbleBuffer = audioCtx.createBuffer(1, rumbleSize, audioCtx.sampleRate);
    const rumbleData = rumbleBuffer.getChannelData(0);

    for (let i = 0; i < rumbleSize; i++) {
        const t = i / audioCtx.sampleRate;
        const modulation = 0.5 + 0.5 * Math.sin(t * 12) * Math.cos(t * 3);
        rumbleData[i] = (Math.random() * 2 - 1) * modulation;
    }

    const rumbleSource = audioCtx.createBufferSource();
    rumbleSource.buffer = rumbleBuffer;

    const rumbleFilter = audioCtx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(450, now);
    rumbleFilter.frequency.exponentialRampToValueAtTime(50, now + rumbleDuration);

    const rumbleGain = audioCtx.createGain();
    rumbleGain.gain.setValueAtTime(0.8 * (efLevel / 3), now + 0.02);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + rumbleDuration);

    rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(audioCtx.destination);
    rumbleSource.start(now + 0.02);

    // 3. Bass Sub-Drop (Shockwave)
    const subOsc = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 1.2);

    subGain.gain.setValueAtTime(0.7 * (efLevel / 3), now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    subOsc.connect(subGain);
    subGain.connect(audioCtx.destination);

    subOsc.start(now);
    subOsc.stop(now + 1.5);
}

// Global user interaction listener to unlock Web Audio in Chrome
const unlockAudio = () => {
    initAudio();
    if (audioCtx && audioCtx.state === 'running') {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
    }
};

window.addEventListener('click', unlockAudio);
window.addEventListener('keydown', unlockAudio);

// UI Listeners
efSelect.addEventListener('change', (e) => {
    efLevel = parseInt(e.target.value);
    widthMult = 0.5 + (efLevel * 0.35);
    suctionMult = 0.5 + (efLevel * 0.4);
    speedMult = 0.6 + (efLevel * 0.3);

    widthSlider.value = widthMult;
    suctionSlider.value = suctionMult;
    speedSlider.value = speedMult;
    updateLabelDisplays();
});

widthSlider.addEventListener('input', (e) => { widthMult = parseFloat(e.target.value); updateLabelDisplays(); });
suctionSlider.addEventListener('input', (e) => { suctionMult = parseFloat(e.target.value); updateLabelDisplays(); });
speedSlider.addEventListener('input', (e) => { speedMult = parseFloat(e.target.value); updateLabelDisplays(); });

function updateLabelDisplays() {
    widthVal.textContent = `${widthMult.toFixed(1)}x`;
    suctionVal.textContent = `${suctionMult.toFixed(1)}x`;
    speedVal.textContent = `${speedMult.toFixed(1)}x`;
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// 1. Storm Cloud Layer
const cloudParticles = [];
for (let i = 0; i < 160; i++) {
    cloudParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * 120,
        sizeX: 60 + Math.random() * 100,
        sizeY: 30 + Math.random() * 50,
        shade: Math.floor(15 + Math.random() * 25),
        speed: (Math.random() - 0.5) * 0.4
    });
}

// 2. Heavy Rain Drops
const rainDrops = [];
for (let i = 0; i < 250; i++) {
    rainDrops.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        length: 14 + Math.random() * 16,
        speedY: 20 + Math.random() * 10,
        speedX: -5 - Math.random() * 3
    });
}

// 3. Tornado Funnel Particles
const numParticles = 650;
const tornadoParticles = [];
for (let i = 0; i < numParticles; i++) {
    tornadoParticles.push({
        y: Math.random(), 
        angle: Math.random() * Math.PI * 2,
        speed: 0.04 + Math.random() * 0.04,
        size: 8 + Math.random() * 14,
        colorShift: Math.random()
    });
}

// Helper: Build a Modular Blocky Structure
function createModularBuilding(name, xOffset, width, height, bodyColor, roofColor) {
    const blocks = [];
    const blockSize = 6;
    const cols = Math.floor(width / blockSize);
    const rows = Math.floor(height / blockSize);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const isRoof = r < 2;
            blocks.push({
                relX: c * blockSize,
                relY: r * blockSize,
                size: blockSize,
                color: isRoof ? roofColor : bodyColor,
                intact: true
            });
        }
    }
    return { name, xOffset, width, height, blocks, blockSize };
}

// 4. Modular Farm Buildings
const farmBuildings = [
    createModularBuilding('Red Barn', -260, 84, 66, '#b91c1c', '#7f1d1d'),
    createModularBuilding('Farmhouse', -140, 66, 54, '#cbd5e1', '#334155'),
    createModularBuilding('Silo', 150, 42, 90, '#94a3b8', '#475569'),
    createModularBuilding('Windmill', 260, 48, 78, '#d97706', '#78350f')
];

// 5. Ground Dirt Layer
const farmlandBlocks = [];
const segmentWidth = 14;
for (let x = 0; x < window.innerWidth + segmentWidth; x += segmentWidth) {
    farmlandBlocks.push({
        x: x,
        depth: 45,
        minDepth: 8,
        cropColor: ((Math.floor(x / 28)) % 2 === 0) ? '#65a30d' : '#78350f'
    });
}

// Object Pool Hard Limits
const MAX_DEBRIS = 120;
const MAX_DRILL_DUST = 35;

const debrisList = [];
const drillDustParticles = [];
const rescueUnits = [];
let tabTime = 0;

// Deploy Rescue Squad
emergencyBtn.addEventListener('click', () => {
    const startX = 20; 
    
    rescueUnits.push({
        type: 'vehicle',
        x: startX,
        y: canvas.height - 45,
        width: 38,
        height: 22,
        speed: 3 + Math.random() * 1.5,
        color: '#f8fafc',
        accentColor: '#dc2626',
        isSuckedUp: false,
        angle: 0,
        orbitRadius: 0,
        heightProgress: 0,
        rotationSpeed: 0.04 + Math.random() * 0.02
    });

    for (let i = 0; i < 3; i++) {
        rescueUnits.push({
            type: 'worker',
            x: startX - (25 + i * 20),
            y: canvas.height - 45,
            width: 8,
            height: 14,
            speed: 2 + Math.random() * 1,
            color: '#3b82f6',
            headColor: '#fde047',
            isSuckedUp: false,
            angle: 0,
            orbitRadius: 0,
            heightProgress: 0,
            rotationSpeed: 0.05 + Math.random() * 0.03
        });
    }
});

// Tear-Off Building Destruction
function triggerRealisticDestruction() {
    if (debrisList.length >= MAX_DEBRIS) return;

    const centerX = canvas.width / 2;
    const bottomY = canvas.height;

    const availableBuildings = farmBuildings.filter(b => b.blocks.some(blk => blk.intact));
    if (availableBuildings.length > 0 && Math.random() < 0.6) {
        const b = availableBuildings[Math.floor(Math.random() * availableBuildings.length)];
        const intactBlocks = b.blocks.filter(blk => blk.intact);
        
        const targetBlock = intactBlocks[Math.floor(Math.random() * intactBlocks.length)];
        targetBlock.intact = false;

        const worldX = centerX + b.xOffset + targetBlock.relX;
        const worldY = bottomY - 45 - b.height + targetBlock.relY;

        debrisList.push({
            x: worldX,
            y: worldY,
            angle: Math.atan2(0, worldX - centerX),
            orbitRadius: Math.abs(worldX - centerX),
            heightProgress: 0.05,
            color: targetBlock.color,
            size: targetBlock.size * (1 + Math.random() * 0.5),
            rotationSpeed: 0.03 + Math.random() * 0.04
        });
    }
}

// Capped Drill Erosion
function processDrillErosion(centerX, bottomY) {
    const drillRadius = 45 * widthMult;

    farmlandBlocks.forEach(b => {
        const distToCenter = Math.abs((b.x + segmentWidth / 2) - centerX);
        if (distToCenter < drillRadius) {
            if (b.depth > b.minDepth) {
                const erosionFactor = (1 - distToCenter / drillRadius) * 0.5 * suctionMult;
                b.depth = Math.max(b.minDepth, b.depth - erosionFactor);

                if (debrisList.length < MAX_DEBRIS && Math.random() < 0.15) {
                    debrisList.push({
                        x: b.x + Math.random() * segmentWidth,
                        y: bottomY - b.depth,
                        angle: Math.random() * Math.PI * 2,
                        orbitRadius: distToCenter + Math.random() * 15,
                        heightProgress: 0.0,
                        color: b.cropColor,
                        size: 4 + Math.random() * 4,
                        rotationSpeed: 0.04 + Math.random() * 0.04
                    });
                }
            }
        }
    });

    if (drillDustParticles.length < MAX_DRILL_DUST && Math.random() < 0.4) {
        const pAngle = Math.random() * Math.PI * 2;
        const pRad = Math.random() * drillRadius;
        drillDustParticles.push({
            x: centerX + Math.cos(pAngle) * pRad,
            y: bottomY - 12 + (Math.random() - 0.5) * 10,
            size: 5 + Math.random() * 8,
            shade: Math.floor(40 + Math.random() * 35),
            alpha: 0.7,
            vx: (Math.random() - 0.5) * 3,
            vy: -1 - Math.random() * 2
        });
    }
}

// Main Engine Loop
let searchAngle = 0;
let lightningFlash = 0;

function renderFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const bottomY = canvas.height;
    const topY = canvas.height * 0.12;

    tabTime += 1;

    // Dynamically modulate wind rumble
    if (audioCtx && windFilter && windGain) {
        const targetFreq = 100 + (speedMult * 180) + (Math.sin(tabTime * 0.05) * 40);
        windFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.1);
        windGain.gain.setTargetAtTime(0.12 * suctionMult, audioCtx.currentTime, 0.1);
    }

    const destructionInterval = Math.max(6, Math.floor(35 / suctionMult));
    if (tabTime % destructionInterval === 0) {
        triggerRealisticDestruction();
    }

    processDrillErosion(centerX, bottomY);

    // Lightning Flash & Audio Trigger
    if (Math.random() < 0.003 * efLevel) {
        lightningFlash = 0.85;
        playThunderSound();
    }

    if (lightningFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        lightningFlash -= 0.06;
    }

    // --- 1. Clouds ---
    cloudParticles.forEach(c => {
        c.x += c.speed * speedMult;
        if (c.x > canvas.width + 100) c.x = -100;
        if (c.x < -100) c.x = canvas.width + 100;

        ctx.fillStyle = `rgb(${c.shade}, ${c.shade + 5}, ${c.shade + 15})`;
        ctx.fillRect(c.x, c.y, c.sizeX, c.sizeY);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(c.x, c.y, c.sizeX, c.sizeY);
    });

    // --- 2. Rain ---
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    rainDrops.forEach(r => {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.speedX, r.y + r.length);
        r.x += r.speedX * speedMult;
        r.y += r.speedY * (0.8 + efLevel * 0.1);

        if (r.y > canvas.height) {
            r.y = -20;
            r.x = Math.random() * canvas.width;
        }
    });
    ctx.stroke();

    // Rescue Squad Physics
    rescueUnits.forEach((u, index) => {
        if (!u.isSuckedUp) {
            u.x += u.speed;
            const distToVortex = Math.abs(u.x - centerX);
            if (distToVortex < 180 * widthMult) {
                u.isSuckedUp = true;
                u.angle = Math.atan2(0, u.x - centerX);
                u.orbitRadius = distToVortex;
            }
        } else {
            u.angle += u.rotationSpeed * speedMult;
            const targetRadius = (20 + Math.pow(u.heightProgress, 1.8) * 260) * widthMult;
            u.orbitRadius += (targetRadius - u.orbitRadius) * 0.03 * suctionMult;
            u.heightProgress += 0.0018 * suctionMult;

            if (u.heightProgress > 0.95) rescueUnits.splice(index, 1);
        }
    });

    // Debris Physics
    for (let i = debrisList.length - 1; i >= 0; i--) {
        const d = debrisList[i];
        d.angle += d.rotationSpeed * speedMult;
        const targetRadius = (15 + Math.pow(d.heightProgress, 1.8) * 280) * widthMult;
        d.orbitRadius += (targetRadius - d.orbitRadius) * 0.03 * suctionMult;
        d.heightProgress += 0.0018 * suctionMult;

        if (d.heightProgress > 0.95) debrisList.splice(i, 1);
    }

    // Search Bar Orbit
    searchAngle += 0.015 * speedMult;
    const searchX = centerX + Math.cos(searchAngle) * (280 * widthMult);
    const searchY = (canvas.height * 0.5) + Math.sin(searchAngle) * 55;

    searchBox.style.left = `${searchX}px`;
    searchBox.style.top = `${searchY}px`;
    searchBox.style.transform = `translate(-50%, -50%) scale(${0.75 + (Math.sin(searchAngle) + 1) * 0.25})`;
    searchBox.style.zIndex = (Math.sin(searchAngle) >= 0) ? '20' : '2';

    // --- 3. Objects BEHIND Funnel ---
    debrisList.forEach(d => {
        if (Math.sin(d.angle) < 0) drawBlockDebris(d, centerX, bottomY, topY);
    });
    rescueUnits.forEach(u => {
        if (u.isSuckedUp && Math.sin(u.angle) < 0) drawRescueUnit(u, centerX, bottomY, topY);
    });

    // --- 4. Tornado Funnel ---
    tornadoParticles.sort((a, b) => Math.sin(a.angle) - Math.sin(b.angle));
    tornadoParticles.forEach(p => {
        p.angle += p.speed * speedMult;
        const radius = (15 + Math.pow(p.y, 1.8) * 300) * widthMult;
        const currentY = bottomY - (p.y * (bottomY - topY));
        const x = centerX + Math.cos(p.angle) * radius;
        const depthScale = 0.5 + (Math.sin(p.angle) + 1) * 0.5;

        const shade = Math.floor(50 + p.colorShift * 110 * depthScale);
        ctx.fillStyle = `rgb(${shade}, ${shade + 15}, ${shade + 35})`;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;

        const blockSize = p.size * depthScale * (0.8 + widthMult * 0.2);
        ctx.fillRect(x - blockSize / 2, currentY - blockSize / 2, blockSize, blockSize);
        ctx.strokeRect(x - blockSize / 2, currentY - blockSize / 2, blockSize, blockSize);
    });

    // --- 5. Drill Dust Particle Engine ---
    for (let i = drillDustParticles.length - 1; i >= 0; i--) {
        const p = drillDustParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;

        if (p.alpha <= 0) {
            drillDustParticles.splice(i, 1);
            continue;
        }

        ctx.fillStyle = `rgba(${p.shade}, ${p.shade - 10}, ${p.shade - 20}, ${p.alpha})`;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.strokeStyle = `rgba(0,0,0,${p.alpha * 0.5})`;
        ctx.strokeRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }

    // --- 6. Objects IN FRONT of Funnel ---
    debrisList.forEach(d => {
        if (Math.sin(d.angle) >= 0) drawBlockDebris(d, centerX, bottomY, topY);
    });
    rescueUnits.forEach(u => {
        if (u.isSuckedUp && Math.sin(u.angle) >= 0) drawRescueUnit(u, centerX, bottomY, topY);
    });

    // --- 7. Drilled Ground Dirt Layer ---
    farmlandBlocks.forEach(b => {
        if (b.depth > 2) {
            ctx.fillStyle = b.cropColor;
            ctx.fillRect(b.x, bottomY - b.depth, segmentWidth - 1, b.depth);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(b.x, bottomY - b.depth, segmentWidth - 1, b.depth);
        }
    });

    // --- 8. Modular Voxel Buildings ---
    farmBuildings.forEach(b => {
        const baseX = centerX + b.xOffset;
        const baseY = bottomY - 45 - b.height;

        b.blocks.forEach(blk => {
            if (blk.intact) {
                ctx.fillStyle = blk.color;
                ctx.fillRect(baseX + blk.relX, baseY + blk.relY, blk.size, blk.size);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(baseX + blk.relX, baseY + blk.relY, blk.size, blk.size);
            }
        });
    });

    // Grounded Rescue Squad
    rescueUnits.forEach(u => {
        if (!u.isSuckedUp) drawRescueUnit(u, centerX, bottomY, topY);
    });

    requestAnimationFrame(renderFrame);
}

// Render Debris
function drawBlockDebris(d, centerX, bottomY, topY) {
    const currentY = (bottomY - 45) - (d.heightProgress * (bottomY - topY));
    const x = centerX + Math.cos(d.angle) * d.orbitRadius;
    const depthScale = 0.6 + (Math.sin(d.angle) + 1) * 0.4;

    const renderSize = d.size * depthScale;
    ctx.fillStyle = d.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    ctx.fillRect(x - renderSize / 2, currentY - renderSize / 2, renderSize, renderSize);
    ctx.strokeRect(x - renderSize / 2, currentY - renderSize / 2, renderSize, renderSize);
}

// Render Rescue Squad
function drawRescueUnit(u, centerX, bottomY, topY) {
    let x = u.x;
    let y = u.y;
    let depthScale = 1;

    if (u.isSuckedUp) {
        y = (bottomY - 45) - (u.heightProgress * (bottomY - topY));
        x = centerX + Math.cos(u.angle) * u.orbitRadius;
        depthScale = 0.6 + (Math.sin(u.angle) + 1) * 0.4;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(depthScale, depthScale);

    if (u.type === 'vehicle') {
        ctx.fillStyle = u.color;
        ctx.fillRect(-u.width / 2, -u.height, u.width, u.height);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(-u.width / 2, -u.height, u.width, u.height);

        ctx.fillStyle = u.accentColor;
        ctx.fillRect(-4, -u.height + 6, 8, 8);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-u.width / 2 + 4, 0, 8, 4);
        ctx.fillRect(u.width / 2 - 12, 0, 8, 4);
    } else {
        ctx.fillStyle = u.color;
        ctx.fillRect(-u.width / 2, -u.height, u.width, u.height);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(-u.width / 2, -u.height, u.width, u.height);

        ctx.fillStyle = u.headColor;
        ctx.fillRect(-u.width / 2 - 1, -u.height - 4, u.width + 2, 4);
    }

    ctx.restore();
}

renderFrame();
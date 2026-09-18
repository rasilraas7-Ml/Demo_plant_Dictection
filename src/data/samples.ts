import { SampleLeaf } from '../types';

// Helper to draw realistic procedural leaves onto an offscreen canvas and return data URLs
export function generateSampleLeafImage(type: 'early_blight' | 'late_blight' | 'bacterial_spot' | 'healthy' | 'leaf_mold'): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Soft neutral background with subtle texture
  const bgGrad = ctx.createLinearGradient(0, 0, 480, 480);
  bgGrad.addColorStop(0, '#f1f5f9');
  bgGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 480, 480);

  // Subtle grid/surface texture
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
  ctx.lineWidth = 1;
  for (let i = 40; i < 480; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 480);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(480, i);
    ctx.stroke();
  }

  // Draw Leaf Shadow
  ctx.save();
  ctx.translate(240, 240);
  ctx.rotate(-0.15);

  ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 12;

  // Draw Leaf Shape (organic ovate leaf with serrations)
  ctx.beginPath();
  ctx.moveTo(0, 170); // Petiole / Stem base
  // Left side
  ctx.bezierCurveTo(-110, 120, -170, 40, -150, -40);
  ctx.bezierCurveTo(-140, -90, -90, -160, 0, -200); // Tip
  // Right side
  ctx.bezierCurveTo(90, -160, 140, -90, 150, -40);
  ctx.bezierCurveTo(170, 40, 110, 120, 0, 170);
  ctx.closePath();

  // Leaf Base Green Gradient
  const leafGrad = ctx.createRadialGradient(0, -20, 20, 0, 0, 220);
  if (type === 'healthy') {
    leafGrad.addColorStop(0, '#22c55e'); // vibrant chlorophyll
    leafGrad.addColorStop(0.6, '#15803d');
    leafGrad.addColorStop(1, '#14532d');
  } else if (type === 'early_blight') {
    leafGrad.addColorStop(0, '#4ade80');
    leafGrad.addColorStop(0.5, '#16a34a');
    leafGrad.addColorStop(1, '#166534');
  } else if (type === 'late_blight') {
    leafGrad.addColorStop(0, '#86efac');
    leafGrad.addColorStop(0.5, '#15803d');
    leafGrad.addColorStop(1, '#1e3a1e');
  } else if (type === 'bacterial_spot') {
    leafGrad.addColorStop(0, '#a3e635');
    leafGrad.addColorStop(0.5, '#4d7c0f');
    leafGrad.addColorStop(1, '#365314');
  } else {
    leafGrad.addColorStop(0, '#86efac');
    leafGrad.addColorStop(0.5, '#22c55e');
    leafGrad.addColorStop(1, '#14532d');
  }

  ctx.fillStyle = leafGrad;
  ctx.fill();
  ctx.restore();

  // Draw Leaf Veins
  ctx.save();
  ctx.translate(240, 240);
  ctx.rotate(-0.15);

  ctx.strokeStyle = 'rgba(234, 255, 200, 0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 170);
  ctx.quadraticCurveTo(5, 0, 0, -195); // Main Central Midrib Vein
  ctx.stroke();

  // Secondary Lateral Veins
  const veinPairs = [
    { y: 110, lx: -70, rx: 75, dy: -30 },
    { y: 60, lx: -105, rx: 110, dy: -40 },
    { y: 10, lx: -125, rx: 125, dy: -45 },
    { y: -40, lx: -110, rx: 115, dy: -40 },
    { y: -90, lx: -85, rx: 85, dy: -35 },
    { y: -140, lx: -45, rx: 45, dy: -25 },
  ];

  ctx.lineWidth = 2;
  veinPairs.forEach(vp => {
    ctx.beginPath();
    ctx.moveTo(0, vp.y);
    ctx.quadraticCurveTo(-30, vp.y + vp.dy * 0.3, vp.lx, vp.y + vp.dy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, vp.y);
    ctx.quadraticCurveTo(30, vp.y + vp.dy * 0.3, vp.rx, vp.y + vp.dy);
    ctx.stroke();
  });

  // DRAW SPECIFIC LESION/DAMAGE PATTERNS FOR DISEASED LEAVES
  if (type === 'early_blight') {
    // Alternaria concentric ring spots with chlorotic yellow halo
    const lesions = [
      { x: -55, y: -45, r: 38 },
      { x: 45, y: 30, r: 42 },
      { x: -30, y: 65, r: 28 },
      { x: 50, y: -80, r: 24 }
    ];

    lesions.forEach(l => {
      // Yellow Chlorotic Halo
      const haloGrad = ctx.createRadialGradient(l.x, l.y, l.r * 0.4, l.x, l.y, l.r * 1.5);
      haloGrad.addColorStop(0, 'rgba(234, 179, 8, 0.85)');
      haloGrad.addColorStop(0.7, 'rgba(202, 138, 4, 0.5)');
      haloGrad.addColorStop(1, 'rgba(202, 138, 4, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r * 1.45, 0, Math.PI * 2);
      ctx.fill();

      // Necrotic Dark Brown concentric target-rings
      const targetGrad = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.r);
      targetGrad.addColorStop(0, '#2d1810');
      targetGrad.addColorStop(0.35, '#451a03');
      targetGrad.addColorStop(0.65, '#30140b');
      targetGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = targetGrad;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctx.fill();

      // Concentric inner rings
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    });
  } else if (type === 'late_blight') {
    // Large water-soaked dark irregular greasy patches
    const lesions = [
      { x: -50, y: -20, rx: 70, ry: 45, angle: 0.4 },
      { x: 35, y: 70, rx: 55, ry: 65, angle: -0.3 },
      { x: 20, y: -110, rx: 40, ry: 50, angle: 0.2 }
    ];

    lesions.forEach(l => {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.angle);

      // Diffuse pale halo
      const halo = ctx.createRadialGradient(0, 0, 20, 0, 0, Math.max(l.rx, l.ry) * 1.3);
      halo.addColorStop(0, 'rgba(163, 230, 53, 0.7)');
      halo.addColorStop(1, 'rgba(163, 230, 53, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.ellipse(0, 0, l.rx * 1.25, l.ry * 1.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark necrotic water-soaked rot
      const rot = ctx.createRadialGradient(0, 0, 5, 0, 0, Math.max(l.rx, l.ry));
      rot.addColorStop(0, '#1c1917');
      rot.addColorStop(0.6, '#292524');
      rot.addColorStop(0.9, '#44403c');
      rot.addColorStop(1, 'rgba(68, 64, 60, 0.9)');
      ctx.fillStyle = rot;
      ctx.beginPath();
      ctx.ellipse(0, 0, l.rx, l.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Delicate white mold sporulation speckles on margin
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let s = 0; s < 18; s++) {
        const theta = (s / 18) * Math.PI * 2;
        const sx = Math.cos(theta) * (l.rx * 0.9) + (Math.random() * 8 - 4);
        const sy = Math.sin(theta) * (l.ry * 0.9) + (Math.random() * 8 - 4);
        ctx.beginPath();
        ctx.arc(sx, sy, 2 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  } else if (type === 'bacterial_spot') {
    // Clusters of small angular necrotic spots with yellow borders
    const spots = [
      { x: -60, y: -20, r: 8 }, { x: -45, y: -35, r: 12 }, { x: -35, y: -15, r: 9 },
      { x: -70, y: 10, r: 14 }, { x: -50, y: 25, r: 11 }, { x: -30, y: 35, r: 7 },
      { x: 30, y: -60, r: 10 }, { x: 45, y: -45, r: 13 }, { x: 60, y: -70, r: 8 },
      { x: 40, y: 20, r: 12 }, { x: 55, y: 35, r: 15 }, { x: 25, y: 45, r: 9 },
      { x: 0, y: -100, r: 11 }, { x: -15, y: -80, r: 10 }, { x: 15, y: -75, r: 12 }
    ];

    spots.forEach(sp => {
      // Yellow halo
      ctx.fillStyle = 'rgba(250, 204, 21, 0.75)';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Scabby brown center
      ctx.fillStyle = '#3f1f0a';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === 'leaf_mold') {
    // Diffuse yellowish-olive chlorotic patches
    const patches = [
      { x: -40, y: -50, r: 40 },
      { x: 35, y: -10, r: 48 },
      { x: -20, y: 60, r: 44 }
    ];

    patches.forEach(p => {
      const grad = ctx.createRadialGradient(p.x, p.y, 5, p.x, p.y, p.r);
      grad.addColorStop(0, 'rgba(101, 163, 13, 0.9)');
      grad.addColorStop(0.5, 'rgba(163, 230, 53, 0.7)');
      grad.addColorStop(1, 'rgba(163, 230, 53, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.92);
}

export const SAMPLE_LEAVES: SampleLeaf[] = [
  {
    id: 'sample_tomato_early_blight',
    name: 'Tomato Early Blight',
    plant: 'Tomato',
    expectedDisease: 'Early Blight',
    description: 'Target-board circular lesions with chlorotic yellow halo (~24% damage).',
    thumbnailUrl: '',
    imageDataUrl: ''
  },
  {
    id: 'sample_potato_late_blight',
    plant: 'Potato',
    name: 'Potato Late Blight',
    expectedDisease: 'Late Blight',
    description: 'Severe water-soaked necrotic rot with sporulating margins (~48% damage).',
    thumbnailUrl: '',
    imageDataUrl: ''
  },
  {
    id: 'sample_pepper_bacterial_spot',
    plant: 'Pepper',
    name: 'Pepper Bacterial Spot',
    expectedDisease: 'Bacterial Spot',
    description: 'Dispersed necrotic angular lesions with yellow halos (~16% damage).',
    thumbnailUrl: '',
    imageDataUrl: ''
  },
  {
    id: 'sample_tomato_healthy',
    plant: 'Tomato',
    name: 'Healthy Tomato Leaf',
    expectedDisease: 'Healthy',
    description: 'Uniform vibrant chlorophyll saturation without lesion spots (0.5% damage).',
    thumbnailUrl: '',
    imageDataUrl: ''
  },
  {
    id: 'sample_tomato_leaf_mold',
    plant: 'Tomato',
    name: 'Tomato Leaf Mold',
    expectedDisease: 'Leaf Mold',
    description: 'Diffuse chlorotic yellow blotches and olive-velvet spore patches (~19% damage).',
    thumbnailUrl: '',
    imageDataUrl: ''
  }
];

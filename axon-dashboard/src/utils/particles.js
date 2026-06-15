/**
 * High-performance, lightweight background particle constellation animation.
 * Draws subtle drifting points and connecting lines.
 */
export function initParticles() {
  // Check if canvas already exists
  if (document.getElementById('bg-canvas')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  
  // Style the canvas to sit behind everything
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: '-1',
    pointerEvents: 'none',
    opacity: '0.4', // subtle background presence
  });
  
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId = null;

  // Configuration
  const baseCount = 50; // default particle density
  const connectionDistance = 140;

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initPhase = false) {
      this.x = Math.random() * canvas.width;
      this.y = initPhase ? Math.random() * canvas.height : (Math.random() > 0.5 ? -10 : canvas.height + 10);
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = (Math.random() - 0.5) * 0.25;
      this.r = Math.random() * 1.25 + 0.75;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Handle bounce / wrap bounds
      if (this.x < -20 || this.x > canvas.width + 20 || this.y < -20 || this.y > canvas.height + 20) {
        this.reset(false);
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fill();
    }
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Scale particle count with screen size
    const screenArea = canvas.width * canvas.height;
    const particleCount = Math.min(Math.floor(screenArea / 25000), 80);
    
    // Clear out of bounds particles or fill to target
    if (particles.length > particleCount) {
      particles = particles.slice(0, particleCount);
    } else {
      while (particles.length < particleCount) {
        particles.push(new Particle());
      }
    }
  }

  window.addEventListener('resize', resize);
  resize();

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      p1.update();
      p1.draw();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const alpha = (1 - dist / connectionDistance) * 0.08;
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
    
    animationId = requestAnimationFrame(animate);
  }

  animate();
}

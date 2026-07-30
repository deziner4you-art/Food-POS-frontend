import React, { useEffect, useRef } from 'react';

export const Hero3DCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle system for glowing golden smoke / steam & sparkles
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: string;
    }> = [];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedY: Math.random() * 0.8 + 0.2,
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.6 + 0.2,
        color: Math.random() > 0.3 ? '#D4AF37' : '#FFFFFF',
      });
    }

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 + Math.sin(angle) * 12; // Subtle levitation floating effect
      angle += 0.02;

      // Draw Golden Halo Glow behind Platter
      const radialGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        20,
        centerX,
        centerY,
        width * 0.45
      );
      radialGlow.addColorStop(0, 'rgba(212, 175, 55, 0.25)');
      radialGlow.addColorStop(0.5, 'rgba(212, 175, 55, 0.05)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Draw 3D Elliptical Platter Base (Perspective view)
      const platterWidth = Math.min(width * 0.7, 340);
      const platterHeight = platterWidth * 0.35;

      // Outer Shadow
      ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
      ctx.shadowBlur = 25;

      // Platter Rim (Gold ring)
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 10, platterWidth / 2, platterHeight / 2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Platter Surface
      const platterGrad = ctx.createLinearGradient(
        centerX - platterWidth / 2,
        centerY,
        centerX + platterWidth / 2,
        centerY
      );
      platterGrad.addColorStop(0, '#1A1A1D');
      platterGrad.addColorStop(0.5, '#2D2A21');
      platterGrad.addColorStop(1, '#110E07');

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, platterWidth / 2 - 4, platterHeight / 2 - 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = platterGrad;
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw Abstract Golden Gourmet Spheres / Dish Highlights
      const spherePositions = [
        { offsetX: -60, offsetY: -10, radius: 24, color: '#D4AF37' },
        { offsetX: 40, offsetY: -15, radius: 28, color: '#EAE1D4' },
        { offsetX: 0, offsetY: -25, radius: 32, color: '#F2CA50' },
        { offsetX: -30, offsetY: 10, radius: 18, color: '#8C6D1F' },
        { offsetX: 50, offsetY: 12, radius: 20, color: '#D4AF37' }
      ];

      spherePositions.forEach((sp) => {
        const sx = centerX + sp.offsetX;
        const sy = centerY + sp.offsetY;

        const sphereGrad = ctx.createRadialGradient(
          sx - sp.radius * 0.3,
          sy - sp.radius * 0.3,
          2,
          sx,
          sy,
          sp.radius
        );
        sphereGrad.addColorStop(0, '#FFFFFF');
        sphereGrad.addColorStop(0.3, sp.color);
        sphereGrad.addColorStop(1, '#000000');

        ctx.beginPath();
        ctx.arc(sx, sy, sp.radius, 0, Math.PI * 2);
        ctx.fillStyle = sphereGrad;
        ctx.fill();
      });

      // Update and draw steam particles
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full max-w-lg max-h-[450px] object-contain" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1A1A1D]/90 border border-[#D4AF37]/30 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-semibold text-[#D4AF37] shadow-xl flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
        Interactive Live Culinary Presentation
      </div>
    </div>
  );
};

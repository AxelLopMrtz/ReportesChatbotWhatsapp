import React, { useEffect, useRef } from 'react';

export default function ThreeBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];
    const numParticles = 80; // Más partículas para un aspecto más denso
    const maxDistance = 200; // Distancia máxima para dibujar líneas

    // Crear partículas
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8, // Movimiento ligeramente más rápido
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 80 + 30, // Tamaños más grandes y variados para el efecto borroso
        opacity: Math.random() * 0.2 + 0.05, // Opacidad base más baja
        color: `rgba(0, 255, 204, ${Math.random() * 0.2 + 0.05})` // Color cyan
      });
    }

    const animate = () => {
      // Limpiar el canvas con un ligero efecto de desvanecimiento para el rastro
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; // Fondo oscuro con opacidad para el rastro
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        // Actualizar posición
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Rebotar en los bordes
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Dibujar partícula (círculo borroso)
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'rgba(0, 255, 204, 0)'); // Se desvanece a transparente

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Dibujar conexiones (líneas sutiles)
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.05)'; // Líneas cyan muy sutiles
      ctx.lineWidth = 1;
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="three-background" // Mantenemos la clase para que tu CSS existente la use
      style={{ background: 'linear-gradient(135deg, #000000 0%, #0a2f2a 100%)' }} // Fondo degradado oscuro
    />
  );
}

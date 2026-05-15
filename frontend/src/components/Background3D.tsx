import React, { useEffect, useRef } from 'react';

export function Background3D() {
  const topVideoRef = useRef<HTMLVideoElement>(null);
  const middleVideoRef = useRef<HTMLVideoElement>(null);
  const bottomVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight || 1;
      const maxScroll = Math.max(1, document.body.scrollHeight - vh);
      
      const scrollVH = scrollY / vh;
      const scrollFromBottomVH = (maxScroll - scrollY) / vh;

      let topOpacity = 0;
      let middleOpacity = 0;
      let bottomOpacity = 0;

      // 1. Top to Middle fade (between 0.2 vh and 1.2 vh)
      if (scrollVH < 1.2) {
        // Starts fading at 0.2 vh, fully faded to middle by 1.2 vh
        const progress = Math.max(0, (scrollVH - 0.2) / 1.0);
        topOpacity = 1 - progress;
        middleOpacity = progress;
      } 
      // 2. Middle to Bottom fade (starts 2.0 vh from the bottom)
      else if (scrollFromBottomVH < 2.0) {
        // Fully faded to bottom by 0.5 vh from the bottom
        const progress = 1 - Math.max(0, (scrollFromBottomVH - 0.5) / 1.5);
        middleOpacity = 1 - Math.min(1, Math.max(0, progress));
        bottomOpacity = Math.min(1, Math.max(0, progress));
      } 
      // 3. Middle stays fully visible otherwise
      else {
        middleOpacity = 1;
      }

      if (topVideoRef.current) topVideoRef.current.style.opacity = topOpacity.toString();
      if (middleVideoRef.current) middleVideoRef.current.style.opacity = middleOpacity.toString();
      if (bottomVideoRef.current) bottomVideoRef.current.style.opacity = bottomOpacity.toString();

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-[#E2DAEC] pointer-events-none overflow-hidden">
      
      {/* 3. Bottom Video */}
      <video
        ref={bottomVideoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover will-change-opacity scale-110 origin-center"
        style={{ opacity: 0 }}
        src="/background_bottom.mp4?v=1"
      />

      {/* 2. Middle Video */}
      <video
        ref={middleVideoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover will-change-opacity scale-110 origin-center"
        style={{ opacity: 0 }}
        src="/background_middle.mp4?v=1"
      />

      {/* 1. Top Video */}
      <video
        ref={topVideoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover will-change-opacity scale-110 origin-center"
        style={{ opacity: 1 }}
        src="/background_top.mp4?v=1"
      />

      {/* Subtle Noise Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' 
        }} 
      />
    </div>
  );
}

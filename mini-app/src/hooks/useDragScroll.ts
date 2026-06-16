import { useRef, useEffect } from "react";

export const useDragScroll = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let velocityX = 0;
    let lastX = 0;
    let lastTime = 0;
    let animationFrameId: number | null = null;
    let moved = false;

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle primary button clicks (left click)
      if (e.button !== 0) return;
      isDown = true;
      moved = false;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
      
      startX = e.pageX - el.offsetLeft;
      startY = e.pageY - el.offsetTop;
      scrollLeft = el.scrollLeft;
      
      lastX = e.pageX;
      lastTime = Date.now();
      velocityX = 0;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const handleMouseLeave = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = "grab";
      el.style.removeProperty("user-select");
      applyMomentum();
    };

    const handleMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = "grab";
      el.style.removeProperty("user-select");
      applyMomentum();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;

      const x = e.pageX - el.offsetLeft;
      
      // Calculate drag distance
      const distanceX = Math.abs(e.pageX - (startX + el.offsetLeft));
      const distanceY = Math.abs(e.pageY - (startY + el.offsetTop));
      
      // If moved significantly (more than 5px), flag as moved/dragged
      if (distanceX > 5 || distanceY > 5) {
        moved = true;
      }

      if (moved) {
        e.preventDefault();
        const walk = (x - startX) * 1.5; // Drag speed multiplier
        el.scrollLeft = scrollLeft - walk;

        // Calculate velocity for inertia
        const now = Date.now();
        const elapsed = now - lastTime;
        if (elapsed > 0) {
          const deltaX = e.pageX - lastX;
          velocityX = deltaX / elapsed;
          lastX = e.pageX;
          lastTime = now;
        }
      }
    };

    // Capture click events and block them if the user was dragging
    const handleClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false; // reset
      }
    };

    const applyMomentum = () => {
      if (Math.abs(velocityX) < 0.1) return;

      const momentumScroll = () => {
        if (!el) return;
        el.scrollLeft -= velocityX * 16; // 16ms approx frame time
        velocityX *= 0.90; // friction decay

        if (Math.abs(velocityX) > 0.1) {
          animationFrameId = requestAnimationFrame(momentumScroll);
        }
      };

      animationFrameId = requestAnimationFrame(momentumScroll);
    };

    el.style.cursor = "grab";
    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("mouseup", handleMouseUp);
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("click", handleClick, true); // Use capture phase

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("mouseup", handleMouseUp);
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("click", handleClick, true);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return ref;
};

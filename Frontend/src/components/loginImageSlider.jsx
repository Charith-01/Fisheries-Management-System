// src/components/LoginImageSlider.jsx
import { useEffect, useState } from "react";

export default function LoginImageSlider() {
  const images = ["/login-bg1.jpg", "/login-bg2.jpg", "/login-bg3.jpg"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    // Important: let the parent define width/height; we just fill it
    <div className="relative w-full h-full overflow-hidden">
      {/* Track */}
      <div
        className="flex h-full transition-transform duration-700 will-change-transform"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="min-w-full h-full flex-shrink-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${src})` }}
            aria-hidden={i !== index}
          />
        ))}
      </div>

      {/* Optional gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-black/0" />

      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

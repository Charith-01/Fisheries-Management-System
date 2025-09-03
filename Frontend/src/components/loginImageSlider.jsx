// src/components/LoginImageSlider.jsx
import { useEffect, useState } from "react";

export default function LoginImageSlider() {
  const images = [
    "/login-bg1.jpg",
    "/login-bg2.jpg",
    "/login-bg3.jpg"
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="w-full md:w-[60%] h-[40vh] md:h-full relative overflow-hidden ">
      {/* track with all slides */}
      <div
        className="flex h-full w-full transition-transform duration-700"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="w-full h-full flex-shrink-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>

      {/* gradient overlay (optional) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-black/0 pointer-events-none" />

      {/* dots (unchanged) */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full transition-all ${
              i === index ? "bg-white w-6" : "bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

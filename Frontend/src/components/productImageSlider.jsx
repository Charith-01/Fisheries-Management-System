import { useState } from "react";

export default function ProductImageSlider(props){

    const images = props.images || [];
    const [activeImage, setActiveImage] = useState(images[0] || "https://www.shoshinsha-design.com/wp-content/uploads/2020/05/noimage.png");

    return(
        <div className="w-full h-full flex items-center justify-center">
            {/* make this a focusable, keyboard-navigable region */}
            <div
                className="w-[70%] aspect-square relative group outline-none"
                tabIndex={0}
                role="region"
                aria-roledescription="carousel"
                aria-label="Product image gallery"
                onKeyDown={(e) => {
                    if (!images.length) return;
                    const i = Math.max(0, images.indexOf(activeImage));
                    if (e.key === "ArrowRight" || e.key === " ") {
                        const next = images[(i + 1) % images.length];
                        setActiveImage(next);
                    } else if (e.key === "ArrowLeft") {
                        const prev = images[(i - 1 + images.length) % images.length];
                        setActiveImage(prev);
                    }
                }}
            >
                {/* Main image */}
                <img
                    src={activeImage}
                    alt="Product Image"
                    className="w-full h-full object-cover rounded-2xl shadow-xl transition-transform duration-500 group-hover:scale-[1.02] cursor-zoom-in bg-slate-100"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="high"
                    draggable={false}
                    onClick={() => {
                        if (!images.length) return;
                        // click to advance
                        const i = Math.max(0, images.indexOf(activeImage));
                        const next = images[(i + 1) % images.length];
                        setActiveImage(next);
                    }}
                    onError={(e) => {
                        e.currentTarget.src = "https://www.shoshinsha-design.com/wp-content/uploads/2020/05/noimage.png";
                    }}
                    title="Click or press → to view next image"
                />

                {/* Thumbnails strip (same element, just modern styling) */}
                <div className="rounded-2xl h-[75px] w-full absolute bottom-0 flex justify-center items-center gap-2 px-3 overflow-x-auto rounded-b-2xl border-t border-slate-200 bg-white/70 backdrop-blur-sm">
                    {
                        images.map(
                            (image, index)=>{
                                const isActive = image === activeImage;
                                return(
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`Product Image ${index + 1}`}
                                        className={`h-full aspect-square mx-[5px] cursor-pointer rounded-xl object-cover transition
                                            ${isActive
                                                ? "ring-2 ring-blue-600 scale-100 opacity-100"
                                                : "ring-1 ring-slate-200 hover:ring-blue-400 hover:scale-105 opacity-80 hover:opacity-100"
                                            }`}
                                        loading="lazy"
                                        draggable={false}
                                        onClick={()=>setActiveImage(image)}
                                        onMouseEnter={()=>setActiveImage(image)}
                                        onError={(e) => {
                                            e.currentTarget.src = "https://www.shoshinsha-design.com/wp-content/uploads/2020/05/noimage.png";
                                        }}
                                        title={`Show image ${index + 1}`}
                                    />
                                )
                            }
                        )
                    }
                </div>
            </div>
        </div>
    )
}

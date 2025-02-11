"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const images = [
  "https://skydd.ng/assets/Onboarding/1.svg",
  "https://skydd.ng/assets/Onboarding/2.svg",
  "https://skydd.ng/assets/Onboarding/3.svg",
  "https://skydd.ng/assets/Onboarding/5.svg",
  "https://skydd.ng/assets/Onboarding/4.svg",
];

export function Slideshow() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="relative h-full w-full">
      <Image
        src={images[currentImage] || "../assets/family.png"}
        alt="Slideshow"
        layout="fill"
        objectFit="cover"
        className="transition-opacity duration-500"
        priority={false}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30 p-8 text-white">
        <h2 className="mb-4 text-4xl font-bold">Welcome to Our Platform</h2>
        <p className="mb-8 text-xl">
          Discover amazing features and opportunities
        </p>
        <div className="flex space-x-4">
          <button
            onClick={prevImage}
            className="rounded-full bg-white bg-opacity-20 p-2 transition-colors hover:bg-opacity-30"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextImage}
            className="rounded-full bg-white bg-opacity-20 p-2 transition-colors hover:bg-opacity-30"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

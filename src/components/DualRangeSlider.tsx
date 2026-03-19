"use client";

import { useState, useEffect } from "react";

const MAX_PRICE = 1000;

interface DualRangeSliderProps {
  min: number;
  max: number;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
}

export function DualRangeSlider({
  min,
  max,
  onMinChange,
  onMaxChange,
}: DualRangeSliderProps) {
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const slider = document.getElementById("price-slider");
      if (!slider) return;
      const rect = slider.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
      );
      const value = Math.round(((percentage / 100) * MAX_PRICE) / 10) * 10;
      if (dragging === "min") onMinChange(Math.min(value, max - 10));
      else onMaxChange(Math.max(value, min + 10));
    };
    const handleMouseUp = () => setDragging(null);
    if (dragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, min, max, onMinChange, onMaxChange]);

  const minPercent = (min / MAX_PRICE) * 100;
  const maxPercent = (max / MAX_PRICE) * 100;

  return (
    <div className="px-2" id="price-slider">
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div
          className="absolute h-full bg-indigo-600 rounded-full"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <div
          className="absolute w-5 h-5 bg-white border-2 border-indigo-600 rounded-full -top-1.5 cursor-grab active:cursor-grabbing shadow-md"
          style={{ left: `calc(${minPercent}% - 10px)` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging("min");
          }}
        />
        <div
          className="absolute w-5 h-5 bg-white border-2 border-indigo-600 rounded-full -top-1.5 cursor-grab active:cursor-grabbing shadow-md"
          style={{ left: `calc(${maxPercent}% - 10px)` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging("max");
          }}
        />
      </div>
      <div className="flex justify-between text-sm mt-3">
        <span className="font-medium text-indigo-600">${min}</span>
        <span className="font-medium text-indigo-600">
          ${max === MAX_PRICE ? `${MAX_PRICE}+` : max}
        </span>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const updateValueFromClientX = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(100, ((clientX - rect.left) / rect.width) * 100),
      );
      const value = Math.round(((percentage / 100) * MAX_PRICE) / 10) * 10;
      if (dragging === "min") onMinChange(Math.min(value, max - 10));
      else onMaxChange(Math.max(value, min + 10));
    },
    [dragging, max, min, onMaxChange, onMinChange],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      updateValueFromClientX(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      if (e.touches.length === 0) return;
      updateValueFromClientX(e.touches[0].clientX);
    };

    const handlePointerEnd = () => setDragging(null);

    if (dragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handlePointerEnd);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handlePointerEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handlePointerEnd);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handlePointerEnd);
    };
  }, [dragging, updateValueFromClientX]);

  const minPercent = (min / MAX_PRICE) * 100;
  const maxPercent = (max / MAX_PRICE) * 100;

  return (
    <div className="px-2" ref={sliderRef}>
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div
          className="absolute h-full bg-indigo-600 rounded-full"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <div
          role="slider"
          aria-label="Minimum value"
          aria-valuemin={0}
          aria-valuemax={MAX_PRICE}
          aria-valuenow={min}
          tabIndex={0}
          className="absolute w-5 h-5 bg-white border-2 border-indigo-600 rounded-full -top-1.5 cursor-grab active:cursor-grabbing shadow-md"
          style={{ left: `calc(${minPercent}% - 10px)` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging("min");
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            setDragging("min");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              onMinChange(Math.max(0, min - 10));
            } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              onMinChange(Math.min(max - 10, min + 10));
            } else if (e.key === "Home") {
              onMinChange(0);
            } else if (e.key === "End") {
              onMinChange(max - 10);
            }
          }}
        />
        <div
          role="slider"
          aria-label="Maximum value"
          aria-valuemin={0}
          aria-valuemax={MAX_PRICE}
          aria-valuenow={max}
          tabIndex={0}
          className="absolute w-5 h-5 bg-white border-2 border-indigo-600 rounded-full -top-1.5 cursor-grab active:cursor-grabbing shadow-md"
          style={{ left: `calc(${maxPercent}% - 10px)` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging("max");
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            setDragging("max");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              onMaxChange(Math.max(min + 10, max - 10));
            } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              onMaxChange(Math.min(MAX_PRICE, max + 10));
            } else if (e.key === "Home") {
              onMaxChange(min + 10);
            } else if (e.key === "End") {
              onMaxChange(MAX_PRICE);
            }
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

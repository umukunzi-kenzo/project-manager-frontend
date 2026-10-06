"use client";

import { useTheme } from "../context/ThemeContext";
import { useState, useRef, useEffect } from "react";

export default function FloatingThemeToggle() {
  const { theme, toggleTheme, isMounted, isDarkMode } = useTheme();
  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  useEffect(() => {
    const savedPosition = localStorage.getItem("themeTogglePosition");
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        setPosition(pos);
      } catch {}
    } else {
      setPosition({ x: null, y: null });
    }
  }, []);

  useEffect(() => {
    if (position.x !== null && position.y !== null) {
      localStorage.setItem("themeTogglePosition", JSON.stringify(position));
    }
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - 56;
      const maxY = window.innerHeight - 56;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    
    const rect = buttonRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleClick = (e) => {
    if (!isDragging) {
      toggleTheme();
    }
  };

  if (!isMounted) return null;

  const buttonStyle = position.x !== null && position.y !== null
    ? { position: "fixed", left: `${position.x}px`, top: `${position.y}px` }
    : { position: "fixed", bottom: "24px", right: "24px" };

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDragStart={(e) => e.preventDefault()}
      aria-label="Toggle theme"
      className="fixed z-50 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 border-2 backdrop-blur-sm cursor-grab active:cursor-grabbing"
      style={{
        ...buttonStyle,
        backgroundColor: isDarkMode ? "#ffffff" : "#1a1a1a",
        borderColor: isDarkMode ? "#e5e7eb" : "#333333",
        boxShadow: isDarkMode 
          ? "0 8px 20px rgba(255, 255, 255, 0.15)" 
          : "0 8px 20px rgba(0, 0, 0, 0.2)"
      }}
    >
      {isDarkMode ? (
        <svg className="w-5 h-5" style={{ color: "#1a1a1a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" style={{ color: "#ffffff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
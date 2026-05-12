"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ColorPreset = 
  | "emerald" 
  | "blue" 
  | "rose" 
  | "indigo" 
  | "amber" 
  | "violet" 
  | "slate" 
  | "orange"
  | "crimson"
  | "cyan";

interface ColorContextType {
  preset: ColorPreset;
  setPreset: (preset: ColorPreset) => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<ColorPreset>("emerald");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedPreset = localStorage.getItem("rms-color-preset") as ColorPreset;
    if (savedPreset) {
      setPresetState(savedPreset);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Set data attribute on both root and body
    root.setAttribute("data-color-preset", preset);
    if (body) body.setAttribute("data-color-preset", preset);
    
    // Save to localStorage
    localStorage.setItem("rms-color-preset", preset);
  }, [preset, mounted]);

  const setPreset = (newPreset: ColorPreset) => {
    setPresetState(newPreset);
  };

  return (
    <ColorContext.Provider value={{ preset, setPreset }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColor() {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error("useColor must be used within a ColorProvider");
  }
  return context;
}

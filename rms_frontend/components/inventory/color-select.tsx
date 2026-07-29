"use client";

import { useState, useMemo } from "react";
import { Search, Check, Palette, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { COLORS, COLOR_FAMILIES } from "@/app/(main)/inventory/add-product/constants";

interface ColorSelectProps {
    value: string;
    valueHex?: string;
    onSelect: (colorName: string, colorHex: string) => void;
    availableColors?: string[];
    placeholder?: string;
    className?: string;
}

export function ColorSelect({
    value,
    valueHex,
    onSelect,
    availableColors,
    placeholder = "Select color...",
    className = "",
}: ColorSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFamily, setSelectedFamily] = useState<string>("All");
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customName, setCustomName] = useState("");
    const [customHex, setCustomHex] = useState("#3B82F6");

    // All available color names from dictionary
    const colorNames = useMemo(() => {
        if (availableColors && availableColors.length > 0) {
            return availableColors;
        }
        return Object.keys(COLORS);
    }, [availableColors]);

    // Current color hex
    const currentHex = useMemo(() => {
        if (valueHex) return valueHex;
        return (COLORS as Record<string, string>)[value] || "#000000";
    }, [value, valueHex]);

    // Filter colors based on family and search query
    const filteredColors = useMemo(() => {
        let list = colorNames;

        if (selectedFamily !== "All" && (COLOR_FAMILIES as Record<string, readonly string[]>)[selectedFamily]) {
            const familyList = (COLOR_FAMILIES as Record<string, readonly string[]>)[selectedFamily];
            list = list.filter((c) => familyList.includes(c));
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter((c) => c.toLowerCase().includes(query));
        }

        return list;
    }, [colorNames, selectedFamily, searchQuery]);

    const handleSelectColor = (name: string) => {
        const hex = (COLORS as Record<string, string>)[name] || "#000000";
        onSelect(name, hex);
        setOpen(false);
        setSearchQuery("");
    };

    const handleApplyCustomColor = () => {
        if (!customName.trim()) return;
        const formattedName = customName.trim();
        onSelect(formattedName, customHex);
        setOpen(false);
        setIsCustomMode(false);
        setCustomName("");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`w-full justify-between border-slate-200 hover:border-brand-primary/40 bg-white shadow-xs font-normal transition-all ${className}`}
                >
                    <span className="flex items-center gap-2.5 truncate">
                        <span
                            className="inline-block h-4 w-4 rounded-full border border-slate-300 shadow-xs shrink-0 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: currentHex }}
                        />
                        <span className="font-medium text-slate-800 truncate">
                            {value || placeholder}
                        </span>
                    </span>
                    <Badge variant="secondary" className="ml-2 text-[10px] font-semibold bg-slate-100 text-slate-600 border-none shrink-0">
                        {Object.keys(COLORS).length}+ Colors
                    </Badge>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0 shadow-xl border-slate-200 rounded-2xl overflow-hidden" align="start">
                <div className="p-3 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-brand-primary" />
                            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                                Color Library ({colorNames.length})
                            </span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCustomMode(!isCustomMode)}
                            className="h-7 text-xs font-semibold text-brand-primary hover:bg-brand-primary/10 px-2 rounded-lg"
                        >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {isCustomMode ? "Standard List" : "+ Custom Color"}
                        </Button>
                    </div>

                    {!isCustomMode && (
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Search 100+ colors (e.g. Navy, Mint, Crimson)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-8 text-xs bg-white border-slate-200 rounded-xl focus:border-brand-primary"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    {!isCustomMode && (
                        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                            {Object.keys(COLOR_FAMILIES).map((family) => (
                                <button
                                    key={family}
                                    type="button"
                                    onClick={() => setSelectedFamily(family)}
                                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                                        selectedFamily === family
                                            ? "bg-brand-primary text-white font-semibold shadow-xs"
                                            : "bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200/60"
                                    }`}
                                >
                                    {family}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {isCustomMode ? (
                    <div className="p-4 space-y-3 bg-white">
                        <div className="text-xs font-medium text-slate-600">
                            Create a unique brand color:
                        </div>
                        <div className="space-y-2">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400">Color Name</label>
                                <Input
                                    placeholder="e.g. Midnight Orchid, Sunset Orange"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    className="h-8 text-xs mt-1"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-1">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Color HEX</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="color"
                                            value={customHex}
                                            onChange={(e) => setCustomHex(e.target.value)}
                                            className="h-8 w-10 cursor-pointer rounded border border-slate-200 p-0"
                                        />
                                        <Input
                                            value={customHex}
                                            onChange={(e) => setCustomHex(e.target.value)}
                                            className="h-8 w-24 text-xs uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button
                            type="button"
                            onClick={handleApplyCustomColor}
                            disabled={!customName.trim()}
                            className="w-full h-8 text-xs bg-brand-primary hover:bg-emerald-900 text-white mt-2"
                        >
                            Apply Custom Color
                        </Button>
                    </div>
                ) : (
                    <div className="max-h-60 overflow-y-auto p-2 grid grid-cols-1 md:grid-cols-2 gap-1 bg-white">
                        {filteredColors.length === 0 ? (
                            <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                                No colors matching "{searchQuery}"
                            </div>
                        ) : (
                            filteredColors.map((colorName) => {
                                const hex = (COLORS as Record<string, string>)[colorName] || "#000000";
                                const isSelected = value.toLowerCase() === colorName.toLowerCase();
                                return (
                                    <button
                                        key={colorName}
                                        type="button"
                                        onClick={() => handleSelectColor(colorName)}
                                        className={`flex items-center justify-between p-2 rounded-xl text-xs text-left transition-all ${
                                            isSelected
                                                ? "bg-brand-primary/10 font-bold text-brand-primary border border-brand-primary/20"
                                                : "hover:bg-slate-50 text-slate-700"
                                        }`}
                                    >
                                        <span className="flex items-center gap-2.5 truncate min-w-0">
                                            <span
                                                className="h-4 w-4 rounded-full border border-slate-300/80 shadow-xs shrink-0"
                                                style={{ backgroundColor: hex }}
                                            />
                                            <span className="truncate">{colorName}</span>
                                        </span>
                                        {isSelected && <Check className="h-3.5 w-3.5 text-brand-primary shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

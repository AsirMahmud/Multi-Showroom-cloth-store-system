"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { categoriesApi, onlineCategoriesApi, productsApi, galleriesApi } from "@/lib/api/inventory";
import { supplierApi } from "@/lib/api/supplier";
import { Terminal, Play, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "error" | "warn";
  message: string;
}

export default function ImportScriptPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentStep, setCurrentStep] = useState("");

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, type, message }]);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Client-side image compression using canvas
  const compressImage = (imageBlob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(imageBlob);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement("canvas");
        const maxDim = 800; // max width or height
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageBlob);
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export canvas to JPEG blob with 0.8 quality
        canvas.toBlob(
          (compressedBlob) => {
            resolve(compressedBlob || imageBlob);
          },
          "image/jpeg",
          0.8
        );
      };
      img.onerror = () => {
        resolve(imageBlob);
      };
    });
  };

  const startImport = async () => {
    if (loading) return;
    setLoading(true);
    setProgress(0);
    setLogs([]);
    addLog("Initializing import process...", "info");

    try {
      // 1. Fetch Categories & setup Pakistani Three Piece category
      setCurrentStep("Setting up Category");
      addLog("Fetching existing categories...", "info");
      const categories = await categoriesApi.getAll();
      let category = categories.find(
        (c) => c.name.toLowerCase() === "pakistani three piece"
      );

      if (!category) {
        addLog("Category 'Pakistani Three Piece' not found. Creating it...", "warn");
        category = await categoriesApi.create({
          name: "Pakistani Three Piece",
          description: "Pakistani three-piece kameez, trousers, and dupatta sets.",
        });
        addLog(`Successfully created category with ID: ${category.id}`, "success");
      } else {
        addLog(`Using existing Category: ${category.name} (ID: ${category.id})`, "success");
      }

      // 2. Fetch Online Categories & setup Pakistani Three Piece
      setCurrentStep("Setting up Online Category");
      addLog("Fetching online categories...", "info");
      const onlineCats = await onlineCategoriesApi.getAll();
      let onlineCat = onlineCats.find(
        (c) => c.name.toLowerCase() === "pakistani three piece"
      );

      if (!onlineCat) {
        addLog("Online Category 'Pakistani Three Piece' not found. Creating it...", "warn");
        onlineCat = await onlineCategoriesApi.create({
          name: "Pakistani Three Piece",
          description: "Shop Pakistani three-piece collections.",
          gender: "FEMALE",
        });
        addLog(`Successfully created Online Category with ID: ${onlineCat.id}`, "success");
      } else {
        addLog(`Using existing Online Category: ${onlineCat.name} (ID: ${onlineCat.id})`, "success");
      }

      // 3. Fetch Suppliers & setup a supplier
      setCurrentStep("Setting up Supplier");
      addLog("Fetching suppliers...", "info");
      const suppliers = await supplierApi.getAll();
      let supplier = suppliers[0];

      if (!supplier) {
        addLog("No supplier found. Creating a default Pakistani dress supplier...", "warn");
        supplier = await supplierApi.create({
          company_name: "Pakistani Fashion Imports Ltd",
          contact_person: "Import Manager",
          email: "imports@pakistanifashion.com",
          phone: "01799998888",
          address: "Dhaka, Bangladesh",
          tax_number: null,
          website: null,
          payment_terms: null,
          is_active: true,
        });
        addLog(`Created Supplier: ${supplier.company_name} (ID: ${supplier.id})`, "success");
      } else {
        addLog(`Using Supplier: ${supplier.company_name} (ID: ${supplier.id})`, "success");
      }

      // 4. Define the 20 products
      const BRANDS = [
        "Khaadi", "Sapphire", "Maria.B", "Sana Safinaz", "Gul Ahmed", 
        "Zaha", "Elan", "Asim Jofa", "Agha Noor", "Baroque",
        "Nishat Linen", "Junaid Jamshed", "Alkaram Studio", "Cross Stitch", "Zara Shahjahan",
        "Charizma", "Rang Ja", "Ethnic", "Beechtree", "Limelight"
      ];

      const COLLECTIONS = [
        "Jasmine Lawn", "Classic Jacquard", "Luxe Cotton", "Royale Chiffon", "Flora Print", 
        "Velvet Bloom", "Organza Charm", "Karandi Breeze", "Cambric Gold", "Silk Grace",
        "Embroidered Organza", "Summer Lawn", "Winter Karandi", "Mystic Chiffon", "Linen Splendor",
        "Cotton Satin", "Festive Silk", "Royal Jacquard", "Modern Khaddar", "Spring Breeze"
      ];

      const colorsDef = [
        { color: "Emerald Green", colorHex: "#065F46", imgPath: "/emerald-noor.png" },
        { color: "Ivory Maroon", colorHex: "#7F1D1D", imgPath: "/maroon-meher.png" },
        { color: "Powder Blue", colorHex: "#93C5FD", imgPath: "/blue-sahar.png" },
        { color: "Pink", colorHex: "#FFC0CB", imgPath: "/pink-jasmine.png" }
      ];

      const designsDef = [
        { name: "Classic Cut Design", description: "Traditional cut and regular fitting specifications." },
        { name: "Contemporary Design", description: "Modern sleek cut tailored for premium styles." },
        { name: "Royal Festive Design", description: "Heavy neckline embroidery and sleeve border cuffs." },
        { name: "Casual Summer Design", description: "Lightweight, simple layout perfect for warm weather." }
      ];

      addLog("Starting creation of 20 products with 4 designs and 4 colors each...", "info");
      const uploadFailures: string[] = [];

      for (let i = 0; i < 20; i++) {
        const brand = BRANDS[i];
        const collection = COLLECTIONS[i];
        const name = `${brand} ${collection} Embroidered Three Piece`;
        const sku = `PK3-FRONTEND-${i + 1}`;
        const barcode = `880998877${i + 1}`;
        const costPrice = Math.round(2000 + i * 150);
        const retailPrice = Math.round(costPrice * 1.8);
        const wholesalePrice = Math.round(costPrice * 1.4);

        setCurrentStep(`Processing Product ${i + 1}/20: ${brand}`);

        // Self-healing check: delete duplicate SKU or Barcode if it exists
        try {
          addLog(`Checking if product with SKU ${sku} or barcode ${barcode} already exists...`, "info");
          
          let existingProduct = null;
          
          // Try search by SKU
          const searchResult = await productsApi.getAll({ search: sku });
          existingProduct = searchResult.results?.find(p => p.sku === sku);
          
          // If not found by SKU, search by barcode
          if (!existingProduct) {
            existingProduct = await productsApi.searchByBarcode(barcode);
          }

          if (existingProduct) {
            addLog(`Conflict found! Product ID: ${existingProduct.id} has matching SKU/Barcode. Deleting to start clean...`, "warn");
            await productsApi.delete(existingProduct.id);
            addLog(`Deleted existing conflicting product (ID: ${existingProduct.id})`, "success");
            await delay(500);
          }
        } catch (err: any) {
          addLog(`Error checking/deleting product with SKU ${sku}: ${err.message || err}`, "warn");
        }

        addLog(`Creating product ${name} (SKU: ${sku})...`, "info");

        // Format CreateProductDTO payload
        const productPayload = {
          name,
          description: `A stunning and luxurious ${name} collection. Crafting a timeless fashion statement using premium thread embroidery and dynamic print borders. Standard size dupatta and comfortable matching trouser pants.`,
          barcode,
          category: category.id,
          online_categories: [onlineCat.id],
          supplier: supplier.id,
          cost_price: costPrice,
          wholesale_price: wholesalePrice,
          retail_price: retailPrice,
          wholesale_cutoff: 10,
          minimum_stock: 5,
          is_active: true,
          gender: "FEMALE",
          designs: designsDef.map((design) => ({
            name: design.name,
            description: design.description,
            colors: colorsDef.map((c) => ({
              color: c.color,
              color_hax: c.colorHex,
              stock: 30, // 30 units per variant
            })),
          })),
          material_composition: [
            { percentige: 75, title: "Premium Lawn Cotton" },
            { percentige: 25, title: "Chiffon" }
          ],
          who_is_this_for: [
            { title: "Women", description: "Suited for special festive events, semi-formal occasions, or evening wear." }
          ],
          features: [
            { title: "Premium Three Piece Suit", description: "Complete shirt, trousers, and dupatta collection." },
            { title: "Intricate Embroidery", description: "High-density metallic and thread artwork." }
          ]
        };

        const createdProduct = await productsApi.create(productPayload);
        addLog(`Created Product: ${createdProduct.name} (ID: ${createdProduct.id})`, "success");

        // Now handle image uploads for each design and color
        const createdDesigns = createdProduct.designs || [];
        addLog(`Uploading color-specific images for ${createdDesigns.length} designs...`, "info");

        for (const design of createdDesigns) {
          addLog(`Uploading images for design: ${design.name}...`, "info");

          for (const colorInfo of colorsDef) {
            try {
              addLog(`Fetching image asset from ${colorInfo.imgPath} for ${colorInfo.color}...`, "info");
              const res = await fetch(colorInfo.imgPath);
              const blob = await res.blob();
              
              // Compress the image locally using Canvas before uploading
              addLog(`Compressing image to reduce file size...`, "info");
              const compressedBlob = await compressImage(blob);
              addLog(`Compressed image size: ${Math.round(compressedBlob.size / 1024)} KB (original was ${Math.round(blob.size / 1024)} KB)`, "success");

              const file = new File([compressedBlob], colorInfo.imgPath.substring(1), { type: "image/jpeg" });

              addLog(`Uploading image for ${design.name} / ${colorInfo.color}...`, "info");
              const formData = new FormData();
              formData.append("design_id", String(design.id));
              formData.append("color", colorInfo.color);
              formData.append("color_hax", colorInfo.colorHex);
              formData.append("alt_text", `${name} - ${design.name} - ${colorInfo.color}`);
              formData.append("images", file);
              formData.append("image_types", "PRIMARY");
              await galleriesApi.uploadColorImages(createdProduct.id, formData);

              addLog(`Uploaded image for Design: ${design.name} | Color: ${colorInfo.color}`, "success");
              await delay(200); // Prevent request hammering
            } catch (err: any) {
              uploadFailures.push(`${name}: ${design.name} / ${colorInfo.color}`);
              addLog(`Error uploading image for ${design.name} - ${colorInfo.color}: ${err.message || err}`, "error");
            }
          }
        }

        setProgress(Math.round(((i + 1) / 20) * 100));
        await delay(500);
      }

      if (uploadFailures.length > 0) {
        setCurrentStep("Completed with image errors");
        addLog(
          `Products were saved, but ${uploadFailures.length} image upload(s) failed: ${uploadFailures.join(", ")}`,
          "error"
        );
      } else {
        setCurrentStep("Completed");
        addLog("All 20 Pakistani three-piece products created and fully seeded!", "success");
      }
    } catch (error: any) {
      console.error(error);
      const errorData = error.response?.data;
      const errorMsg = errorData ? JSON.stringify(errorData) : (error.message || error);
      addLog(`Seeding failed: ${errorMsg}`, "error");
      setCurrentStep("Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] text-slate-100 p-8 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
      
      <Card className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl relative overflow-hidden z-10">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 via-indigo-500 to-emerald-500" />
        
        <CardHeader className="pb-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-emerald-400 animate-pulse" />
                Pakistani Catalog Importer (Optimized)
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Programmatic catalog import system running inside the authenticated client context.
              </CardDescription>
            </div>
            <div className="text-xs px-3 py-1 bg-slate-800 border border-slate-700 rounded-full font-mono text-slate-300">
              Session: Authenticated Admin
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Status</span>
              <span className="text-lg font-bold text-slate-200">{loading ? "Importing Data..." : progress === 100 ? "Import Completed" : "Idle"}</span>
            </div>
            
            {loading && (
              <div className="flex flex-col items-center sm:items-end">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Phase</span>
                <span className="text-sm font-mono text-emerald-400 font-bold">{currentStep}</span>
              </div>
            )}
            
            <Button
              onClick={startImport}
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-base px-8 py-6 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-950 mr-2" />
                  Seeding Catalog...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2 fill-current" />
                  Start Seeding 20 Products
                </>
              )}
            </Button>
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-slate-400">Import Progress</span>
              <span className="text-emerald-400">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3 bg-slate-950/60 overflow-hidden" />
          </div>

          {/* Logs Terminal */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
              <Terminal className="h-4 w-4" />
              Real-time Output Log
            </div>
            <div className="h-80 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic flex items-center justify-center h-full">
                  Click 'Start Seeding 10 Products' to begin the import process.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-600 flex-shrink-0">[{log.timestamp}]</span>
                    {log.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />}
                    {log.type === "error" && <AlertCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0 mt-0.5" />}
                    <span
                      className={
                        log.type === "success"
                          ? "text-emerald-400 font-semibold"
                          : log.type === "error"
                          ? "text-rose-400 font-semibold"
                          : log.type === "warn"
                          ? "text-yellow-400"
                          : "text-slate-300"
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

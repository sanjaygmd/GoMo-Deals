import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Wand2, Activity, CheckCircle2, Download } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { generateVirtualTryOn } from '../../services/aiService';

const VirtualTryOnModal = ({ isOpen, onClose, product, initialImage }) => {
  const { t } = useShop();
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");
  const [fitReport, setFitReport] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsGenerating(false);
      setFitReport(null);
      setGeneratedImage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const productImage = initialImage || 
    (product?.images && Array.isArray(product.images) && product.images[0]) || 
    (typeof product?.images === 'string' && product.images.startsWith('[') ? JSON.parse(product.images)[0] : product?.images) ||
    product?.thumbnail;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result);
        setGeneratedImage(null); // reset if they change photo
        setStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gomo-deals-tryon-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStep(3);
    setGenerationMessage("Initializing Replicate VTON AI...");
    setGeneratedImage(null);
    setFitReport(null);

    // Fun messages to show while waiting (since HF queue can take 1-5 minutes)
    const messages = [
      "Connecting to Hugging Face free AI space...",
      "Uploading images to AI model...",
      "Waiting in the public server queue...",
      "This can take 1 to 5 minutes on the free server...",
      "Analyzing body proportions...",
      "Mapping garment to 3D mesh...",
      "Rendering photorealistic textures...",
      "Please wait, almost there...",
      "Finalizing composite..."
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setGenerationMessage(messages[msgIdx]);
    }, 3000);

    try {
        const res = await generateVirtualTryOn(backgroundImage, productImage);
        if (res.success && res.imageUrl) {
            setGeneratedImage(res.imageUrl);
            setFitReport({
              status: "Perfect Fit Generated!",
              desc: "Here is your highly realistic, AI-generated Virtual Try-On.",
              color: "text-emerald-600",
              bgColor: "bg-emerald-50"
            });
        } else {
            setFitReport({
              status: "AI Generation Failed",
              desc: res.message || "The AI encountered an error processing these images.",
              color: "text-rose-600",
              bgColor: "bg-rose-50"
            });
            setStep(2); // let them try again
        }
    } catch (error) {
        setFitReport({
          status: "Connection Error",
          desc: "Could not reach the AI generation service.",
          color: "text-rose-600",
          bgColor: "bg-rose-50"
        });
        setStep(2);
    } finally {
        clearInterval(msgInterval);
        setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-orange-100 bg-white z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-955 flex items-center justify-center text-white">
              <Wand2 size={16} />
            </div>
            <h2 className="text-xl font-black text-orange-955 uppercase tracking-widest">Photorealistic VTON</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-orange-50 text-orange-900 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-full">
          
          {/* Controls Sidebar */}
          <div className="w-full md:w-80 bg-[#faf8f5] flex flex-col border-r border-orange-100 overflow-y-auto z-20 shrink-0">
            
            {/* Step 1: Photo */}
            <div className={`p-6 border-b border-orange-100 transition-opacity ${step >= 1 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] uppercase tracking-widest font-black text-orange-900">1. Customer Photo</p>
                {step > 1 && <CheckCircle2 size={16} className="text-emerald-500" />}
              </div>
              
              {!backgroundImage ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-orange-300 bg-white hover:bg-orange-50 hover:border-orange-400 cursor-pointer transition-all duration-300 rounded-xl group">
                  <Upload className="w-6 h-6 text-orange-300 group-hover:text-orange-500 mb-2 transition-colors" />
                  <p className="text-[10px] uppercase tracking-wider text-orange-600 font-bold text-center">Upload Photo</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="relative h-32 rounded-xl overflow-hidden border border-orange-200 group">
                  <img src={backgroundImage} alt="Uploaded" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer text-white text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                      <Upload size={14} /> Change Photo
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Action */}
            <div className={`p-6 border-b border-orange-100 transition-opacity ${step >= 2 && !isGenerating ? 'opacity-100' : 'opacity-40 pointer-events-none hidden md:block'}`}>
              <div className="flex items-center gap-2 mb-5">
                <p className="text-[11px] uppercase tracking-widest font-black text-orange-900">2. Replicate AI Model</p>
              </div>
              <p className="text-[10px] text-orange-600 mb-4 leading-relaxed font-medium">
                We are using the free public Hugging Face AI model (IDM-VTON). Because it is a free shared server, you may be placed in a queue. Generation typically takes <strong>1 to 5 minutes</strong>. Please be patient!
              </p>

              {step === 2 && !isGenerating && (
                <button 
                  onClick={handleGenerate}
                  className="w-full bg-orange-955 hover:bg-orange-600 text-white font-bold tracking-widest uppercase text-[10px] p-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-900/20"
                >
                  <Wand2 size={16} /> Generate Photorealistic Fit
                </button>
              )}
            </div>

            {/* Step 3: Analysis */}
            {fitReport && (
              <div className="p-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className={`p-4 rounded-xl border mb-6 ${fitReport.bgColor} border-current/20 ${fitReport.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} />
                    <span className="font-black uppercase tracking-widest text-[11px]">AI Generation Status</span>
                  </div>
                  <p className="font-bold text-lg mb-1">{fitReport.status}</p>
                  <p className="text-[11px] leading-relaxed opacity-90 mb-4">{fitReport.desc}</p>
                  
                  {generatedImage && (
                    <button 
                      onClick={handleDownload}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-widest uppercase text-[10px] p-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                    >
                      <Download size={14} /> Download Image
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-[#ebe8e4] relative flex items-center justify-center overflow-hidden" ref={containerRef}>
            
            {generatedImage ? (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
                <img 
                  src={generatedImage} 
                  alt="AI Generated Fit" 
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-xl animate-in fade-in duration-1000"
                />
              </div>
            ) : backgroundImage ? (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
                <img 
                  src={backgroundImage} 
                  alt="Background" 
                  className={`max-w-full max-h-full object-contain pointer-events-none shadow-sm transition-opacity duration-700 ${isGenerating ? 'opacity-30 blur-sm' : 'opacity-100'}`}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="text-center opacity-30">
                  <Upload size={64} className="mx-auto text-orange-900 mb-4" strokeWidth={1} />
                  <p className="text-orange-900 font-bold tracking-[0.3em] uppercase text-sm">Upload Photo To Begin</p>
                </div>
              </div>
            )}

            {/* AI Generation Loading Overlay */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#ebe8e4]/60 backdrop-blur-md"
                >
                  <div className="w-64 text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-955 rounded-full animate-spin" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-black text-orange-955 animate-pulse">
                      {generationMessage}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOnModal;

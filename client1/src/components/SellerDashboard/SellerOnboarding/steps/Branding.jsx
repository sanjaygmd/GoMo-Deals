import { useState } from "react";
import { UploadCloud, FileImage, Trash2 } from "lucide-react";
import { inputStyle, primaryBtn, secondaryBtn, cardStyle, labelStyle } from "../../../../utils/UIStyles";

const Branding = ({ next, back, data, setData }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    
    // Validate that it is an image file
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, SVG, etc.)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setData({ ...data, store_logo: e.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setData({ ...data, store_logo: "" });
  };

  return (
    <div className={cardStyle}>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-orange-900 mb-1">Store Branding</h2>
        <p className="text-sm text-orange-500">Customize how your store appears to customers</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className={labelStyle}>Store Logo</label>
          
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("logo-upload").click()}
            className={`mt-3 border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
              isDragActive 
                ? "border-orange-600 bg-orange-100/50 scale-[1.01]" 
                : data.store_logo 
                  ? "border-orange-200 bg-orange-50/20 hover:border-orange-400" 
                  : "border-orange-200 bg-orange-50/50 hover:border-orange-400 hover:bg-orange-50"
            }`}
          >
            <input 
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {data.store_logo ? (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-white rounded-2xl border border-orange-100 inline-block shadow-sm">
                  <img src={data.store_logo} alt="Store Preview" className="max-h-24 object-contain rounded-lg" />
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-[10px] text-orange-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                    <FileImage size={12} className="text-orange-500" /> Image Selected
                  </span>
                  <button 
                    type="button"
                    onClick={handleRemove}
                    className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-colors flex items-center justify-center"
                    title="Remove Logo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="p-4 bg-white rounded-full border border-orange-100 inline-block text-orange-500 shadow-sm transition-transform">
                  <UploadCloud size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs text-orange-900 font-bold">
                    Drag and drop your store logo, or <span className="text-orange-600 underline">browse</span>
                  </p>
                  <p className="text-[10px] text-orange-400 uppercase tracking-widest mt-1">
                    Supports PNG, JPG, JPEG, SVG (Max 5MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-orange-100">
        <button onClick={back} className={`${secondaryBtn} border-none`}>← Back</button>
        <button onClick={next} className={primaryBtn}>Continue →</button>
      </div>
    </div>
  );
};

export default Branding;
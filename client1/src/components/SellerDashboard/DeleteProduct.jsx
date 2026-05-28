import React, { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { ProductContext } from "../../context/ProductContext/ProductContext";
import { X, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const DeleteProduct = ({ product, onClose }) => {
  const { deleteProduct } = useContext(ProductContext);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteProduct(product.product_id || product.id, product.seller_id);
      if (res.success) {
        onClose();
      } else {
        alert(res.error || "Failed to delete product");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-orange-950/90 backdrop-blur-2xl flex items-center justify-center z-[9999] p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm shadow-[0_0_100px_rgba(0,0,0,0.5)] p-12 text-center relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-orange-400 hover:text-orange-950 transition-colors">
          <X size={20} strokeWidth={2} />
        </button>

        <div className="w-12 h-12 bg-orange-50 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={24} className="text-orange-900" strokeWidth={1.5} />
        </div>
        
        <h2 className="text-lg font-serif text-orange-900 tracking-tight mb-3">
          Remove Product
        </h2>

        <p className="text-[10px] text-orange-500 uppercase tracking-[0.2em] leading-relaxed mb-10 font-black">
          This will permanently remove <span className="text-orange-950 font-black">{product?.name}</span> from your collection. This action is irreversible.
        </p>

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleDelete}
            disabled={loading}
            className="w-full bg-orange-950 text-white text-[10px] font-bold uppercase tracking-[0.3em] py-4 hover:bg-orange-600 transition-all disabled:opacity-50"
          >
            {loading ? "Removing..." : "Confirm Removal"}
          </button>
          
           <button
            onClick={onClose}
            disabled={loading}
            className="w-full bg-orange-50 border-[0.5px] border-orange-200 text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] py-4 hover:bg-orange-100 transition-all"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.getElementById("modal-root")
  );
};

export default DeleteProduct;
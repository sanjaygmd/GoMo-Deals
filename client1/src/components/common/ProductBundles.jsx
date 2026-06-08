import React, { useState, useEffect } from 'react';
import { Package, Plus, ShoppingBag } from 'lucide-react';
import { getProductBundles } from '../../services/bundleService';
import { useShop } from '../../context/ShopContext';
import { useToast } from '../../context/ToastContext';

const ProductBundles = ({ productId }) => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useShop();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBundles = async () => {
      setLoading(true);
      const res = await getProductBundles(productId);
      if (res.success && res.data) {
        setBundles(res.data);
      }
      setLoading(false);
    };
    fetchBundles();
  }, [productId]);

  const handleAddBundleToCart = (bundle) => {
    // A bundle is added as individual items with a discount, or handled at checkout.
    // For simplicity, we add all items in the bundle to the cart.
    // A real implementation might require a bundle_id in the cart to track combo discounts.
    bundle.items.forEach(item => {
        addToCart({
            product_id: item.product_id,
            name: item.name,
            price: item.price * (1 - bundle.discount_percentage / 100),
            images: [item.thumbnail]
        }, 1, null);
    });
    
    toast({
        title: 'Bundle Added',
        description: `${bundle.title} added to your cart!`
    });
  };

  if (loading || bundles.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Package size={20} className="text-orange-600" />
        <h2 className="text-xl font-bold text-orange-955 uppercase tracking-widest">Combo Deals</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bundles.map((bundle) => {
          const originalTotal = bundle.items.reduce((sum, item) => sum + Number(item.price), 0);
          const discountedTotal = originalTotal * (1 - bundle.discount_percentage / 100);

          return (
            <div key={bundle.bundle_id} className="border border-orange-200 bg-orange-50/30 p-6 relative overflow-hidden group hover:border-orange-400 transition-colors">
              {/* Discount Badge */}
              <div className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] uppercase tracking-widest font-black px-4 py-1">
                Save {bundle.discount_percentage}%
              </div>

              <h3 className="text-lg font-bold text-orange-955 mb-2">{bundle.title}</h3>
              <p className="text-xs text-orange-900/60 mb-6 line-clamp-2">{bundle.description}</p>

              {/* Items display */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                {bundle.items.map((item, idx) => (
                  <React.Fragment key={item.product_id}>
                    <div className="w-16 h-16 shrink-0 border border-orange-200 bg-white relative group-hover:border-orange-400 transition-colors">
                        <img src={item.thumbnail || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover p-1" />
                    </div>
                    {idx < bundle.items.length - 1 && (
                      <Plus size={12} className="text-orange-300 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-end justify-between mt-auto">
                <div>
                  <span className="text-[10px] text-orange-400 line-through uppercase tracking-widest block mb-1">
                    ₹{originalTotal.toFixed(2)}
                  </span>
                  <span className="text-xl font-black text-orange-600">
                    ₹{discountedTotal.toFixed(2)}
                  </span>
                </div>
                
                <button
                  onClick={() => handleAddBundleToCart(bundle)}
                  className="bg-orange-955 text-white px-4 py-2 text-[10px] uppercase tracking-widest font-black hover:bg-orange-900 transition-colors flex items-center gap-2"
                >
                  <ShoppingBag size={14} /> Add Bundle
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductBundles;

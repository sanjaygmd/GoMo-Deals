import React, { createContext, useState, useCallback, useContext } from "react";
import * as productService from "../../services/productService";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async (sellerId = null) => {
    setLoading(true);
    const res = await productService.getProducts(sellerId);
    if (res.success) {
      setProducts(res.data);
    }
    setLoading(false);
  }, []);

  const addProduct = async (payload) => {
    const res = await productService.addProduct(payload);
    if (res.success && payload.seller_id) {
      await fetchProducts(payload.seller_id);
    }
    return res;
  };

  const updateProduct = async (id, data) => {
    const res = await productService.updateProduct(id, data);
    return res;
  };

  const updateVariant = async (id, data) => {
    const res = await productService.updateVariant(id, data);
    return res;
  };

  const deleteProduct = async (id, sellerId) => {
    const res = await productService.deleteProduct(id);
    if (res.success && sellerId) {
      await fetchProducts(sellerId);
    }
    return res;
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        fetchProducts,
        addProduct,
        updateProduct,
        updateVariant,
        deleteProduct,
        loading,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};

export default ProductContext;

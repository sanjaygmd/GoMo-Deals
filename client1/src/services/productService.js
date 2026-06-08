import { api } from "./api";
import { FLEA_MARKET_PRODUCTS } from "../data/fleaMarketProducts";
export const addProduct = async (productData) => {
    try {
        const res = await api.post('/products/add', productData);
        return res.data
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message }
    }
}

export const bulkUploadProducts = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/products/bulk-upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message }
    }
}

export const getSellerProducts = async () => {
    try {
        const res = await api.get('/products/allproducts');
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message }
    }
}

export const addVariants = async (variantData) => {
    try {
        const res = await api.post('/products/add-variants', variantData);
        return res.data
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message }
    }
}

export const getProducts = async (sellerId = null) => {
    try {
        const url = sellerId ? `/products/allproducts?seller_id=${sellerId}` : '/products/allproducts';
        const res = await api.get(url);
        if (res.data.success) {
            // Map the first image from pi_images to a 'thumbnail' property for easy access in UI
            let allProducts = res.data.data.map(product => {
                const baseImages = product.pi_images?.filter(img => !img.variant_id) || [];
                const thumbnail = baseImages[0]?.image_url || product.pi_images?.[0]?.image_url || product.images?.[0] || '/fallback-product.png';
                return {
                    ...product,
                    thumbnail
                };
            });
            res.data.data = allProducts;
        }
        return res.data
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message }
    }
}

export const getProductsBySeller = async (sellerId) => {
    return getProducts(sellerId);
}

export const getProductById = async (id) => {
    if (id && String(id).startsWith('fm')) {
        const product = FLEA_MARKET_PRODUCTS.find(p => String(p.id) === String(id));
        if (product) return { success: true, data: product };
    }
    
    if (id && String(id).startsWith('sp_')) {
        // Fallback for old references if needed, though they shouldn't exist
    }
    
    // If it has 'fm_' prefix but wasn't in mock data, it's a real product mapped to flea market
    const realId = String(id).startsWith('fm_') ? String(id).replace('fm_', '') : id;

    try {
        const res = await api.get(`/products/${realId}`);
        return res.data
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message }
    }
}

export const getProductBySlug = async (slug) => {
    try {
        const res = await api.get(`/products/slug/${slug}`);
        return res.data
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message }
    }
}

export const getCategories = async () => {
    try {
        const res = await api.get('/products/categories');
        return res.data
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message }
    }
}

export const updateVariant = async (id, variantData) => {
    try {
        const res = await api.put(`/products/variant/${id}`, variantData);
        return res.data
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message }
    }
}

export const updateProduct = async (id, productData) => {
    try {
        const res = await api.put(`/products/${id}`, productData);
        return res.data
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message }
    }
}

export const deleteProduct = async (id) => {
    try {
        const res = await api.delete(`/products/${id}`);
        return res.data
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message }
    }
}

export const getSubcategories = async (categoryId) => {
    try {
        const res = await api.get('/products/categories');
        if (res.data.success) {
            const subcategories = res.data.data.filter(cat => cat.parent_category_id && String(cat.parent_category_id) === String(categoryId));
            return { success: true, data: subcategories };
        }
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
}
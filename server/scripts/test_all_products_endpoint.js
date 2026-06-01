async function main() {
    try {
        const res = await fetch('http://localhost:3000/api/products/allproducts');
        const json = await res.json();
        if (json.success) {
            console.log("=== API PRODUCTS ===");
            console.log(json.data.map(p => ({
                product_id: p.product_id,
                name: p.name,
                category_name: p.category_name,
                category_id: p.category_id
            })).slice(0, 5));
        } else {
            console.log("API returned success: false");
        }
    } catch (err) {
        console.error(err);
    }
}
main();

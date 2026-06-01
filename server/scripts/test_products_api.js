async function main() {
    try {
        const res = await fetch('http://localhost:3000/api/products/allproducts');
        const json = await res.json();
        if (!json.success) {
            console.error("API returned failure:", json);
            return;
        }

        const vrHeadset = json.data.find(p => p.name.includes("vr headset"));
        if (!vrHeadset) {
            console.error("Meta quest - vr headset not found in API response!");
            return;
        }

        console.log("=== API RESPONSE FOR META QUEST VR HEADSET ===");
        console.log({
            name: vrHeadset.name,
            category_id: vrHeadset.category_id,
            category_name: vrHeadset.category_name,
            parent_category_id: vrHeadset.parent_category_id,
            parent_category_name: vrHeadset.parent_category_name
        });

        // Test filtering category logic in ProductGrid.jsx/CategoryPage.jsx
        const cat = 'electronics';
        const fieldContains = (field, search) => {
            if (!field || !search) return false;
            const cleanField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanSearch = search.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanField.includes(cleanSearch);
        };

        const matchCategory = fieldContains(vrHeadset.category_name, cat) || 
                            fieldContains(vrHeadset.parent_category_name, cat) || 
                            (vrHeadset.category_id?.toString() === cat) ||
                            (vrHeadset.parent_category_id?.toString() === cat);

        console.log("\n=== FILTER EVALUATION ===");
        console.log(`Filtering for parent category: '${cat}'`);
        console.log(`Product matches parent category: ${matchCategory}`);

    } catch (err) {
        console.error("Verification failed:", err);
    }
}
main();

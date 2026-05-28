import React, { useState, useEffect } from "react";

const ProductForm = ({ initialData, onSubmit, mode }) => {
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
  });

  useEffect(() => {
    if (initialData) {
    //   setForm(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Product Name"
        className="w-full border p-3 rounded-lg"
      />

      <input
        name="price"
        value={form.price}
        onChange={handleChange}
        placeholder="Price"
        className="w-full border p-3 rounded-lg"
      />

      <input
        name="stock"
        value={form.stock}
        onChange={handleChange}
        placeholder="Stock"
        className="w-full border p-3 rounded-lg"
      />

      <button className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700">
        {mode === "edit" ? "Update Product" : "Add Product"}
      </button>

    </form>
  );
};

export default ProductForm;
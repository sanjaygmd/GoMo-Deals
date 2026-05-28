import { useState } from "react";
import { inputStyle, labelStyle, primaryBtn, secondaryBtn, cardStyle } from "../../../../utils/UIStyles";

const Store = ({ next, back, data, setData }) => {
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!data.store_name) {
      return setError("Store name is required");
    }
    setError("");
    next();
  };

  return (
    <div className={cardStyle}>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-orange-900 mb-1">Store Setup</h2>
        <p className="text-sm text-orange-500">Provide a public name and description for your shop</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className={labelStyle}>Public Store Name</label>
          <input
            placeholder="Shop Name"
            value={data.store_name}
            onChange={(e) => setData({...data, store_name: e.target.value})}
            className={inputStyle}
          />
        </div>

        <div>
          <label className={labelStyle}>Store Description</label>
          <textarea
            placeholder="Tell customers about your store..."
            value={data.store_description}
            onChange={(e) => setData({ ...data, store_description: e.target.value })}
            className={`${inputStyle} min-h-[120px] py-4 resize-none`}
          />
        </div>

      </div>

      {error && <p className="text-rose-500 mt-4 px-2 text-xs font-bold uppercase tracking-wider">{error}</p>}

      <div className="flex justify-between mt-8 pt-6 border-t border-orange-100">
        <button onClick={back} className={`${secondaryBtn} border-none`}>← Back</button>
        <button onClick={handleNext} className={primaryBtn}>Continue →</button>
      </div>
    </div>
  );
};

export default Store;
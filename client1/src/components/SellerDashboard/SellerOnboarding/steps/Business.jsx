import { useState } from "react";
import { inputStyle, primaryBtn, secondaryBtn, cardStyle, labelStyle } from "../../../../utils/UIStyles";

const Business = ({ next, back, data, setData }) => {
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!data.store_name || !data.address_line_1 || !data.city || !data.state || !data.pincode || !data.country) {
      return setError("Fill all required business and address fields");
    }
    if (data.pincode.length < 5 || isNaN(data.pincode)) {
        return setError("Please enter a valid numeric pincode");
    }
    setError("");
    next();
  };

  return (
    <div className={cardStyle}>
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-orange-900 mb-1">Business Details</h2>
        <p className="text-sm text-orange-500">Provide your registered business address</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelStyle}>Registered Business Name</label>
          <input
            placeholder="Business Name"
            value={data.store_name}
            onChange={(e) => setData({ ...data, store_name: e.target.value })}
            className={inputStyle}
          />
        </div>

        <div>
          <label className={labelStyle}>Street Address</label>
          <input
            placeholder="Address"
            value={data.address_line_1}
            onChange={(e) => setData({ ...data, address_line_1: e.target.value })}
            className={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>City</label>
            <input
              placeholder="City"
              value={data.city}
              onChange={(e) => setData({ ...data, city: e.target.value })}
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>State</label>
            <input
              placeholder="State"
              value={data.state}
              onChange={(e) => setData({ ...data, state: e.target.value })}
              className={inputStyle}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Pincode</label>
            <input
              placeholder="Pincode"
              value={data.pincode}
              onChange={(e) => setData({ ...data, pincode: e.target.value })}
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>Country</label>
            <input
              placeholder="Country"
              value={data.country}
              onChange={(e) => setData({ ...data, country: e.target.value })}
              className={inputStyle}
            />
          </div>
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

export default Business;
import { useState } from "react";
import { inputStyle, labelStyle, primaryBtn, secondaryBtn, cardStyle } from "../../../../utils/UIStyles";

const Tax = ({ next, back, data, setData }) => {
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!data.pan || data.pan.length !== 10) {
      return setError("Valid 10-character PAN is required");
    }
    setError("");
    next();
  };

  return (
    <div className={cardStyle}>
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-orange-900 mb-1">Tax Details</h2>
        <p className="text-sm text-orange-500">Mandatory information for tax compliance</p>
      </div>

      <div className="bg-orange-50 text-orange-500 p-5 rounded-2xl mb-8 text-[11px] uppercase tracking-widest font-bold border border-orange-100">
        PAN is mandatory. GSTIN is optional.
      </div>

      <div className="space-y-6">
        <div>
          <label className={labelStyle}>PAN Number</label>
          <input
            placeholder="ABCDE1234F"
            value={data.pan}
            maxLength={10}
            onChange={(e) => setData({ ...data, pan: e.target.value.toUpperCase() })}
            className={inputStyle}
          />
        </div>

        <div>
          <label className={labelStyle}>GSTIN (Optional)</label>
          <input
            placeholder="22AAAAA0000A1Z5"
            value={data.gstin}
            maxLength={15}
            onChange={(e) => setData({ ...data, gstin: e.target.value.toUpperCase() })}
            className={inputStyle}
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

export default Tax;
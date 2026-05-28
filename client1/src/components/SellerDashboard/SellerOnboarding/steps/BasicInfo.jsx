import { useState } from "react";
import { inputStyle, primaryBtn, cardStyle, labelStyle } from "../../../../utils/UIStyles";

const BasicInfo = ({ next, data, setData }) => {
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!data.full_name || !data.email || !data.phone) {
      return setError("All fields required");
    }
    setError("");
    next();
  };

  return (
    <div className={cardStyle}>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-orange-900 mb-1">Basic Information</h2>
        <p className="text-sm text-orange-500">Let's start with your personal details</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className={labelStyle}>Full Name</label>
          <input
            placeholder="Enter your name"
            value={data.full_name}
            onChange={(e) => setData({ ...data, full_name: e.target.value })}
            className={inputStyle}
          />
        </div>

        <div>
          <label className={labelStyle}>Business Email</label>
          <input
            placeholder="name@company.com"
            value={data.email}
            readOnly
            className={`${inputStyle} bg-orange-50 cursor-not-allowed`}
          />
        </div>

        <div>
          <label className={labelStyle}>Contact Number</label>
          <input
            placeholder="10-digit phone number"
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
            className={inputStyle}
          />
        </div>
      </div>

      {error && <p className="text-rose-500 mt-4 px-2 text-xs font-bold uppercase tracking-wider">{error}</p>}

      <button onClick={handleNext} className={`${primaryBtn} w-full mt-8`}>
        Continue to Business Details
      </button>
    </div>
  );
};

export default BasicInfo;
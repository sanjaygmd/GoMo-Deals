import { useState } from "react";
import {
  inputStyle,
  labelStyle,
  primaryBtn,
  secondaryBtn,
  cardStyle,
} from "../../../../utils/UIStyles";

const Bank = ({ next, back, data, setData }) => {
  const [error, setError] = useState("");

  const handleNext = () => {
    if (
      !data.account_holder_name ||
      !data.account_number ||
      !data.confirm_account_number ||
      !data.ifsc_code ||
      !data.bank_name ||
      !data.account_type
    ) {
      return setError("All fields are required");
    }

    if (data.account_number !== data.confirm_account_number) {
      return setError("Account numbers do not match");
    }
    
    const accountRegex = /^\d{9,18}$/;
    if (!accountRegex.test(data.account_number)) {
      return setError("Valid Account Number is required (9-18 digits)");
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(data.ifsc_code)) {
      return setError("Valid 11-character IFSC code is required (e.g. SBIN0001234)");
    }

    setError("");
    next();
  };

  return (
    <div className={cardStyle}>
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-orange-900 mb-1">Bank Details</h2>
        <p className="text-sm text-orange-500">Required for secure payment disbursement</p>
      </div>

      <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
        <div>
          <label className={labelStyle}>Account Holder Name</label>
          <input
            placeholder="Name as per bank records"
            value={data.account_holder_name}
            onChange={(e) =>
              setData({ ...data, account_holder_name: e.target.value })
            }
            className={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Bank Name</label>
            <input
              placeholder="e.g. HDFC Bank"
              value={data.bank_name}
              onChange={(e) =>
                setData({ ...data, bank_name: e.target.value })
              }
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>IFSC Code</label>
            <input
              placeholder="HDFC0001234"
              value={data.ifsc_code}
              maxLength={11}
              onChange={(e) => setData({ ...data, ifsc_code: e.target.value.toUpperCase() })}
              className={inputStyle}
            />
          </div>
        </div>

        <div>
          <label className={labelStyle}>Account Number</label>
          <input
            placeholder="Enter account number"
            value={data.account_number}
            onChange={(e) =>
              setData({ ...data, account_number: e.target.value })
            }
            className={inputStyle}
          />
        </div>

        <div>
          <label className={labelStyle}>Confirm Account Number</label>
          <input
            placeholder="Re-enter account number"
            value={data.confirm_account_number}
            onChange={(e) =>
              setData({ ...data, confirm_account_number: e.target.value })
            }
            className={inputStyle}
          />
        </div>

        <div>
          <label className={labelStyle}>Account Type</label>
          <select 
            value={data.account_type}
            onChange={(e) => setData({ ...data, account_type: e.target.value })}
            className={inputStyle}
          >
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
          </select>
        </div>
      </div>

      {error && <p className="text-rose-500 mt-4 px-2 text-xs font-bold uppercase tracking-wider">{error}</p>}

      <div className="flex justify-between mt-8 pt-6 border-t border-orange-100">
        <button onClick={back} className={`${secondaryBtn} border-none`}>
          ← Back
        </button>
        <button onClick={handleNext} className={primaryBtn}>
          Continue →
        </button>
      </div>
    </div>
  );
};

export default Bank;
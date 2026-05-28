import { useState } from "react";
import { primaryBtn, secondaryBtn, cardStyle } from "../../../../utils/UIStyles";

const Agreements = ({ next, back }) => {
  const [checked, setChecked] = useState(false);

  return (
    <div className={cardStyle}>
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-orange-900 mb-1">Terms & Agreements</h2>
        <p className="text-sm text-orange-500">Please review our seller policies</p>
      </div>

      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 h-72 overflow-y-auto mb-6 text-sm text-orange-600 space-y-4 no-scrollbar">
        <h3 className="font-bold text-orange-900 text-base uppercase tracking-wider">Seller Terms and Conditions</h3>
        <p>
          Welcome to the GoMo Deals Seller Platform. By registering as a seller, you agree to comply with and be bound by the following terms and conditions. Please read them carefully before proceeding.
        </p>

        <h4 className="font-bold text-orange-800 mt-4 uppercase tracking-tighter">1. Account Security and Fraud Prevention</h4>
        <p>
          You are entirely responsible for maintaining the confidentiality of your account credentials. Any fraudulent activities, including but not limited to selling counterfeit products, misrepresenting items, manipulating reviews, or processing fake orders, will result in immediate suspension of your account and potential legal action.
        </p>

        <h4 className="font-bold text-orange-800 mt-4 uppercase tracking-tighter">2. Privacy Policy</h4>
        <p>
          We are committed to protecting your privacy. Any personal or business information collected during the onboarding process will be used exclusively for identity verification, tax compliance, and account management purposes. We do not sell your data to third parties.
        </p>

        <h4 className="font-bold text-orange-800 mt-4 uppercase tracking-tighter">3. Fees and Commissions</h4>
        <p>
          By selling on our platform, you agree to our standard fee structure, including platform commission rates and payment processing fees. Payouts will be processed and disbursed according to the schedule outlined in our Seller Payment Policy.
        </p>
      </div>

      <label className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl cursor-pointer hover:bg-orange-100 transition-all group">
        <div className="relative flex items-center justify-center">
            <input 
              type="checkbox" 
              className="w-5 h-5 cursor-pointer accent-black rounded-lg border-orange-300 focus:ring-0 transition-all"
              checked={checked}
              onChange={() => setChecked(!checked)} 
            />
        </div>
        <span className="text-[13px] text-orange-700 font-medium leading-tight">
            I have read, understood, and agree to the Seller Terms and Conditions
        </span>
      </label>

      <div className="flex justify-between mt-8 pt-6 border-t border-orange-100">
        <button onClick={back} className={`${secondaryBtn} border-none`}>← Back</button>
        <button
          disabled={!checked}
          onClick={next}
          className={`${primaryBtn} ${!checked ? "opacity-30 cursor-not-allowed" : ""}`}
        >
          Accept & Continue →
        </button>
      </div>
    </div>
  );
};

export default Agreements;
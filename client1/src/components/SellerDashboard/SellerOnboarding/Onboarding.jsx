import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';

import BasicInfo from "./steps/BasicInfo";
import Business from "./steps/Business";
import Branding from "./steps/Branding";
import Store from "./steps/Store";
import Tax from "./steps/Tax";
import Bank from "./steps/Bank";
import Agreements from "./steps/Agreements";
import KYCPage from "./steps/KYCPage";

import Sidebar from "./StepSidebar";

import { useAuth } from "../../../context/AuthContext";

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  
  const [step, setStep] = useState(0);

  const [data, setData] = useState({
    // Seller Info
    full_name: "",
    email: "",
    phone: "",
    store_name: "",
    store_logo: "",
    store_description: "",
    
    // Identity
    pan: "",
    gstin: "",
    aadhar: "",
    aadhar_name: "",
    
    // Address
    address_line_1: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    
    // Bank
    bank_name: "",
    account_number: "",
    account_holder_name: "",
    account_type: "Savings",
    ifsc_code: "",
    
    // UI Helpers
    confirm_account_number: "",
  });

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'seller') {
        navigate('/seller/login');
      } else if (user.onboarding_completed) {
        navigate('/seller-dashboard');
      }
    }
  }, [user, loading, navigate]);

  // Sync initial data from user context
  useEffect(() => {
    if (user && !data.full_name) {
      setData(prev => ({
        ...prev,
        full_name: user.full_name || user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        store_name: user.store_name || "",
      }));
    }
  }, [user]);

  const next = () => setStep((prev) => prev + 1);
  const back = () => setStep((prev) => prev - 1);

  if (loading || !user || user.role !== 'seller' || user.onboarding_completed) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-orange-50">
            <div className="animate-pulse text-orange-400 font-serif italic text-lg">
                Verifying session...
            </div>
        </div>
    );
  }

  const steps = [
    <BasicInfo next={next} data={data} setData={setData} />,
    <Business next={next} back={back} data={data} setData={setData} />,
    <Branding next={next} back={back} data={data} setData={setData} />,
    <Store next={next} back={back} data={data} setData={setData} />,
    <Tax next={next} back={back} data={data} setData={setData} />,
    <Bank next={next} back={back} data={data} setData={setData} />,
    <Agreements next={next} back={back} data={data} setData={setData} />,
    <KYCPage back={back} data={data} setData={setData} />,
  ];

  return (
    <div className="min-h-screen flex bg-orange-100">
      <Sidebar step={step} />
      <div className="flex-1 flex justify-center items-center p-4">
        {steps[step]}
      </div>
    </div>
  );
};

export default Onboarding;
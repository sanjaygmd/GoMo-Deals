import { useState } from "react";

import BasicInfo from "./steps/BasicInfo";
import Business from "./steps/Business";
import Store from "./steps/Store";
import Branding from "./steps/Branding";
import Bank from "./steps/Bank";
import Tax from "./steps/Tax";
import Agreements from "./steps/Agreements";
import KYC from "./steps/KYCPage";

const StepContent = () => {
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const steps = [
    <BasicInfo next={next} />,
    <Business next={next} back={back} />,
    <Store next={next} back={back} />,
    <Branding next={next} back={back} />,
    <Bank next={next} back={back} />,
    <Tax next={next} back={back} />,
    <Agreements next={next} back={back} />,
    <KYC back={back} />
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-100">
      {steps[step]}
    </div>
  );
};

export default StepContent;
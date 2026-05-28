const stepsList = [
  "Basic Info",
  "Business",
  "Branding",
  "Store Setup",
  "Tax Details",
  "Bank Details",
  "Agreements",
  "KYC",
];

const Sidebar = ({ step }) => {
  const progress = Math.round(((step + 1) / stepsList.length) * 100);

  return (
    <div className="w-80 bg-white shadow-lg p-6 hidden md:block">

      {/* Progress */}
      <div className="mb-8">
        <p className="text-sm text-orange-500">Setup Progress</p>
        <h2 className="text-2xl font-bold text-green-600">{progress}%</h2>

        <div className="w-full bg-orange-200 h-2 mt-3 rounded-full">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {stepsList.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all
              ${
                step === index
                  ? "bg-green-100 text-green-700 font-semibold"
                  : "text-orange-600"
              }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs
                ${
                  step > index
                    ? "bg-green-600"
                    : step === index
                    ? "bg-green-500"
                    : "bg-orange-400"
                }`}
            >
              {step > index ? "✓" : index + 1}
            </div>

            <p className="text-sm">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
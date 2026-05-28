import { useState, useEffect } from "react";
import { getCustomerAddresses, customerOnboarding } from "../../services/authService";
import { useAuth } from "../../context/AuthContext.jsx";
import { useShop } from "../../context/ShopContext";
import { User, Phone, Mail, MapPin, Building2, Hash } from "lucide-react";

const inputClass = "w-full h-12 px-4 bg-orange-50 border border-orange-100 rounded-sm text-sm text-orange-900 placeholder:text-orange-300 focus:outline-none focus:border-orange-900 transition-colors font-light";
const labelClass = "block text-[9px] uppercase tracking-[0.3em] font-black text-orange-500 mb-2";

const Field = ({ icon: Icon, label, name, value, onChange, placeholder, type = "text", colSpan = "", hasError = false }) => (
  <div className={colSpan}>
    <label className={labelClass}>{label}</label>
    <div className="relative">
      {Icon && <Icon size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${hasError ? 'text-red-300' : 'text-orange-300'}`} />}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${inputClass} ${Icon ? 'pl-10' : ''} ${hasError ? 'border-red-200 bg-red-50/10' : ''}`}
      />
    </div>
  </div>
);

const PersonalDetails = ({ onNext }) => {
  const { user } = useAuth();
  const { t } = useShop();
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    address: "", city: "", pincode: "", state: "",
  });

  useEffect(() => {
    if (user?.id) {
      setForm(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));

      getCustomerAddresses(user.id).then((res) => {
        if (res.success && res.data.length > 0) {
          const defaultAddr = res.data.find(a => a.is_default) || res.data[0];
          setForm(prev => ({
            ...prev,
            name: defaultAddr.full_name || prev.name,
            phone: defaultAddr.phone || prev.phone,
            address: defaultAddr.address_line_1 + (defaultAddr.address_line_2 ? `, ${defaultAddr.address_line_2}` : ""),
            city: defaultAddr.city,
            pincode: defaultAddr.pincode,
            state: defaultAddr.state,
          }));
        }
      }).catch(() => {});
    }
  }, [user]);

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setError(""); // Clear error on change
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.address || !form.city || !form.pincode || !form.state) {
      setError(t("Please ensure all delivery details are filled before proceeding."));
      return;
    }
    
    // Save address edits made during checkout to user profile in DB
    try {
      if (user?.id) {
        await customerOnboarding(user.id, {
          full_name: form.name,
          phone: form.phone,
          address_line_1: form.address,
          address_line_2: "",
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: "India"
        });
      }
    } catch (err) {
      console.error("Failed to dynamically save checkout address edits:", err);
    }

    onNext(form);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif italic text-orange-900 mb-2">{t("Delivery Details")}</h2>
        <p className="text-[10px] uppercase tracking-widest text-orange-400">{t("Where shall we send your order?")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Field icon={User} label={t("Full Name")} name="name" value={form.name} onChange={handleChange} placeholder={t("Your full name")} hasError={!form.name && !!error} />
        <Field icon={Phone} label={t("Phone Number")} name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" type="tel" hasError={!form.phone && !!error} />
        <Field icon={Mail} label={t("Email Address")} name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" type="email" colSpan="md:col-span-2" hasError={!form.email && !!error} />

        <div className="md:col-span-2">
          <label className={labelClass}><MapPin size={10} className="inline mr-1" />{t("Street Address")}</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder={t("House / Flat no., Street, Area")}
            rows={2}
            className={`w-full px-4 py-3 bg-orange-50 border rounded-sm text-sm text-orange-900 placeholder:text-orange-300 focus:outline-none transition-colors font-light resize-none ${!form.address && error ? 'border-red-200 bg-red-50/10' : 'border-orange-100 focus:border-orange-900'}`}
          />
        </div>

        <Field icon={Building2} label={t("City")} name="city" value={form.city} onChange={handleChange} placeholder={t("Mumbai")} hasError={!form.city && !!error} />
        <Field icon={Hash} label={t("Pincode")} name="pincode" value={form.pincode} onChange={handleChange} placeholder="400001" type="number" hasError={!form.pincode && !!error} />
        <Field icon={MapPin} label={t("State")} name="state" value={form.state} onChange={handleChange} placeholder={t("Maharashtra")} colSpan="md:col-span-2" hasError={!form.state && !!error} />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-1 duration-300">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 text-center">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="w-full h-14 bg-orange-955 text-white text-[11px] uppercase tracking-[0.4em] font-black rounded-sm hover:bg-orange-600 transition-all duration-500 flex items-center justify-center gap-3 shadow-xl shadow-orange-900/5 cursor-pointer"
      >
        {t("Continue to Payment")} →
      </button>
    </div>
  );
};

export default PersonalDetails;
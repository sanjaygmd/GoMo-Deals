import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { inputStyle, primaryBtn, secondaryBtn, cardStyle, labelStyle } from "../../../../utils/UIStyles";
import { api } from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";

const KYCPage = ({ back, data, setData }) => {
    const navigate = useNavigate();
    const { refreshUser, user } = useAuth();
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!data.aadhar || data.aadhar.length !== 12 || isNaN(data.aadhar)) {
            return setError("Valid 12-digit Aadhar number is required");
        }

        setSubmitting(true);
        setError("");

        try {
            // Match the backend route: /seller/onboarding/:id
            const sellerId = user?.seller_id || user?.id;
            const res = await api.post(`/seller/onboarding/${sellerId}`, data);

            if (res.data.success) {
                // Fetch the latest user data (with updated store_name, logo, etc.)
                await refreshUser();
                navigate("/seller-dashboard");
            } else {
                setError(res.data.message || "Onboarding failed");
            }
        } catch (err) {
            console.error("KYC SUBMIT ERROR:", err);
            setError(err.response?.data?.message || "Failed to submit onboarding data");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={cardStyle}>
            <div className="mb-6">
                <h2 className="text-2xl font-serif text-orange-900 mb-1">Identity Verification</h2>
                <p className="text-sm text-orange-500">Final step to secure your seller account</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className={labelStyle}>Aadhar Number</label>
                    <input
                        placeholder="1234 5678 9012"
                        value={data.aadhar}
                        maxLength={12}
                        onChange={(e) => setData({ ...data, aadhar: e.target.value })}
                        className={`${inputStyle} bg-white`}
                    />
                </div>

                <div className="p-4 bg-orange-50 border border-dashed border-orange-200 rounded-2xl text-center">
                    <p className="text-xs text-orange-500 mb-2 font-medium uppercase tracking-widest">Document Status</p>
                    <p className="text-sm text-orange-900 font-bold italic">Verification will be processed upon submission</p>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                    <p className="text-xs text-rose-600 font-medium">{error}</p>
                </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-orange-100">
                <button 
                    onClick={back} 
                    disabled={submitting}
                    className={`${secondaryBtn} border-none`}
                >
                    ← Back
                </button>
                <button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className={`${primaryBtn} min-w-[160px]`}
                >
                    {submitting ? "Finalizing..." : "Complete Setup"}
                </button>
            </div>
        </div>
    );
};

export default KYCPage;
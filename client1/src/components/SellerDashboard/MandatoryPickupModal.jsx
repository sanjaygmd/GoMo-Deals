import React, { useState } from 'react';
import { addPickupLocation } from '../../services/sellerService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MapPin, AlertCircle, Loader } from 'lucide-react';

const MandatoryPickupModal = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    location_name: '',
    contact_name: user?.full_name || '',
    contact_phone: user?.phone || '',
    address_line_1: '',
    city: '',
    state: '',
    pincode: '',
    is_default: true // Has to be true since it's the first one
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await addPickupLocation({
        ...formData,
        seller_id: user.id
      });

      if (res.success) {
        toast({ title: 'Success', description: 'Pickup location saved successfully.' });
        onComplete();
      } else {
        toast({ title: 'Error', description: res.message || 'Failed to save pickup location.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-orange-600 p-6 text-white text-center flex-shrink-0">
          <div className="flex justify-center mb-3">
            <div className="bg-white/20 p-3 rounded-full">
              <MapPin size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Mandatory Action Required</h2>
          <p className="text-orange-100 mt-2 text-sm max-w-md mx-auto">
            You must configure a default pickup location for your products before you can access the dashboard. This is required for Shiprocket reverse pickups and normal deliveries.
          </p>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar bg-gray-50 flex-1">
          <form id="pickup-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
              <AlertCircle size={20} className="shrink-0 text-blue-500" />
              <p>The address provided here will be synced with Shiprocket as your warehouse/pickup location. Please ensure accuracy.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Location Name (e.g., Main Warehouse)</label>
                <input
                  type="text"
                  name="location_name"
                  value={formData.location_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                  placeholder="Main Warehouse"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person Name</label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Phone (10 digits)</label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit phone number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address Line 1 (Must be 10+ chars)</label>
                <input
                  type="text"
                  name="address_line_1"
                  value={formData.address_line_1}
                  onChange={handleChange}
                  required
                  minLength={10}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                  placeholder="House No., Street Name, Landmark"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 bg-white border-t border-gray-200 flex-shrink-0">
          <button
            type="submit"
            form="pickup-form"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg font-bold shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              'Save Default Pickup Location'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MandatoryPickupModal;

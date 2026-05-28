import React, { useState, useEffect } from "react";
import { getSellerCustomers } from "../../services/sellerService";
import { 
  Users, 
  Search, 
  Mail, 
  ShoppingBag, 
  MoreHorizontal, 
  UserCheck, 
  ExternalLink,
  ChevronRight,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";

const SellerCustomers = () => {
  const { user } = useAuth();
  const sellerId = user?.seller_id || user?.id;
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!sellerId) return;

    const fetchCustomers = async () => {
      setLoading(true);
      const res = await getSellerCustomers(sellerId);
      if (res.success) {
        setCustomers(res.data);
      }
      setLoading(false);
    };

    fetchCustomers();
  }, [sellerId]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto animate-fadeIn">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-950 rounded-full animate-spin"></div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold">Identifying customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Users size={14} className="text-orange-500" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Customer Relationship</span>
          </div>
          <h1 className="text-4xl font-serif text-orange-950 tracking-tight">
            Client <span className="italic font-light">Directory</span>
          </h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em]">
            Managing {customers.length} total shoppers who trust your boutique.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 group-focus-within:text-orange-950 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH CLIENTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-6 py-3 bg-orange-50 border border-orange-100 text-[10px] uppercase tracking-widest outline-none focus:border-orange-950 focus:bg-white transition-all w-72 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-orange-950 p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-white">
               <UserCheck size={60} strokeWidth={1} />
            </div>
            <p className="text-[9px] text-orange-400 font-black uppercase tracking-[0.4em] mb-4">Total Audience</p>
            <h3 className="text-4xl font-serif text-white">{customers.length}</h3>
            <p className="text-[8px] text-orange-500 uppercase tracking-[0.2em] mt-6 font-black">Growth: +12% this month</p>
         </div>
         <div className="bg-white p-8 border border-orange-100 shadow-sm relative overflow-hidden group">
            <p className="text-[9px] text-orange-500 font-black uppercase tracking-[0.4em] mb-4">Active Shoppers</p>
            <h3 className="text-4xl font-serif text-orange-950">{customers.filter(c => c.orders > 0).length}</h3>
            <div className="mt-8 w-full bg-orange-50 h-px relative">
               <div className="bg-orange-950 h-full absolute left-0" style={{ width: '75%' }}></div>
            </div>
         </div>
         <div className="bg-white p-8 border border-orange-100 shadow-sm relative overflow-hidden group">
            <p className="text-[9px] text-orange-500 font-black uppercase tracking-[0.4em] mb-4">Repeat Clients</p>
            <h3 className="text-4xl font-serif text-orange-950">{customers.filter(c => c.orders > 1).length}</h3>
            <p className="text-[8px] text-orange-600 uppercase tracking-[0.2em] mt-6 font-black italic">Loyalty score: Excellent</p>
         </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-orange-50 text-[9px] text-orange-500 uppercase tracking-[0.4em] font-black border-b border-orange-100">
                <th className="px-10 py-6 font-black">Customer Name</th>
                <th className="px-10 py-6 font-black">Contact Information</th>
                <th className="px-10 py-6 text-center font-black">Total Orders</th>
                <th className="px-10 py-6 text-center font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              <AnimatePresence mode="popLayout">
                {filteredCustomers.length > 0 ? filteredCustomers.map((customer, idx) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-orange-50/50 transition-colors"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-900 flex items-center justify-center font-serif italic text-white text-lg">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-orange-950 uppercase tracking-wider group-hover:text-orange-600 transition-colors">
                             {customer.name}
                           </span>
                           <div className="flex items-center gap-1.5 mt-1">
                             <Shield size={10} className="text-orange-500" />
                             <span className="text-[7px] uppercase tracking-widest text-orange-500 font-bold italic">Verified Account</span>
                           </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2 group/email cursor-pointer">
                        <Mail size={12} className="text-orange-400 group-hover/email:text-orange-950 transition-colors" />
                        <span className="text-[10px] font-bold text-orange-600 group-hover/email:text-orange-950 transition-colors">{customer.email}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ShoppingBag size={12} className="text-orange-400" />
                        <span className="text-sm font-bold text-orange-950 tracking-tighter">{customer.orders}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className="px-4 py-1.5 text-[8px] font-black uppercase tracking-[0.4em] border border-orange-100 bg-orange-50 text-orange-600">
                        {customer.status || "Active"}
                      </span>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-10 py-32 text-center text-[10px] uppercase tracking-[0.6em] text-orange-400">
                      No client records found in directory
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerCustomers;
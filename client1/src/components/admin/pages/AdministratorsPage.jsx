import { useState, useEffect } from "react";
import { Users, Shield, Trash2, CheckCircle, XCircle, AlertCircle, Loader2, Key, Lock } from "lucide-react";
import { api } from "../../../services/api";
import { useToast } from "../../../hooks/use-toast";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "../../../lib/utils";
import ConfirmModal from '../../common/ConfirmModal';

export default function AdministratorsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMasterKeyModal, setShowMasterKeyModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [newPassword, setNewPassword] = useState("");
  const [newMasterKey, setNewMasterKey] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      navigate('/admin');
      return;
    }
    fetchAdmins();
  }, [user]);

  const fetchAdmins = async () => {
    try {
      const res = await api.get("/super-admin/administrators");
      if (res.data.success) {
        setAdmins(res.data.data);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch administrators" });
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (admin) => {
    setProcessingId(admin.id);
    try {
      const res = await api.patch(`/super-admin/administrator/${admin.id}/status`, { is_active: !admin.is_active });
      if (res.data.success) {
        toast({ title: "Success", description: res.data.message });
        setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, is_active: !a.is_active } : a));
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Operation failed" });
    } finally {
      setProcessingId(null);
    }
  };

  const deleteAdmin = async (id) => {
    setProcessingId(id);
    try {
      const res = await api.delete(`/super-admin/administrator/${id}`);
      if (res.data.success) {
        toast({ title: "Deleted", description: "Administrator account removed." });
        setAdmins(prev => prev.filter(a => a.id !== id));
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete administrator" });
    } finally {
      setProcessingId(null);
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters" });
      return;
    }

    setProcessingId(selectedAdmin.id);
    try {
      const res = await api.put(`/admin/change-password/${selectedAdmin.id}`, { newPassword });
      if (res.data.success) {
        toast({ title: "Reset Complete", description: "Password updated and secure email sent to administrator." });
        setShowPasswordModal(false);
        setNewPassword("");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to update password" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateMasterKey = async (e) => {
    e.preventDefault();
    if (!newMasterKey || newMasterKey.length < 8) {
      toast({ variant: "destructive", title: "Error", description: "Master Key must be at least 8 characters" });
      return;
    }

    setProcessingId('master');
    try {
      const res = await api.put("/super-admin/master-key", { newMasterKey });
      if (res.data.success) {
        toast({ title: "Security Updated", description: "Platform Master Key has been rotated." });
        setShowMasterKeyModal(false);
        setNewMasterKey("");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update Master Key" });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 border border-orange-100 rounded-full" />
          <div className="absolute inset-0 border border-orange-955 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">Loading Authority List...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      
      {/* Elegant Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Shield size={14} className="text-orange-600" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Super Admin Controls</span>
          </div>
          <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">Administrators</h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
            Manage platform administrative authorities, system roles, and platform credentials.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowMasterKeyModal(true)}
            className="px-8 py-3 bg-orange-955 text-white hover:bg-orange-850 text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-3 shadow-xl cursor-pointer active:scale-98"
          >
            <Lock size={14} className="text-orange-400" /> Master Key
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-sm transition-transform group-hover:rotate-6">
                <Shield size={20} className="text-orange-500" />
              </div>
              <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border shadow-sm",
                admin.is_active ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-rose-200 bg-rose-50 text-rose-700'
              )}>
                {admin.is_active ? 'Operational' : 'Restricted'}
              </div>
            </div>

            <h3 className="text-lg font-bold text-orange-955 truncate uppercase tracking-wide">{admin.name}</h3>
            <p className="text-stone-500 text-xs font-bold mb-6 truncate">{admin.email}</p>

            <div className="space-y-3 mb-8 border-t border-orange-100 pt-5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
                <span>Authority Level</span>
                <span className="text-orange-955 font-bold">{admin.role}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
                <span>Deployment Date</span>
                <span className="text-orange-955 font-bold">{new Date(admin.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
                <span>Last Interaction</span>
                <span className="text-orange-955 font-bold">{admin.last_login_at ? new Date(admin.last_login_at).toLocaleDateString() : 'Initial'}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-auto">
              <button 
                onClick={() => toggleStatus(admin)}
                disabled={processingId === admin.id}
                className={cn("flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer shadow-sm active:scale-98",
                  admin.is_active 
                    ? 'border-orange-200 bg-orange-55 text-orange-700 hover:bg-orange-955 hover:text-white hover:border-orange-955' 
                    : 'border-orange-955 bg-orange-955 text-white hover:bg-orange-850'
                )}
              >
                {processingId === admin.id ? <Loader2 size={12} className="animate-spin" /> : (admin.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />)}
                {admin.is_active ? 'Restrict' : 'Activate'}
              </button>

              <button 
                onClick={() => {
                  setSelectedAdmin(admin);
                  setShowPasswordModal(true);
                }}
                className="w-11 h-11 rounded-xl bg-orange-50 hover:bg-orange-955 hover:text-white border border-orange-150 text-orange-600 shadow-sm transition-all cursor-pointer active:scale-95 flex items-center justify-center group/btn"
                title="Reset Password"
              >
                <Key size={16} className="group-hover/btn:rotate-12 transition-transform" />
              </button>
              
              <button 
                onClick={() => setConfirmModal({ isOpen: true, id: admin.id })}
                disabled={processingId === admin.id}
                className="w-11 h-11 rounded-xl bg-orange-50 hover:bg-rose-600 hover:text-white border border-orange-150 hover:border-rose-300 text-orange-600 shadow-sm transition-all cursor-pointer active:scale-95 flex items-center justify-center group/btn"
                title="Delete Admin"
              >
                {processingId === admin.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={16} className="group-hover/btn:scale-105 transition-transform" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-orange-955/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-orange-100 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-extrabold text-orange-955 tracking-tight mb-2 uppercase">Update Credentials</h3>
            <p className="text-stone-500 text-xs mb-6 font-bold leading-relaxed">Securing access parameters for <span className="text-orange-955 font-black">{selectedAdmin?.name}</span></p>
            
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">New Authority Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full h-12 bg-orange-55/30 border border-orange-200 rounded-xl px-4 font-bold text-sm text-orange-955 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] transition-all"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 h-12 rounded-xl bg-white border border-orange-200 text-orange-700 font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={processingId === selectedAdmin?.id}
                  className="flex-1 h-12 rounded-xl bg-orange-955 text-white font-black text-[10px] uppercase tracking-widest hover:bg-orange-850 transition-all cursor-pointer shadow-md"
                >
                  {processingId === selectedAdmin?.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Verify Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Master Key Rotation Modal */}
      {showMasterKeyModal && (
        <div className="fixed inset-0 bg-orange-955/40 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-orange-100 animate-in zoom-in-95 duration-300">
            <div className="h-14 w-14 rounded-2xl bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center mb-6 shadow-sm">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-extrabold text-orange-955 tracking-tight mb-2 uppercase">Security Master Key</h3>
            <p className="text-stone-500 text-xs mb-6 font-bold leading-relaxed">Rotate the secret authority token required for new administrative registrations.</p>
            
            <form onSubmit={handleUpdateMasterKey} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">New Registration Key</label>
                <input 
                  type="text" 
                  value={newMasterKey}
                  onChange={(e) => setNewMasterKey(e.target.value)}
                  placeholder="Min 8 characters recommended"
                  className="w-full h-12 bg-orange-55/30 border border-orange-200 rounded-xl px-4 font-bold text-sm text-orange-955 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] transition-all"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowMasterKeyModal(false)}
                  className="flex-1 h-12 rounded-xl bg-white border border-orange-200 text-orange-700 font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  disabled={processingId === 'master'}
                  className="flex-[1.5] h-12 rounded-xl bg-orange-955 text-white font-black text-[10px] uppercase tracking-widest hover:bg-orange-850 transition-all cursor-pointer shadow-md"
                >
                  {processingId === 'master' ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Rotate Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {admins.length === 0 && (
        <div className="bg-white border border-orange-100 rounded-3xl p-16 flex flex-col items-center text-center shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 mb-4 shadow-sm">
            <Users size={24} />
          </div>
          <h3 className="text-sm font-bold text-orange-955">No Administrators Found</h3>
          <p className="text-xs text-stone-500 font-bold mt-1">There are currently no regular administrators setup in the system.</p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={() => deleteAdmin(confirmModal.id)}
        title="Delete Administrator"
        message="Are you sure you want to delete this administrator permanently? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

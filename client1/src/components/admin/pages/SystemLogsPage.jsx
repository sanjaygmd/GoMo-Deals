import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Shield, Search, Clock, User, Globe, Laptop, ChevronDown, ChevronUp, History, Info } from "lucide-react";
import { cn } from "../../../lib/utils";

export default function SystemLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedLog, setExpandedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/admin/audit-logs');
            if (res.data.success) {
                setLogs(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        if (action.includes('LOGIN')) return "bg-orange-50 text-orange-600 border-orange-100";
        if (action.includes('CREATE')) return "bg-orange-50 text-orange-600 border-orange-100";
        if (action.includes('UPDATE')) return "bg-orange-50 text-orange-600 border-orange-100";
        if (action.includes('DELETE')) return "bg-rose-50 text-rose-600 border-rose-100";
        return "bg-orange-50 text-orange-600 border-orange-100";
    };

    const filteredLogs = logs.filter(log => 
        log.actor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.table_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatData = (data) => {
        if (!data) return "None";
        if (typeof data === 'object') return JSON.stringify(data, null, 2);
        try {
            return JSON.stringify(JSON.parse(data), null, 2);
        } catch (e) {
            return String(data);
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Elegant Welcome Banner */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Shield size={14} className="text-orange-600" />
                        <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Platform Security Audit</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">System Audit Logs</h1>
                    <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
                        Comprehensive immutable history of all administrative actions, data edits, and security events.
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={16} />
                    <input 
                        type="text"
                        placeholder="Search by name, action, or table..."
                        className="w-full md:w-80 pl-11 pr-4 h-11 border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-[10px] font-bold uppercase tracking-wider focus:outline-none placeholder:text-stone-400 transition-all rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] focus:bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Logs List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-orange-100 shadow-sm">
                        <div className="h-10 w-10 border-2 border-orange-100 border-t-orange-955 rounded-full animate-spin mb-4" />
                        <p className="text-orange-500 font-black uppercase tracking-widest text-[9px]">Synchronizing Audit Trail...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-orange-100 shadow-sm text-center">
                        <div className="h-16 w-16 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center text-orange-300 mb-4">
                            <History size={28} />
                        </div>
                        <p className="text-orange-955 font-black text-lg mb-1 uppercase tracking-tight">No audit entries</p>
                        <p className="text-stone-500 font-bold text-xs max-w-xs uppercase">No matches found for your search filters.</p>
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div 
                            key={log.audit_id}
                            className={cn(
                                "bg-white rounded-3xl border border-orange-100 shadow-sm transition-all overflow-hidden",
                                expandedLog === log.audit_id ? "ring-2 ring-orange-200 shadow-md" : "hover:border-orange-200"
                            )}
                        >
                            <div 
                                className="p-6 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                                onClick={() => setExpandedLog(expandedLog === log.audit_id ? null : log.audit_id)}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-700 border-orange-150"
                                    )}>
                                        {log.action}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-black text-orange-955">{log.actor_name || "Unknown User"}</span>
                                            <span className="text-orange-400 font-bold">•</span>
                                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-100">{log.table_name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[9px] font-black text-stone-400 uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5"><Clock size={11} className="text-stone-450" /> {new Date(log.created_at).toLocaleString()}</div>
                                            <div className="flex items-center gap-1.5"><Globe size={11} className="text-stone-450" /> {log.ip_address}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {expandedLog === log.audit_id ? <ChevronUp size={18} className="text-orange-600" /> : <ChevronDown size={18} className="text-orange-600" />}
                                </div>
                            </div>

                            {expandedLog === log.audit_id && (
                                <div className="px-6 pb-6 pt-2 border-t border-orange-50 animate-in slide-in-from-top-4 duration-350">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-orange-55/20 border border-orange-100 rounded-2xl p-4">
                                            <h4 className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <User size={12} /> Actor Context
                                            </h4>
                                            <p className="text-[11px] font-bold text-stone-500 mb-1">Authorization Type: <span className="text-orange-955 uppercase font-extrabold">{log.admin_id ? 'Administrator' : 'Merchant partner'}</span></p>
                                            <p className="text-[11px] font-bold text-stone-500">Security Email: <span className="text-orange-955 font-extrabold">{log.actor_email}</span></p>
                                        </div>
                                        <div className="bg-orange-55/20 border border-orange-100 rounded-2xl p-4">
                                            <h4 className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Laptop size={12} /> Hardware Signature
                                            </h4>
                                            <p className="text-[10px] font-bold text-stone-500 leading-relaxed truncate" title={log.user_agent}>
                                                {log.user_agent}
                                            </p>
                                        </div>
                                    </div>

                                    {(log.old_values || log.new_values) && (
                                        <div className="space-y-4">
                                            <h4 className="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                                <Info size={12} /> Data Ledger Changes
                                            </h4>
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">Previous State (Before)</span>
                                                    <pre className="bg-orange-55/20 text-orange-955 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-orange-100 shadow-inner max-h-60 custom-scrollbar">
                                                        {formatData(log.old_values)}
                                                    </pre>
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">Proposed State (After)</span>
                                                    <pre className="bg-orange-55/40 text-orange-955 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-orange-200 shadow-inner max-h-60 custom-scrollbar">
                                                        {formatData(log.new_values)}
                                                    </pre>
                                                </div>
                                             </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

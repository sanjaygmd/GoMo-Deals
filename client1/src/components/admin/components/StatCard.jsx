import { cn } from "../../../lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

export function StatCard({ title, value, todayValue, change, changeType = "neutral", icon: Icon, iconColor }) {
  return (
    <div className="group p-8 bg-white border border-orange-100 hover:border-orange-950 transition-all duration-500 shadow-sm hover:shadow-2xl relative overflow-hidden">
      {/* Corner background accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-orange-100 transition-colors duration-500"></div>
      
      <div className="flex justify-between items-start mb-10 relative">
        <div className="p-3 bg-orange-50 text-orange-400 group-hover:bg-orange-950 group-hover:text-white transition-all duration-500">
          <Icon className="h-5 w-5 shrink-0" />
        </div>
        
        {change && (
          <div className="flex items-center gap-1.5 ml-auto">
            <p
              className={cn(
                "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-none border transition-all duration-500",
                changeType === "positive" && "bg-orange-50 border-orange-200 text-orange-600 group-hover:bg-orange-950 group-hover:border-orange-950 group-hover:text-white",
                changeType === "negative" && "bg-rose-50 border-rose-200 text-rose-600 group-hover:bg-rose-600 group-hover:border-rose-600 group-hover:text-white",
                changeType === "neutral" && "bg-orange-50 border-orange-200 text-orange-400 group-hover:bg-orange-950 group-hover:border-orange-950 group-hover:text-white"
              )}
            >
              <span className="flex items-center gap-1">
                {changeType === "positive" ? <ArrowUp className="h-2.5 w-2.5 stroke-[3px]" /> : changeType === "negative" ? <ArrowDown className="h-2.5 w-2.5 stroke-[3px]" /> : null}
                {change}
              </span>
            </p>
          </div>
        )}
      </div>
      
      <div className="relative">
        <p className="text-[9px] uppercase tracking-[0.4em] text-orange-500 font-bold mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-orange-955 mb-4">{value}</h3>
        {todayValue !== undefined ? (
          <p className="text-[8px] uppercase tracking-widest text-orange-400 font-black">+{todayValue} Today</p>
        ) : (
          <p className="text-[8px] uppercase tracking-widest text-orange-400 font-black">Live performance</p>
        )}
      </div>
    </div>
  );
}


import { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { MessageCircle, Clock, CheckCircle2, AlertCircle, Send, Search } from "lucide-react";

const tickets = [
  { id: "TKT-501", subject: "Seller payout delay — TechZone Electronics", priority: "High", status: "Open", time: "2 hrs ago" },
  { id: "TKT-502", subject: "Product listing rejected without reason", priority: "Medium", status: "In Progress", time: "5 hrs ago" },
  { id: "TKT-503", subject: "Customer refund not processed — Order #78321", priority: "High", status: "Open", time: "1 day ago" },
  { id: "TKT-504", subject: "Unable to update bank details — FashionHub", priority: "Low", status: "Resolved", time: "2 days ago" },
  { id: "TKT-505", subject: "Delivery partner issue — wrong address mapping", priority: "Medium", status: "In Progress", time: "3 days ago" },
];

const priorityStyle = { High: "badge-danger", Medium: "badge-warning", Low: "badge-neutral" };
const statusIcon = { Open: AlertCircle, "In Progress": Clock, Resolved: CheckCircle2 };

export default function SupportPage() {
  const [search, setSearch] = useState("");
  const filteredTickets = tickets.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Support</h1>
        <p className="page-subtitle">Manage support tickets and issue tracking</p>
      </div>
      <div className="grid gap-4 grid-cols-3 mb-5">
        {[
          { label: "Open", value: "14", icon: AlertCircle, cls: "text-destructive" },
          { label: "In Progress", value: "8", icon: Clock, cls: "text-warning" },
          { label: "Resolved Today", value: "22", icon: CheckCircle2, cls: "text-success" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card flex items-center gap-3">
              <div className="rounded-lg bg-secondary p-2">
                <Icon className={`h-5 w-5 ${s.cls}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-card-foreground">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="chart-title mb-3">Recent Tickets</h3>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                className="pl-9 bg-secondary border-none text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="divide-y">
            {filteredTickets.map((t) => {
              const Icon = statusIcon[t.status] || AlertCircle;
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors cursor-pointer">
                  <Icon className={`h-4 w-4 shrink-0 ${t.status === "Open" ? "text-destructive" : t.status === "In Progress" ? "text-warning" : "text-success"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground">{t.id}</span><span className={priorityStyle[t.priority]}>{t.priority}</span></div>
                    <p className="text-xs font-medium text-card-foreground truncate">{t.subject}</p>
                    <p className="text-[10px] text-muted-foreground">{t.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><MessageCircle className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-card-foreground">Quick Reply</h3></div>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-card-foreground block mb-1">Ticket ID</label><Input placeholder="e.g. TKT-501" className="bg-secondary border-none text-sm" /></div>
            <div><label className="text-xs font-medium text-card-foreground block mb-1">Message</label><Textarea placeholder="Type your reply..." className="bg-secondary border-none min-h-[100px] resize-none text-sm" /></div>
            <Button className="w-full" size="sm"><Send className="h-3.5 w-3.5 mr-1.5" />Send Reply</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

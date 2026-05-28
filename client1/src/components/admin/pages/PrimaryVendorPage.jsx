import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import {
  Search, Store, UserCheck, ShieldCheck, Clock,
  Star, Mail, Phone, MapPin, FileText, CheckCircle2, XCircle,
  AlertTriangle, Ban, Eye, Edit, MoreVertical
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Primary Vendor Data
const primaryVendor = {
  id: 1,
  name: "TechZone Electronics",
  owner: "Rajesh Mehta",
  email: "rajesh@techzone.com",
  phone: "+91 98765-43210",
  location: "Mumbai, MH",
  gst: "27AABCT1234F1Z5",
  pan: "AABCT1234F",
  bank: "Verified",
  products: 480,
  orders: 12400,
  revenue: "₹1.24Cr",
  rating: 4.7,
  onTime: 96,
  joinDate: "Jan 2024",
  status: "Active",
  businessRegistration: "Business Registration Document",
  businessAddress: "Plot 45, Tech Park, Bandra Kurla Complex, Mumbai 400051",
  bankAccountName: "GoMo Deals Solutions Pvt Ltd",
  bankAccountNumber: "****1234",
  ifscCode: "HDFC0000001",
  documents: {
    businessLicense: "Verified",
    gstCertificate: "Verified",
    panCard: "Verified",
    bankVerification: "Verified",
    ownerIdProof: "Verified",
  }
};

const performanceData = [
  { month: "Jan", orders: 850, revenue: 42500 },
  { month: "Feb", orders: 920, revenue: 46000 },
  { month: "Mar", orders: 1100, revenue: 55000 },
  { month: "Apr", orders: 1250, revenue: 62500 },
];

export default function PrimaryVendorPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Primary Vendor</h1>
          <p className="page-subtitle">Manage your single vendor account, KYC verification, and store details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" />Edit Details</Button>
          <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Primary Vendor Profile Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-card-foreground">{primaryVendor.name}</h2>
                <p className="text-sm text-muted-foreground">Vendor ID: #VND001</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block rounded-lg bg-success/10 px-3 py-1 text-sm font-semibold text-success">
              ✓ Active
            </div>
          </div>
        </div>

        {/* Contact & Location Info */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Contact Information</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Owner:</strong> {primaryVendor.owner}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Email:</strong> {primaryVendor.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Phone:</strong> {primaryVendor.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Location:</strong> {primaryVendor.location}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Business Details</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span><strong>GST:</strong> {primaryVendor.gst}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span><strong>PAN:</strong> {primaryVendor.pan}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Joined:</strong> {primaryVendor.joinDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning fill-warning shrink-0" />
                <span><strong>Rating:</strong> {primaryVendor.rating} / 5.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-4 grid-cols-4 pt-6 border-t mt-6">
          {[
            { label: "Active Products", value: primaryVendor.products },
            { label: "Total Orders",    value: primaryVendor.orders.toLocaleString() },
            { label: "On-Time Delivery",value: `${primaryVendor.onTime}%` },
            { label: "Total Revenue",   value: primaryVendor.revenue },
          ].map((m) => (
            <div key={m.label} className="text-center group hover:bg-secondary/20 p-2 rounded-xl transition-all">
              <p className="text-xl font-bold text-card-foreground">{m.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KYC & Verification Status */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            KYC Verification Status
          </h3>
          <div className="space-y-2">
            {Object.entries(primaryVendor.documents).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm text-card-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-xs font-medium text-success">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Bank Account Details
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Account Name</p>
              <p className="text-sm font-medium text-card-foreground">{primaryVendor.bankAccountName}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                <p className="text-sm font-medium text-card-foreground">{primaryVendor.bankAccountNumber}</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">IFSC Code</p>
                <p className="text-sm font-medium text-card-foreground">{primaryVendor.ifscCode}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full text-xs h-8">Update Bank Details</Button>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="chart-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="chart-title">Performance Trend</h3>
            <p className="chart-subtitle">Orders and revenue over the last 4 months</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-info" /> Orders</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Revenue</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={performanceData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="orders" name="Orders" fill="hsl(210, 92%, 55%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="revenue" name="Revenue ($)" fill="hsl(25, 95%, 53%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vendor Management Workflows */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">KYC & Verification</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "Document Review", desc: "Review business documents", icon: FileText, path: "/sellers/document-review" },
              { label: "GST / PAN Verification", desc: "Validate tax registration", icon: ShieldCheck, path: "/sellers/gst-pan-verification" },
              { label: "Bank Account Check", desc: "Verify bank details", icon: CheckCircle2, path: "/sellers/bank-account-check" },
            ].map((item) => (
              <div key={item.label} onClick={() => navigate(item.path)} className="flex items-start gap-2.5 rounded-lg bg-secondary/50 p-3 cursor-pointer hover:bg-secondary/80 transition-colors">
                <item.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-card-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-4 w-4 text-success" />
            <h3 className="text-sm font-semibold text-card-foreground">Vendor Status</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "View Store Details", desc: "Access vendor store info", icon: Store, path: "/sellers/approve" },
              { label: "Manage Products", desc: "View and manage vendor products", icon: FileText, path: "/sellers/request-docs" },
              { label: "Contact Vendor", desc: "Send notifications to vendor", icon: Mail, path: "/sellers/notify" },
            ].map((item) => (
              <div key={item.label} onClick={() => navigate(item.path)} className="flex items-start gap-2.5 rounded-lg bg-secondary/50 p-3 cursor-pointer hover:bg-secondary/80 transition-colors">
                <item.icon className={`h-4 w-4 mt-0.5 shrink-0 text-success`} />
                <div>
                  <p className="text-xs font-medium text-card-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold text-card-foreground">Actions</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "Temporary Suspension", desc: "Pause vendor temporarily", icon: AlertTriangle, cls: "text-warning", path: "/sellers/temporary-suspension" },
              { label: "Permanent Ban", desc: "Remove vendor permanently", icon: Ban, cls: "text-destructive", path: "/sellers/permanent-ban" },
              { label: "View Audit Log", desc: "Check vendor activity history", icon: FileText, cls: "text-info", path: "/sellers/request-docs" },
            ].map((item) => (
              <div key={item.label} onClick={() => navigate(item.path)} className="flex items-start gap-2.5 rounded-lg bg-secondary/50 p-3 cursor-pointer hover:bg-secondary/80 transition-colors">
                <item.icon className={`h-4 w-4 mt-0.5 shrink-0 ${item.cls}`} />
                <div>
                  <p className="text-xs font-medium text-card-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Store Management */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          Store Management
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Button variant="outline" className="h-20 flex-col">
            <FileText className="h-5 w-5 mb-2" />
            <span className="text-xs">Store Settings</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <Package className="h-5 w-5 mb-2" />
            <span className="text-xs">Manage Inventory</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <MoreVertical className="h-5 w-5 mb-2" />
            <span className="text-xs">More Options</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

const Package = (props) => <FileText {...props} />;

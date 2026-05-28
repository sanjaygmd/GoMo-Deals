import { Outlet } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader";
import { AdminSidebar } from "./AdminSidebar";
import { AdminSearchProvider } from "../contexts/AdminSearchContext";

export function DashboardLayout() {
  return (
    <AdminSearchProvider>
      <div className="admin-dashboard bg-grid relative min-h-screen">
        <AdminSidebar />
        <div className="ml-72 flex-1 overflow-auto flex flex-col min-w-0">
          <DashboardHeader />
          <main className="max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-700">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminSearchProvider>
  );
}

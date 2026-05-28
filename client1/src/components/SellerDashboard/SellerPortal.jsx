import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import SellerPortalNav from './SellerPortalNav'
import SellerSidebar from './SellerSidebar'

const SellerPortal = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'seller') {
        navigate('/seller/login');
      } else if (!user.onboarding_completed) {
        navigate('/seller/onboarding');
      }
    }
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user || user.role !== 'seller' || !user.onboarding_completed) return null;

  return (
    <div className="flex h-screen bg-orange-50 overflow-hidden font-sans">
      <SellerSidebar />

      <div className="flex flex-col flex-1 relative overflow-hidden">
        <SellerPortalNav />
        <main className="flex-1 overflow-y-auto p-8 no-scrollbar bg-orange-50/50">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default SellerPortal

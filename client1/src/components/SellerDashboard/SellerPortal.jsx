import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import SellerPortalNav from './SellerPortalNav'
import SellerSidebar from './SellerSidebar'
import MandatoryPickupModal from './MandatoryPickupModal'
import { getSellerPickups } from '../../services/sellerService'

const SellerPortal = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [needsPickupLocation, setNeedsPickupLocation] = useState(false);
  const [checkingPickup, setCheckingPickup] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'seller') {
        navigate('/seller/login');
      } else if (!user.onboarding_completed) {
        navigate('/seller/onboarding');
      } else {
        // Check if seller has a pickup location
        const checkPickup = async () => {
          try {
            const res = await getSellerPickups(user.id || user.seller_id);
            if (res.success && res.data) {
              const hasDefault = res.data.some(p => p.is_default);
              if (!hasDefault && res.data.length === 0) {
                setNeedsPickupLocation(true);
              }
            } else {
               setNeedsPickupLocation(true);
            }
          } catch (err) {
            console.error("Error checking pickup location:", err);
          } finally {
            setCheckingPickup(false);
          }
        };
        checkPickup();
      }
    }
  }, [user, loading, navigate]);

  if (loading || checkingPickup) return null;
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

      {needsPickupLocation && (
        <MandatoryPickupModal onComplete={() => setNeedsPickupLocation(false)} />
      )}
    </div>
  )
}

export default SellerPortal

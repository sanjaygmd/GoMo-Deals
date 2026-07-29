import React from 'react';
// Force Vite rebuild trigger for custom styling update
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from "./components/layout/Navbar/Navbar"
import ScrollToTop from "./components/common/ScrollToTop"
import Footer from "./components/layout/Footer/Footer"
import Home from "./pages/Home/Home"
import ProductDetails from "./pages/Product/ProductDetails"

import { ShopProvider } from './context/ShopContext';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext/ProductContext';
import { ToastProvider } from './context/ToastContext';
import CategoryPage from './pages/Category/CategoryPage';
import DealsPage from './pages/Deals/DealsPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import VerifyEmailPage from './pages/Auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import OnboardingPage from './pages/Auth/OnboardingPage';
import CustomerLayout from './components/layout/CustomerLayout';

// Performance Optimization: Route-based Code Splitting (Risk 4.3)
// We use React.lazy to split large dashboard and secondary features into separate JS chunks,
// ensuring the customer's first visit to the Home page is extremely fast.
const AdminAuthPage = React.lazy(() => import('./components/admin/pages/AdminAuthPage'));
const AdminSignupPage = React.lazy(() => import('./components/admin/pages/AdminSignupPage'));
const ProfilePage = React.lazy(() => import('./pages/Auth/ProfilePage'));
const MyOrders = React.lazy(() => import('./pages/Auth/MyOrders'));

const SellerPortal = React.lazy(() => import('./components/SellerDashboard/SellerPortal'));
const SellerOverview = React.lazy(() => import('./components/SellerDashboard/SellerOverview'));
const SellerProducts = React.lazy(() => import('./components/SellerDashboard/SellerProducts'));
const SellerOrders = React.lazy(() => import('./components/SellerDashboard/SellerOrders'));
const SellerAnalytics = React.lazy(() => import('./components/SellerDashboard/SellerAnalytics'));
const SellerCustomers = React.lazy(() => import('./components/SellerDashboard/SellerCustomers'));
const SellerPayments = React.lazy(() => import('./components/SellerDashboard/SellerPayments'));
const SellerSettings = React.lazy(() => import('./components/SellerDashboard/SellerSettings'));
const SellerReturns = React.lazy(() => import('./components/SellerDashboard/SellerReturns'));
const SellerMessages = React.lazy(() => import('./components/SellerDashboard/SellerMessages'));
const SellerQA = React.lazy(() => import('./components/SellerDashboard/SellerQA'));
const SellerReviews = React.lazy(() => import('./components/SellerDashboard/SellerReviews'));
const SellerDisputes = React.lazy(() => import('./components/SellerDashboard/SellerDisputes'));

const SellerLoginPage = React.lazy(() => import('./components/SellerDashboard/SellerLoginPage'));
const SellerRegistration = React.lazy(() => import('./components/SellerDashboard/SellerRegistration'));
const SellerOnboarding = React.lazy(() => import('./components/SellerDashboard/SellerOnboarding/Onboarding'));
const SellerSubscription = React.lazy(() => import('./components/SellerDashboard/SellerSubscription'));
const SellerFleaMarket = React.lazy(() => import('./components/SellerDashboard/SellerFleaMarket'));
const SellerRankings = React.lazy(() => import('./components/SellerDashboard/SellerRankingsPage'));

const AdminLayout = React.lazy(() => import('./components/admin/components/DashboardLayout').then(module => ({ default: module.DashboardLayout })));
const AdminDashboardHome = React.lazy(() => import('./components/admin/pages/DashboardHome'));
const AdminProducts = React.lazy(() => import('./components/admin/pages/ProductsPage'));
const AddProductPage = React.lazy(() => import('./components/admin/pages/AddProductPage'));
const AdminOrders = React.lazy(() => import('./components/admin/pages/OrdersPage'));
const AdminCustomers = React.lazy(() => import('./components/admin/pages/CustomersPage'));
const AdminSellers = React.lazy(() => import('./components/admin/pages/SellersPage'));
const AdminCoupons = React.lazy(() => import('./components/admin/pages/CouponsPage'));
const AdminFinance = React.lazy(() => import('./components/admin/pages/FinancePage'));
const AdminAnalytics = React.lazy(() => import('./components/admin/pages/AnalyticsPage'));
const AdminLogs = React.lazy(() => import('./components/admin/pages/SystemLogsPage'));
const AdminSettings = React.lazy(() => import('./components/admin/pages/SettingsPage'));
const AdminReviews = React.lazy(() => import('./components/AdminDashboard/AdminReviews'));
const AdminDisputes = React.lazy(() => import('./components/AdminDashboard/AdminDisputes'));
const Administrators = React.lazy(() => import('./components/admin/pages/AdministratorsPage'));
const ReturnsPage = React.lazy(() => import('./components/admin/pages/ReturnsPage'));
const PayoutsPage = React.lazy(() => import('./components/admin/pages/PayoutsPage'));
const FleaMarketMediator = React.lazy(() => import('./components/admin/pages/FleaMarketMediator'));
const AdBannersPage = React.lazy(() => import('./components/admin/pages/AdBannersPage'));
const BrandRankingsPage = React.lazy(() => import('./components/admin/pages/BrandRankingsPage'));
const LegalPage = React.lazy(() => import('./pages/Legal/LegalPage'));
const CheckoutPage = React.lazy(() => import('./components/CheckoutPage/CheckoutPage'));
const OrderPlaced = React.lazy(() => import('./components/CheckoutPage/OrderPlaced'));
const Cart = React.lazy(() => import('./pages/Cart/Cart'));
const Wishlist = React.lazy(() => import('./pages/Wishlist/Wishlist'));
const SharedWishlist = React.lazy(() => import('./pages/Wishlist/SharedWishlist'));
const MembershipPage = React.lazy(() => import('./pages/Membership/MembershipPage'));
const FleaMarketPage = React.lazy(() => import('./pages/FleaMarket/FleaMarketPage'));
const FleaMarketTerms = React.lazy(() => import('./pages/FleaMarket/FleaMarketTerms'));
const CustomerConferenceRoom = React.lazy(() => import('./pages/FleaMarket/CustomerConferenceRoom'));

import { useAuth } from './context/AuthContext';

function AdminRouteGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const userRole = user?.role || user?.type;
  if (!user || (userRole !== 'admin' && userRole !== 'super_admin')) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

function SellerRouteGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const userRole = user?.role || user?.type;
  if (!user || userRole !== 'seller') {
    return <Navigate to="/seller-login" replace />;
  }

  return children;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Oops! Something went wrong.</h1>
          <p className="text-gray-600 mb-6 max-w-md">We're sorry, but the application encountered an unexpected error. This might be due to a network issue or a temporary glitch.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <ShopProvider>
        <ProductProvider>
          <ToastProvider>
            <Router>
        <ScrollToTop />
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        }>
          <Routes>
            {/* Standalone Auth Routes - outside layout to avoid redirect loops */}
            <Route path="/seller/login" element={<SellerLoginPage />} />
            <Route path="/seller/register" element={<SellerRegistration />} />
            <Route path="/seller-login" element={<SellerLoginPage />} />
            <Route path="/seller-register" element={<SellerRegistration />} />
            <Route path="/seller/onboarding" element={<SellerOnboarding />} />
            <Route path="/seller" element={<Navigate to="/seller-dashboard" replace />} />
            <Route path="/admin-login" element={<AdminAuthPage />} />
            <Route path="/admin-register" element={<AdminSignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/seller/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/flea-market/conference/:id" element={<CustomerConferenceRoom />} />

            {/* Customer Routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/collection/:type" element={<CategoryPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success" element={<OrderPlaced />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/onboarding/:id" element={<OnboardingPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/legal/:policyType" element={<LegalPage />} />
              <Route path="/shared-wishlist/:token" element={<SharedWishlist />} />
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="/flea-market" element={<FleaMarketPage />} />
              <Route path="/flea-market/terms" element={<FleaMarketTerms />} />
              <Route path="/deals" element={<DealsPage />} />
            </Route>
            
            {/* Seller Routes */}
            <Route element={<SellerRouteGuard><SellerPortal /></SellerRouteGuard>}>
              <Route path="/seller-dashboard" element={<SellerOverview />} />
              <Route path="/seller-dashboard/products" element={<SellerProducts />} />
              <Route path="/seller-dashboard/orders" element={<SellerOrders />} />

              <Route path="/seller-dashboard/flea-market" element={<SellerFleaMarket />} />
              <Route path="/seller-dashboard/customers" element={<SellerCustomers />} />
              <Route path="/seller-dashboard/analytics" element={<SellerAnalytics />} />
              <Route path="/seller-dashboard/payments" element={<SellerPayments />} />
              <Route path="/seller-dashboard/settings" element={<SellerSettings />} />
              <Route path="/seller-dashboard/returns" element={<SellerReturns />} />
              <Route path="/seller-dashboard/qa" element={<SellerQA />} />
              <Route path="/seller-dashboard/reviews" element={<SellerReviews />} />
              <Route path="/seller-dashboard/disputes" element={<SellerDisputes />} />
              <Route path="/seller-dashboard/messages" element={<SellerMessages />} />
              <Route path="/seller-dashboard/subscription" element={<SellerSubscription />} />
              <Route path="/seller-dashboard/rankings" element={<SellerRankings />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRouteGuard><AdminLayout /></AdminRouteGuard>}>
              <Route path="/admin" element={<AdminDashboardHome />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/products/add" element={<AddProductPage />} />
              <Route path="/admin/products/edit/:id" element={<AddProductPage />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/returns" element={<ReturnsPage />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/sellers" element={<AdminSellers />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/finance" element={<AdminFinance />} />
              <Route path="/admin/payouts" element={<PayoutsPage />} />
              <Route path="/admin/mediator" element={<AdminDisputes />} />
              <Route path="/admin/mediator/flea-market" element={<FleaMarketMediator />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />

              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/administrators" element={<Administrators />} />
              <Route path="/admin/ad-banners" element={<AdBannersPage />} />
              <Route path="/admin/rankings" element={<BrandRankingsPage />} />
            </Route>
          </Routes>
        </React.Suspense>
      </Router>
      </ToastProvider>
      </ProductProvider>
    </ShopProvider>
    </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

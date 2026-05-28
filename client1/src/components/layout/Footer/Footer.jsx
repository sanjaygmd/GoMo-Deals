import React from 'react';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';

const Instagram = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Twitter = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useShop();

  const scrollToProductFinder = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const section = document.getElementById('product-finder');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const section = document.getElementById('product-finder');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-orange-950 border-t border-orange-900/40 text-orange-100 pt-24 pb-12 transition-colors">
      <div className="max-w-[1800px] mx-auto px-6 sm:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-sans font-light tracking-[0.2em] uppercase text-white">
              GoMo <span className="font-serif italic lowercase font-normal text-orange-400">deals</span>
            </h3>
            <p className="text-orange-200/80 text-sm font-normal leading-relaxed max-w-xs">
              {t("footer_brand_desc")}
            </p>
            <div className="flex gap-5 pt-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-white transition-colors">
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-white transition-colors">
                <Twitter size={18} strokeWidth={1.5} />
              </a>
              <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-white transition-colors">
                <MessageCircle size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">{t("collections_title")}</h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-orange-300/80">
              <li>
                <Link to="/collection/electronics" className="group flex items-center gap-1.5 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <span className="w-0 group-hover:w-2 h-[1.5px] bg-orange-400 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                  {t("electronics")}
                </Link>
              </li>
              <li>
                <Link to="/collection/fashion" className="group flex items-center gap-1.5 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <span className="w-0 group-hover:w-2 h-[1.5px] bg-orange-400 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                  {t("fashion")}
                </Link>
              </li>
              <li>
                <Link to="/collection/home-living" className="group flex items-center gap-1.5 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <span className="w-0 group-hover:w-2 h-[1.5px] bg-orange-400 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                  {t("home_living")}
                </Link>
              </li>
              <li>
                <Link to="/collection/books" className="group flex items-center gap-1.5 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <span className="w-0 group-hover:w-2 h-[1.5px] bg-orange-400 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                  {t("books_stationery")}
                </Link>
              </li>
              <li>
                <Link to="/collection/beauty" className="group flex items-center gap-1.5 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <span className="w-0 group-hover:w-2 h-[1.5px] bg-orange-400 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                  {t("beauty_grooming")}
                </Link>
              </li>
              <li>
                <Link to="/collection/sports-fitness" className="group flex items-center gap-1.5 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <span className="w-0 group-hover:w-2 h-[1.5px] bg-orange-400 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                  {t("sports_fitness")}
                </Link>
              </li>
              <li>
                <button onClick={scrollToProductFinder} className="group flex items-center gap-1.5 hover:text-white transition-all duration-300 hover:translate-x-2 text-left uppercase tracking-widest font-bold cursor-pointer bg-transparent border-none p-0">
                  <span className="w-0 group-hover:w-2 h-[1.5px] bg-orange-400 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                  {t("gomo_smart_assistant")}
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">{t("support_title")}</h4>
            </div>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-orange-300/80">
              <li>
                <Link to="/legal/shipping-policy" className="group flex items-center gap-1.5 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <span className="w-0 group-hover:w-2 h-[1.5px] bg-orange-400 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                  {t("shipping_policy")}
                </Link>
              </li>
              <li>
                <Link to="/legal/return-policy" className="group flex items-center gap-1.5 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <span className="w-0 group-hover:w-2 h-[1.5px] bg-orange-400 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                  {t("return_refunds")}
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy-policy" className="group flex items-center gap-1.5 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <span className="w-0 group-hover:w-2 h-[1.5px] bg-orange-400 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                  {t("privacy_policy")}
                </Link>
              </li>
              <li>
                <Link to="/legal/faqs" className="group flex items-center gap-1.5 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <span className="w-0 group-hover:w-2 h-[1.5px] bg-orange-400 transition-all duration-300 opacity-0 group-hover:opacity-100"></span>
                  {t("faqs")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">{t("newsletter_title")}</h4>
            <p className="text-orange-200/80 text-sm font-normal">
              {t("newsletter_desc")}
            </p>
            <div className="relative border-b border-orange-800 pb-2 flex items-center">
              <input 
                type="email" 
                placeholder={t("email_address")} 
                className="bg-transparent border-none text-sm font-light w-full focus:outline-none placeholder:text-orange-700 text-white"
              />
              <button className="text-orange-400 hover:text-white transition-colors">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-orange-900/60 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] uppercase tracking-widest text-orange-400">
            &copy; {new Date().getFullYear()} GoMo Deals. {t("all_rights_reserved")}
          </p>
          <div className="flex gap-8 text-[9px] uppercase tracking-widest text-orange-400 font-bold">
            <Link to="/legal/terms" className="hover:text-white transition-colors">{t("terms_of_service")}</Link>
            <Link to="/legal/cookies" className="hover:text-white transition-colors">{t("cookies")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

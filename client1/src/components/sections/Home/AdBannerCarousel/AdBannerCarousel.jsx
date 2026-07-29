import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { api } from '../../../../services/api';

export default function AdBannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveBanners = async () => {
      try {
        const res = await api.get('/ad-banners/active');
        if (res.data.success) {
          setBanners(res.data.banners || []);
        }
      } catch (error) {
        console.error('Failed to fetch ad banners', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveBanners();
  }, []);

  if (loading || banners.length === 0) return null;

  // Determine grid layout and card height based on banner count for optimal aesthetic impact
  const isSingle = banners.length === 1;
  const gridCols = isSingle ? 'grid-cols-1 max-w-5xl mx-auto' :
                   banners.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                   banners.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                   'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  const cardHeight = isSingle ? 'h-[260px] sm:h-[320px] md:h-[380px]' : 'h-[220px] sm:h-[260px] md:h-[300px]';

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8">
      {/* Optional subtle section indicator when multiple banners exist */}
      {banners.length > 1 && (
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-gray-400">
              Featured Brand Partners
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium hidden sm:inline-block">
            Sponsored Highlights
          </span>
        </div>
      )}

      <div className={`grid gap-6 ${gridCols}`}>
        {banners.map((banner, index) => {
          const content = (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative group w-full ${cardHeight} rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-orange-500/10 border border-gray-200/60 hover:border-orange-500/50 transition-all duration-500 bg-gray-950 cursor-pointer`}
            >
              {/* Background Artwork with Smooth Zoom */}
              <img
                src={banner.image_url}
                alt={banner.brand_name || 'Sponsored Ad'}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out opacity-85 group-hover:opacity-100"
              />
              
              {/* Multi-layer dark gradient overlay for typography readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/95 via-gray-950/30 to-transparent transition-opacity duration-300"></div>

              {/* Shimmer / Gloss Sweep Micro-animation on Hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none z-20"></div>

              {/* Top Bar: Sponsored Live Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/15 rounded-full text-[10px] font-extrabold tracking-widest text-white uppercase shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  <span>Sponsored</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 group-hover:text-orange-400 group-hover:border-orange-500/40 transition-all duration-300 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Bottom Bar: Brand Details & High-Conversion Action Button */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end z-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md group-hover:text-orange-300 transition-colors duration-300 flex items-center gap-2">
                      <span>{banner.brand_name || 'Featured Partner'}</span>
                    </h3>
                    <p className="mt-1 text-xs font-medium text-gray-300 line-clamp-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      {banner.target_url ? 'Explore exclusive offers & catalog' : 'Official brand partner showcase'}
                    </p>
                  </div>

                  {/* CTA Icon Button */}
                  {banner.target_url && (
                    <div className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 group-hover:translate-x-1 group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-all duration-300">
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );

          return banner.target_url ? (
            <a 
              key={banner.banner_id || index} 
              href={banner.target_url} 
              target="_blank" 
              rel="noreferrer" 
              className="block focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-4 rounded-3xl transition-all"
            >
              {content}
            </a>
          ) : (
            <div key={banner.banner_id || index}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

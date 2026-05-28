import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import fashionImg from "../../../../../assets/relationships/fashion.png";
import electronicsImg from "../../../../../assets/relationships/electronics.png";
import homeImg from "../../../../../assets/relationships/home.png";

const storefronts = [
  {
    id: 'fashion',
    title: 'The Fashion Showcase',
    subtitle: 'Step up your style with up to 40% off premium apparel and lifestyle gear.',
    image: fashionImg,
    tag: 'Trending Sale'
  },
  {
    id: 'electronics',
    title: 'The Smart Workspace',
    subtitle: 'Upgrade your productivity. Discover premium audio, laptops, and smart gear.',
    image: electronicsImg,
    tag: 'Best Price Deals'
  },
  {
    id: 'home-living',
    title: 'Elegant Spaces',
    subtitle: 'Refresh your living rooms with beautiful home decor, kitchenware, and layout ideas.',
    image: homeImg,
    tag: 'New Launch'
  }
];

const StorefrontCard = ({ storefront, index }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      className="flex-shrink-0 w-[85vw] sm:w-[450px] group cursor-pointer"
      onClick={() => navigate(`/collection/${storefront.id}`)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#faebe3] mb-6 rounded-2xl">
        <img
          src={storefront.image}
          alt={storefront.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute top-6 left-6">
          <span className="px-4 py-1.5 bg-white/80 backdrop-blur-md border border-white/40 text-[9px] uppercase tracking-[0.25em] font-black text-orange-950 shadow-sm rounded-full">
            {storefront.tag}
          </span>
        </div>
        <div className="absolute inset-0 bg-orange-600/0 group-hover:bg-orange-600/5 transition-colors duration-500" />
      </div>

      <div className="space-y-2 px-1">
        <h3 className="text-xl sm:text-2xl font-normal tracking-wide text-orange-850">
          {storefront.title}
        </h3>
        <p className="text-sm text-orange-500 font-normal leading-relaxed max-w-[95%]">
          {storefront.subtitle}
        </p>
        <button
          className="inline-block pt-2 text-[11px] uppercase tracking-[0.2em] text-orange-400 group-hover:text-orange-900 transition-colors duration-300 text-left font-black"
        >
          Explore Collection →
        </button>
      </div>
    </motion.div>
  );
};

const RelationshipCollections = () => {
  const scrollRef = useRef(null);

  return (
    <section id="featured-storefronts" className="py-16 bg-[#fdfbf9] overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-6 sm:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-[11px] uppercase tracking-[0.4em] text-orange-400 block mb-4 font-semibold"
            >
              Limited-Time Promos
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl font-light tracking-tight text-orange-900 leading-tight"
            >
              Featured Storefronts <br />
              & <span className="italic">Deals of the Day</span>.
            </motion.h2>
          </div>
          <p className="text-orange-500 text-sm max-w-sm font-light leading-relaxed">
            Mega deals across our top product lines. Grab these premium exclusive discounts before they vanish.
          </p>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto pb-12 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {storefronts.map((item, index) => (
            <StorefrontCard key={item.id} storefront={item} index={index} />
          ))}
          <div className="flex-shrink-0 w-6 sm:w-12" />
        </div>
      </div>
    </section>
  );
};

export default RelationshipCollections;

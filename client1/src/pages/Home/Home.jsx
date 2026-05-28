import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Hero from '../../components/sections/Home/Hero/Hero';
import ShopByCategory from '../../components/sections/Home/ShopByOccasion/ShopByOccasion';

import ProductGrid from '../../components/sections/Home/ProductGrid/ProductGrid';
import ProductFinder from '../../components/sections/Home/ProductFinder/ProductFinder';

const Home = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';
  const isSearching = searchQuery.trim() !== '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-x-hidden"
    >
      {!isSearching && <Hero />}
      <div className="space-y-8 md:space-y-10">
        <ProductGrid />
        
        {!isSearching && <ShopByCategory />}
        {!isSearching && <ProductFinder />}
      </div>

    </motion.div>
  );
};

export default Home;

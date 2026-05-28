import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Laptop, Shirt, Home, BookOpen, Flower2, Dumbbell } from 'lucide-react';
import { useShop } from '../../../../context/ShopContext';

const categories = [
  {
    id: 'electronics',
    title: 'Electronics',
    icon: <Laptop className="w-8 h-8 stroke-[1.25px]" />,
    filter: 'electronics'
  },
  {
    id: 'fashion',
    title: 'Fashion & Apparel',
    icon: <Shirt className="w-8 h-8 stroke-[1.25px]" />,
    filter: 'fashion'
  },
  {
    id: 'home-kitchen',
    title: 'Home & Kitchen',
    icon: <Home className="w-8 h-8 stroke-[1.25px]" />,
    filter: 'home-living'
  },
  {
    id: 'books',
    title: 'Books & Stationery',
    icon: <BookOpen className="w-8 h-8 stroke-[1.25px]" />,
    filter: 'books'
  },
  {
    id: 'beauty',
    title: 'Beauty & Grooming',
    icon: <Flower2 className="w-8 h-8 stroke-[1.25px]" />,
    filter: 'beauty'
  },
  {
    id: 'sports',
    title: 'Sports & Fitness',
    icon: <Dumbbell className="w-8 h-8 stroke-[1.25px]" />,
    filter: 'sports-fitness'
  }
];

const CategoryCard = ({ category, index }) => {
  const navigate = useNavigate();
  const { t } = useShop();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      whileHover={{ y: -6 }}
      onClick={() => navigate(`/collection/${category.filter}`)}
      className="flex flex-col items-center justify-center group cursor-pointer"
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#fdfaf8] border border-orange-100 flex items-center justify-center mb-4 transition-all duration-500 group-hover:bg-orange-950 group-hover:text-white group-hover:border-orange-950 group-hover:shadow-xl group-hover:shadow-orange-950/10">
        <div className="transition-transform duration-500 group-hover:scale-110">
          {category.icon}
        </div>
      </div>
      <span className="text-[11px] font-bold tracking-widest text-orange-900 uppercase group-hover:text-orange-500 transition-colors text-center px-2">
        {t(category.id === 'home-kitchen' ? 'home_living' : category.id === 'sports' ? 'sports_fitness' : category.id)}
      </span>
    </motion.div>
  );
};

const ShopByCategory = () => {
  const { t } = useShop();
  return (
    <section id="shop-by-category" className="py-12 bg-white">
      <div className="max-w-[1800px] mx-auto px-6 sm:px-12 text-center">
        <div className="mb-12">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-[11px] uppercase tracking-[0.4em] text-orange-400 block mb-4"
          >
            {t("explore_store")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-light tracking-tight text-orange-900"
          >
            {t("categories")}
          </motion.h2>
          <p className="mt-6 text-orange-500 text-sm max-w-xl mx-auto font-normal leading-relaxed">
            {t("discover_premium_selection")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 sm:gap-12">
          {categories.map((item, index) => (
            <CategoryCard key={item.id} category={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;

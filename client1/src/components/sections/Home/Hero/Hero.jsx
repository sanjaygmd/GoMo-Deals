import React from 'react';
import { Link } from 'react-router-dom';
import heroVideo from '../../../../assets/Hero_video.mp4';

const Hero = () => {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-[72vh] w-full overflow-hidden bg-zinc-950 flex items-center justify-center text-white">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src={heroVideo} type="video/mp4" />
      </video>
      {/* <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/30 mix-blend-multiply" /> */}
      {/* <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl">
        <p className="text-lg md:text-xl mb-8 text-zinc-300">
          Your ultimate destination for tech, fashion, home & more.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => scrollTo('product-grid')} 
            className="px-6 py-3 rounded-full bg-white text-orange-950 font-bold hover:bg-orange-600 hover:text-white transition cursor-pointer"
          >
            Shop All Deals
          </button>
          <button 
            onClick={() => scrollTo('shop-by-category')} 
            className="px-6 py-3 rounded-full bg-white text-orange-950 font-bold hover:bg-orange-600 hover:text-white transition cursor-pointer"
          >
            Explore Categories
          </button>
        </div>
      </div> */}
    </section>
  );
};

export default Hero;

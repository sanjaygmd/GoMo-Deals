import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NavMain from './NavMain';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const lastScrollY = React.useRef(0);
    const location = useLocation();
    const isHome = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Background logic
            const isScrolled = currentScrollY > 100;
            setScrolled(prev => (isScrolled !== prev ? isScrolled : prev));

            // Visibility logic (Hide on scroll down, show on scroll up)
            if (currentScrollY > lastScrollY.current && currentScrollY > 200) {
                setVisible(false);
            } else {
                setVisible(true);
            }
            
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const navScrolled = scrolled || !isHome;

    return (
        <header
            className={`sticky top-0 left-0 w-full z-[100] transition-all duration-500 transform ${
                visible ? 'translate-y-0' : '-translate-y-full'
            } bg-white text-orange-900 shadow-md py-1`}
        >
            <NavMain scrolled={scrolled} isHome={isHome} />
        </header>
    );
};

export default Navbar;
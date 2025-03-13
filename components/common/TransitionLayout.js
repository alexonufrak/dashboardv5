import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TransitionLayout - A component that provides smooth transitions between pages
 * 
 * This component wraps page content and handles animations when navigating between
 * specified route patterns.
 */
const TransitionLayout = ({ 
  children, 
  className = '', 
  routePattern = '' 
}) => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [displayedChildren, setDisplayedChildren] = useState(children);

  // Animation variants for sliding effect
  const slideVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  };

  // Check if current route matches the pattern
  const isRouteMatching = () => {
    if (!routePattern) return true;
    return router.pathname.includes(routePattern);
  };

  // Handle route changes
  useEffect(() => {
    const handleRouteChangeStart = (url) => {
      // Only animate for specific routes
      if (routePattern && (router.pathname.includes(routePattern) || url.includes(routePattern))) {
        setIsVisible(false);
      }
    };

    const handleRouteChangeComplete = () => {
      setIsVisible(true);
      setDisplayedChildren(children);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router, routePattern, children]);

  // Update displayed children when they change
  useEffect(() => {
    if (isVisible) {
      setDisplayedChildren(children);
    }
  }, [children, isVisible]);

  return (
    <AnimatePresence mode="wait">
      {isRouteMatching() && (
        <motion.div
          key={router.asPath}
          variants={slideVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
          className={className}
        >
          {displayedChildren}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransitionLayout;
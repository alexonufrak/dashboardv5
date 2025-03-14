import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from "@/components/magicui/blur-fade";

/**
 * TransitionLayout - A component that provides smooth transitions between pages
 * 
 * This component wraps page content and handles different animations based on the context:
 * - Initial load: BlurFade animation
 * - Page to application: Fade and slide left
 * - Application to page: Fade and slide right
 */
const TransitionLayout = ({ 
  children, 
  className = '', 
  routePattern = '',
  transitionType = 'default' // Options: 'default', 'application', 'programsList', 'initial'
}) => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const [initialLoad, setInitialLoad] = useState(true);
  const [transitionDirection, setTransitionDirection] = useState('right'); // 'left' or 'right'
  const [lastPath, setLastPath] = useState('');
  
  // Check if current route matches the pattern
  const isRouteMatching = () => {
    if (!routePattern) return true;
    return router.pathname.includes(routePattern);
  };

  // Determine transition direction based on navigation
  useEffect(() => {
    if (lastPath) {
      // Going from programs page to application
      if (lastPath === '/dashboard/programs' && router.pathname.includes('/apply')) {
        setTransitionDirection('left');
      } 
      // Going from application back to programs page
      else if (lastPath.includes('/apply') && router.pathname === '/dashboard/programs') {
        setTransitionDirection('right');
      }
    }
    
    setLastPath(router.pathname);
  }, [router.pathname, lastPath]);

  // Handle route changes
  useEffect(() => {
    const handleRouteChangeStart = (url) => {
      // Only animate for specific routes
      if (routePattern && (router.pathname.includes(routePattern) || url.includes(routePattern))) {
        setIsVisible(false);
        setInitialLoad(false);
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

  // After component mounts, clear initial load state
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Animation variants for sliding effect
  const slideVariants = {
    hiddenRight: { x: '100%', opacity: 0 },
    hiddenLeft: { x: '-100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exitLeft: { x: '-100%', opacity: 0 },
    exitRight: { x: '100%', opacity: 0 }
  };

  // Use initial load animation (blur fade) or sliding animation
  if (initialLoad && transitionType !== 'application') {
    return (
      <BlurFade delay={0.2} inView className={className}>
        {children}
      </BlurFade>
    );
  }

  // For transitions between pages, use slide animations
  return (
    <AnimatePresence mode="wait">
      {isRouteMatching() && (
        <motion.div
          key={router.asPath}
          variants={slideVariants}
          initial={transitionDirection === 'left' ? 'hiddenRight' : 'hiddenLeft'}
          animate="visible"
          exit={transitionDirection === 'left' ? 'exitLeft' : 'exitRight'}
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
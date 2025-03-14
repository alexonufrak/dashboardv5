import React, { useState, useEffect, useRef } from 'react';
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
  transitionType = 'default' // Options: 'default', 'application', 'programsList'
}) => {
  const router = useRouter();
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const hasRunBlurFadeRef = useRef(false);
  
  // Initialize transition direction based on the component type
  const initialDirection = transitionType === 'application' ? 'left' : 'right';
  const [transitionDirection, setTransitionDirection] = useState(initialDirection);
  
  // Store the last path for transition direction detection
  const [lastPath, setLastPath] = useState('');
  
  // After first render, mark blur fade as run to prevent double animation
  useEffect(() => {
    if (!hasRunBlurFadeRef.current) {
      hasRunBlurFadeRef.current = true;
    }
    
    // Only consider it an initial load if this is first page visit
    if (window.performance) {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0 && navEntries[0].type === 'navigate') {
        setInitialLoad(true);
      } else {
        setInitialLoad(false);
      }
    }
    
    // Clear initial load after a short delay to prevent double animation
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Determine transition direction based on navigation paths
  useEffect(() => {
    if (!router.pathname || !lastPath) {
      setLastPath(router.pathname);
      return;
    }
    
    // Only update direction if this isn't the initial render
    if (lastPath) {
      if (router.pathname.includes('/apply')) {
        // Application page should always slide in from right
        setTransitionDirection('left');
      } else if (lastPath.includes('/apply')) {
        // Going back to programs should slide in from left
        setTransitionDirection('right');
      }
    }
    
    setLastPath(router.pathname);
  }, [router.pathname, lastPath]);
  
  // Handle route changes
  useEffect(() => {
    const handleRouteChangeStart = (url) => {
      setIsNavigating(true);
      
      // Determine direction based on URLs
      if (url.includes('/apply')) {
        setTransitionDirection('left');
      } else if (router.pathname.includes('/apply')) {
        setTransitionDirection('right');
      }
    };

    const handleRouteChangeComplete = () => {
      setIsNavigating(false);
      setDisplayedChildren(children);
      setInitialLoad(false);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router, children]);

  // Update displayed children when they change
  useEffect(() => {
    setDisplayedChildren(children);
  }, [children]);

  // Animation variants for sliding effect
  const slideVariants = {
    hiddenRight: { x: '100%', opacity: 0 },
    hiddenLeft: { x: '-100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exitLeft: { x: '-100%', opacity: 0 },
    exitRight: { x: '100%', opacity: 0 }
  };

  // For the programs list page:
  // 1. Use BlurFade for initial page load 
  // 2. Skip animations entirely if not coming from an application page
  if (transitionType === 'programsList') {
    // If it's initial load, use BlurFade (only once)
    if (initialLoad && !hasRunBlurFadeRef.current) {
      return (
        <BlurFade delay={0.2} inView className={className}>
          {children}
        </BlurFade>
      );
    }
    
    // If we're not coming from an application page, skip animation
    if (!lastPath.includes('/apply')) {
      return <div className={className}>{children}</div>;
    }
  }

  // Use specific entrance/exit directions based on whether this is application or programs
  const getInitialAnimState = () => {
    if (transitionType === 'application') return 'hiddenRight';
    return transitionDirection === 'left' ? 'hiddenRight' : 'hiddenLeft';
  };
  
  const getExitAnimState = () => {
    if (transitionType === 'application') return 'exitRight';
    return transitionDirection === 'left' ? 'exitLeft' : 'exitRight';
  };

  // For transitions between pages, use slide animations
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={router.asPath}
        variants={slideVariants}
        initial={getInitialAnimState()}
        animate="visible"
        exit={getExitAnimState()}
        transition={{ 
          type: 'tween', 
          ease: 'easeInOut', 
          duration: 0.3
        }}
        className={className}
      >
        {displayedChildren}
      </motion.div>
    </AnimatePresence>
  );
};

export default TransitionLayout;
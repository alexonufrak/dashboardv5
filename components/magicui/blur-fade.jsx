"use client";;
import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef } from "react";

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  offset = 6,
  direction = "down",
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
  ...props
}) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  
  // Use a ref to track if the animation has already played
  const hasPlayed = useRef(false);
  
  // Only trigger the animation if:
  // 1. inView prop is false (meaning we don't care about viewport) OR
  // 2. inView is true AND the element is actually in view AND we haven't played the animation yet
  const shouldAnimate = !inView || (inViewResult && !hasPlayed.current);
  
  // Once we've decided to animate, mark it as played
  if (shouldAnimate) {
    hasPlayed.current = true;
  }
  
  const isInView = shouldAnimate;
  const defaultVariants = {
    hidden: {
      [direction === "left" || direction === "right" ? "x" : "y"]:
        direction === "right" || direction === "down" ? -offset : offset,
      opacity: 0,
      filter: `blur(${blur})`,
    },
    visible: {
      [direction === "left" || direction === "right" ? "x" : "y"]: 0,
      opacity: 1,
      filter: `blur(0px)`,
    },
  };
  const combinedVariants = variant || defaultVariants;
  return (
    (<AnimatePresence>
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        exit="hidden"
        variants={combinedVariants}
        transition={{
          delay: 0.04 + delay,
          duration,
          ease: "easeOut",
        }}
        className={className}
        {...props}>
        {children}
      </motion.div>
    </AnimatePresence>)
  );
}

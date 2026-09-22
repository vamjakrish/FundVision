import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';

export default function AnimatedCounter({ value = 0, prefix = '', suffix = '', decimals = 0, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { damping: 30, stiffness: 90 });

  useEffect(() => {
    if (isInView) motionVal.set(value);
  }, [isInView, value]);

  const nodeRef = useRef(null);
  useEffect(() => {
    const unsub = spring.on('change', (latest) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = `${prefix}${latest.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}${suffix}`;
      }
    });
    return unsub;
  }, [spring, prefix, suffix, decimals]);

  return <span ref={ref} className={className}><span ref={nodeRef}>{prefix}0{suffix}</span></span>;
}

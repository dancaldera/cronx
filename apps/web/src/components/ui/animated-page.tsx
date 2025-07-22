'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { pageVariants } from '@/lib/animations';

interface AnimatedPageProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

export function AnimatedPage({ children, className = '', ...props }: AnimatedPageProps) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
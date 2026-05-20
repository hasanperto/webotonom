import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { fadeUp } from '../../utils/motion';

/**
 * İlk görünümde bir kez fade-up animasyonu.
 */
export default function RevealOnScroll({
    children,
    className,
    as: Component = motion.div,
    once = true,
    amount = 0.15,
    delay = 0,
    y = 12,
    ...rest
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, amount });
    const reduceMotion = useReducedMotion();

    const variants = reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : {
              hidden: { ...fadeUp.hidden, y },
              show: {
                  ...fadeUp.show,
                  transition: { ...fadeUp.show.transition, delay },
              },
          };

    return (
        <Component
            ref={ref}
            className={className}
            initial="hidden"
            animate={isInView ? 'show' : 'hidden'}
            variants={variants}
            {...rest}
        >
            {children}
        </Component>
    );
}

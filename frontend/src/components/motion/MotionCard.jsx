import { motion, useReducedMotion } from 'framer-motion';
import { cardHover } from '../../utils/motion';

/**
 * Kart hover lift — prefers-reduced-motion'da sadece opacity/transition yok.
 */
export default function MotionCard({
    children,
    className,
    as: Component = motion.div,
    enableHover = true,
    ...rest
}) {
    const reduceMotion = useReducedMotion();

    if (reduceMotion || !enableHover) {
        return (
            <Component className={className} {...rest}>
                {children}
            </Component>
        );
    }

    return (
        <Component
            className={className}
            initial="rest"
            whileHover="hover"
            variants={cardHover}
            {...rest}
        >
            {children}
        </Component>
    );
}

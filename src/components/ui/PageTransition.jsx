import { motion } from 'framer-motion'

/**
 * PageTransition — shared enter animation (opacity + translateY + stagger),
 * identical to the Dashboard/Analyze pattern. Wrap page blocks in <PageItem>.
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export default function PageTransition({ children, className }) {
  return (
    <motion.div className={className} initial="hidden" animate="visible" variants={containerVariants}>
      {children}
    </motion.div>
  )
}

export function PageItem({ children, className }) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}

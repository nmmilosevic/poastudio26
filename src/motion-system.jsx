import { useRef } from "react";
import { LazyMotion, domAnimation, m, useScroll, useTransform } from "framer-motion";

export const MOTION = Object.freeze({
  ease: [0.16, 1, 0.3, 1],
  duration: {
    feedback: 0.16,
    state: 0.28,
    exit: 0.24,
    enter: 0.56,
    media: 0.72,
    signature: 1.05,
  },
  stagger: {
    words: 0.052,
    items: 0.075,
  },
});

export const VIEWPORT_ONCE = Object.freeze({
  once: true,
  amount: 0.16,
  margin: "0px 0px -8% 0px",
});

export const routeVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "tween", duration: MOTION.duration.enter, ease: MOTION.ease },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { type: "tween", duration: MOTION.duration.exit, ease: MOTION.ease },
  },
};

export const revealVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: "tween", duration: MOTION.duration.enter, delay, ease: MOTION.ease },
  }),
};

export const mediaVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.992 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "tween", duration: MOTION.duration.media, ease: MOTION.ease },
  },
};

export const mediaImageVariants = {
  hidden: { scale: 1.028, filter: "saturate(0.74)" },
  visible: {
    scale: 1,
    filter: "saturate(0.92)",
    transition: { type: "tween", duration: MOTION.duration.signature, ease: MOTION.ease },
  },
};

export const heroImageVariants = {
  hidden: { opacity: 0, scale: 1.035, filter: "saturate(0.72)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "saturate(0.82)",
    transition: { type: "tween", duration: MOTION.duration.signature, ease: MOTION.ease },
  },
};

export const wordGroupVariants = {
  hidden: {},
  visible: (delay = 0) => ({
    transition: {
      delayChildren: delay,
      staggerChildren: MOTION.stagger.words,
    },
  }),
};

export const wordVariants = {
  hidden: { opacity: 0, y: "72%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: { type: "tween", duration: 0.62, ease: MOTION.ease },
  },
};

export const menuVariants = {
  hidden: { opacity: 0, y: "-2%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: {
      type: "tween",
      duration: MOTION.duration.state,
      ease: MOTION.ease,
      when: "beforeChildren",
      staggerChildren: MOTION.stagger.items,
    },
  },
  exit: {
    opacity: 0,
    y: "-1%",
    transition: { type: "tween", duration: 0.2, ease: MOTION.ease },
  },
};

export const menuItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "tween", duration: 0.42, ease: MOTION.ease },
  },
};

export const serviceImageVariants = {
  hidden: { opacity: 0, scale: 1.02 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "tween", duration: 0.68, ease: MOTION.ease },
  },
  exit: {
    opacity: 0,
    scale: 1.008,
    transition: { type: "tween", duration: 0.3, ease: MOTION.ease },
  },
};

function heroMorphProgress(value) {
  const morphEnd = typeof window !== "undefined" && window.innerWidth <= 760 ? 0.32 : 0.42;
  const morphStart = morphEnd * 0.08;
  return Math.min(Math.max((value - morphStart) / (morphEnd - morphStart), 0), 1);
}

export function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

export function ScrollHeroFrame({ children }) {
  const stageRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end end"],
  });
  const clipPath = useTransform(scrollYProgress, (value) => {
    const progress = 1 - heroMorphProgress(value);
    const maximumRadius =
      typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches ? 42 : 56;
    return `inset(${progress * 24}px round ${progress * maximumRadius}px)`;
  });
  const frameInset = useTransform(
    scrollYProgress,
    (value) => `${(1 - heroMorphProgress(value)) * 24}px`,
  );

  return (
    <div className="home-hero-stage" ref={stageRef}>
      <m.section className="home-hero" style={{ clipPath, "--hero-frame-inset": frameInset }}>
        {children}
      </m.section>
    </div>
  );
}

export function Reveal({ children, className = "", delay = 0 }) {
  return (
    <m.div
      className={className}
      custom={delay}
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
    >
      {children}
    </m.div>
  );
}

export function MotionHeading({ as = "h1", text, className = "", delay = 0, immediate = false }) {
  const Heading = as === "h2" ? m.h2 : as === "h3" ? m.h3 : m.h1;
  const lines = String(text).split("\n");
  const hasExplicitLines = lines.length > 1;
  const trigger = immediate
    ? { animate: "visible" }
    : { whileInView: "visible", viewport: VIEWPORT_ONCE };

  return (
    <Heading
      className={className}
      aria-label={text}
      custom={delay}
      variants={wordGroupVariants}
      initial="hidden"
      {...trigger}
    >
      {lines.map((line, lineIndex) => {
        const words = line.trim().split(/\s+/);
        return (
          <span
            className={`motion-line ${hasExplicitLines ? "motion-line--locked" : ""}`}
            aria-hidden="true"
            key={`${line}-${lineIndex}`}
          >
            {words.map((word, wordIndex) => (
              <span className="motion-word-shell" key={`${word}-${wordIndex}`}>
                <m.span variants={wordVariants}>{word}</m.span>
                {wordIndex < words.length - 1 && "\u00a0"}
              </span>
            ))}
          </span>
        );
      })}
    </Heading>
  );
}

function ScrollWord({ progress, index, count, children }) {
  const start = (index / Math.max(count, 1)) * 0.78;
  const end = Math.min(start + 0.2, 1);
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const y = useTransform(progress, [start, end], ["14%", "0%"]);
  return (
    <m.span style={{ opacity, y }}>
      {children}
      {" "}
    </m.span>
  );
}

export function ScrollWordReveal({ children, className = "" }) {
  const ref = useRef(null);
  const words = String(children).split(/\s+/);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.86", "end 0.5"],
  });

  return (
    <p className={className} ref={ref}>
      {words.map((word, index) => (
        <ScrollWord progress={scrollYProgress} index={index} count={words.length} key={`${word}-${index}`}>
          {word}
        </ScrollWord>
      ))}
    </p>
  );
}

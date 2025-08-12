"use client";
import React from "react";
import { motion } from "motion/react";
import styles from "./Lamp.module.css";

// This is a simple demo of how to use the LampContainer
export function LampDemo() {
  return (
    <LampContainer>
      {/* Note: The LampContainer itself doesn't render children.
          Content would typically be placed on top of it in a parent component,
          or by modifying LampContainer to render its children.
          For the demo, we add some content here.
      */}
      <div className={styles.contentOnTop}>
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className={styles.demoTitle}
        >
          Lamps <br /> built for everyone
        </motion.h1>
      </div>
    </LampContainer>
  );
}


// --- THE CONVERTED COMPONENTS ---

export const LampContainer = ({ children, className }) => {
  return (
    <div className={`${styles.lampContainer} ${className || ""}`}>
      <div className={styles.lampIsolateContainer}>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className={styles.conicBeamRight}
        >
          <div className={styles.maskBottom} />
          <div className={styles.maskLeft} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className={styles.conicBeamLeft}
        >
          <div className={styles.maskRight} />
          <div className={styles.maskBottom} />
        </motion.div>
        <div className={styles.blurFull}></div>
        <div className={styles.backdropBlur}></div>
        <div className={styles.glowLarge}></div>
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className={styles.glowSmall}
        ></motion.div>
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className={styles.lightLine}
        ></motion.div>

        <div className={styles.topCover}></div>
      </div>
      {/* The original component did not render children, so we respect that. 
          If you need to render content inside, you can add {children} here.
      */}
    </div>
  );
};

// Compact light-only variant for embedding as an overlay (no full-screen background)
export const LampLight = ({ className }) => {
  return (
    <div className={`${styles.lampLightRoot} ${className || ""}`}>
      <div className={styles.lampIsolateContainerLight}>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          style={{ backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))` }}
          className={styles.lampLightBeamRight}
        />
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          style={{ backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))` }}
          className={styles.lampLightBeamLeft}
        />
        <div className={styles.lampLightGlowLarge} />
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className={styles.lampLightGlowSmall}
        />
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className={styles.lampLightLine}
        />
      </div>
    </div>
  );
};

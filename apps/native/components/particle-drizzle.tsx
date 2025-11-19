import { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const DEFAULT_COLORS = ["#2563EB", "#10B981", "#FACC15", "#FFFFFF"];

type ParticleDrizzleProps = {
  active: boolean;
  delay?: number;
  colors?: string[];
  count?: number;
};

type ParticleConfig = {
  id: string;
  color: string;
  offsetX: number;
  offsetY: number;
  delay: number;
  duration: number;
  size: number;
  aspect: number;
  rotate: number;
};

const PARTICLE_COUNT = 24;

export const ParticleDrizzle = memo(function ParticleDrizzle({
  active,
  delay = 0,
  colors = DEFAULT_COLORS,
  count = PARTICLE_COUNT,
}: ParticleDrizzleProps) {
  const [burst, setBurst] = useState<ParticleConfig[]>([]);
  const colorsKey = useMemo(() => colors.join(","), [colors]);

  useEffect(() => {
    if (!active) {
      setBurst([]);
      return;
    }
    const timer = setTimeout(() => {
      setBurst(createParticles(count, colors));
    }, delay);
    return () => clearTimeout(timer);
  }, [active, delay, count, colorsKey]);

  if (!active || burst.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {burst.map((particle) => (
        <Particle key={particle.id} config={particle} />
      ))}
    </View>
  );
});

const Particle = ({ config }: { config: ParticleConfig }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    opacity.value = 0;

    translateX.value = withDelay(
      config.delay,
      withTiming(config.offsetX, {
        duration: config.duration,
        easing: Easing.out(Easing.quad),
      }),
    );
    translateY.value = withDelay(
      config.delay,
      withTiming(-config.offsetY, {
        duration: config.duration,
        easing: Easing.out(Easing.quad),
      }),
    );
    opacity.value = withDelay(
      config.delay,
      withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: Math.max(200, config.duration - 150) }),
      ),
    );
  }, [config.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${config.rotate}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
        {
          backgroundColor: config.color,
          width: config.size,
          height: config.size * config.aspect,
        },
      ]}
    />
  );
};

function createParticles(count: number, colors: string[]): ParticleConfig[] {
  return Array.from({ length: count }).map((_, index) => ({
    id: `${Date.now()}-${index}-${Math.random()}`,
    color: colors[index % colors.length],
    offsetX: randomBetween(-60, 60),
    offsetY: randomBetween(60, 140),
    delay: randomBetween(0, 150),
    duration: randomBetween(700, 1100),
    size: randomBetween(5, 9),
    aspect: randomBetween(0.6, 1.4),
    rotate: randomBetween(-90, 90),
  }));
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  particle: {
    borderRadius: 999,
  },
});

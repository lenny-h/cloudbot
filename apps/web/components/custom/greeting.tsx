"use client";

import * as m from "motion/react-m";

import { useUser } from "@workspace/ui/contexts/user-context";
import { LazyMotion } from "motion/react";
import { useMemo } from "react";

const loadFeatures = () => import("@/lib/features").then((res) => res.default);

const greetings = [
  {
    title: "Hello, {name}!",
    subtitle: "Ready to explore the unknown together?",
  },
  {
    title: "Hey there, {name}!",
    subtitle: "What brilliant idea shall we bring to life today?",
  },
  {
    title: "Welcome back, {name}!",
    subtitle: "Let's turn your thoughts into reality!",
  },
  {
    title: "Greetings, {name}!",
    subtitle: "Supercharge your creativity—I'm all ears!",
  },
  {
    title: "Good to see you, {name}!",
    subtitle: "Let's brew something extraordinary together!",
  },
];

export function Greeting() {
  const user = useUser();

  const greeting = useMemo(() => {
    // Select a greeting based on the day (consistent throughout the day)
    const dayIndex = new Date().getDay();
    return greetings[dayIndex % greetings.length];
  }, []);

  const userName = user.name || user.username || "friend";
  const title = greeting.title.replace("{name}", userName);

  return (
    <div className="mx-auto flex size-full max-w-3xl flex-col items-center justify-center gap-6 px-4 md:px-8">
      <LazyMotion features={loadFeatures}>
        <div className="flex -translate-y-16 transform flex-col items-center gap-3 text-center">
          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-foreground text-3xl font-bold md:text-4xl"
          >
            {title}
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted-foreground max-w-md text-lg md:text-xl"
          >
            {greeting.subtitle}
          </m.p>
        </div>
      </LazyMotion>
    </div>
  );
}

"use client";

import * as m from "motion/react-m";

import { useWebTranslations } from "@/contexts/web-translations";
import { useUser } from "@workspace/ui/contexts/user-context";
import { LazyMotion } from "motion/react";
import { useMemo } from "react";

const loadFeatures = () => import("@/lib/features").then((res) => res.default);

export function Greeting() {
  const user = useUser();
  const { webT } = useWebTranslations();

  const greeting = useMemo(() => {
    // Select a greeting based on the day (consistent throughout the day)
    const dayIndex = new Date().getDay();
    const { greetings } = webT.greeting;
    return greetings[dayIndex % greetings.length];
  }, [webT]);

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

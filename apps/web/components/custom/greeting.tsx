"use client";

import * as m from "motion/react-m";

import { useUser } from "@workspace/ui/contexts/user-context";
import { Brain, Coffee, Rocket, Sparkles, Zap } from "lucide-react";
import { useMemo } from "react";

const greetings = [
  {
    title: "Hello, {name}! 👋",
    subtitle: "Ready to explore the unknown together?",
    icon: Sparkles,
  },
  {
    title: "Hey there, {name}! ✨",
    subtitle: "What brilliant idea shall we bring to life today?",
    icon: Brain,
  },
  {
    title: "Welcome back, {name}! 🚀",
    subtitle: "Let's turn your thoughts into reality!",
    icon: Rocket,
  },
  {
    title: "Greetings, {name}! ⚡",
    subtitle: "Supercharge your creativity—I'm all ears!",
    icon: Zap,
  },
  {
    title: "Good to see you, {name}! ☕",
    subtitle: "Let's brew something extraordinary together!",
    icon: Coffee,
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
  const Icon = greeting.icon;

  return (
    <div className="mx-auto flex size-full max-w-3xl flex-col items-center justify-center gap-6 px-4 md:px-8">
      <m.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        <div className="bg-primary/10 rounded-full p-6">
          <Icon className="text-primary size-16" strokeWidth={1.5} />
        </div>
        <m.div
          className="bg-primary absolute -top-1 -right-1 size-4 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.3, duration: 0.4 }}
        />
      </m.div>

      <div className="flex flex-col items-center gap-3 text-center">
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

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-4 flex flex-wrap justify-center gap-2"
      >
        {[
          "💡 Brainstorm ideas",
          "📝 Write content",
          "🔍 Research topics",
          "🎨 Get creative",
        ].map((suggestion, index) => (
          <m.div
            key={suggestion}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
            className="bg-muted hover:bg-muted/80 text-muted-foreground cursor-default rounded-full px-4 py-2 text-sm transition-colors"
          >
            {suggestion}
          </m.div>
        ))}
      </m.div>
    </div>
  );
}

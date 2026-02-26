"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const SCROLL_SHOW_THRESHOLD = 80;
const SERVICES_IN_VIEW_THRESHOLD = 0.6;

export function HomeScrollFloating() {
  const [visible, setVisible] = useState(false);
  const [showUp, setShowUp] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const servicesEl = document.getElementById("services");

      if (scrollY < SCROLL_SHOW_THRESHOLD) {
        setVisible(false);
        return;
      }

      setVisible(true);

      if (servicesEl) {
        const rect = servicesEl.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * SERVICES_IN_VIEW_THRESHOLD;
        setShowUp(inView);
      } else {
        setShowUp(scrollY > 400);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    if (showUp) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        variant="secondary"
        size="icon"
        className="h-10 w-10 rounded-full shadow-lg border border-border/60 bg-background/95 backdrop-blur-sm hover:bg-accent"
        onClick={handleClick}
        aria-label={showUp ? "맨 위로" : "오늘 뭐 볼까? 섹션으로"}
      >
        {showUp ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
}

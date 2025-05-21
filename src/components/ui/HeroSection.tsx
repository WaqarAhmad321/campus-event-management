
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="bg-gradient-to-r from-primary via-primary/90 to-secondary/80 text-primary-foreground py-16 md:py-20 rounded-lg shadow-lg text-center"
      id="hero-section" // Changed from events-section for clarity
    >
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4"> {/* Applied font-heading */}
          PUCIT Now
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          Discover, create, and engage with the vibrant life of our university. Your central place for all campus happenings.
        </p>
        <Button
          size="lg"
          variant="default" // Use default (primary) or secondary
          className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-lg" // Using accent for CTA
          // asChild prop removed for diagnostics
        >
          {/* The Link component will now be rendered as a child *inside* the button, not replacing it */}
          <Link href="/#events">Explore Events</Link> {/* Ensure there is an element with id="events" on the page */}
        </Button>
      </div>
    </section>
  );
}

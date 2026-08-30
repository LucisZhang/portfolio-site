"use client";

import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import { siteMetadata } from "@/lib/site-config";
import AgentSystemsExhibit from "./AgentSystemsExhibit";
import FlagshipExhibit from "./FlagshipExhibit";
import Hero, { type HeroVariant } from "./Hero";
import "./home.css";
import NegativeRunsExhibit from "./NegativeRunsExhibit";
import ReceiptsExhibit from "./ReceiptsExhibit";
import ShelfExhibit from "./ShelfExhibit";
import StackExhibit from "./StackExhibit";

// Round-2 homepage: seven exhibits, background rhythm paper -> ink -> paper
// -> white -> ink -> paper -> ink (spec §4). Each exhibit is its own file
// (task 1.2 brief) reading only src/data/generated/home-stats.json (task
// 1.1) and src/data/generated/home-receipts.json (this task) for numbers —
// nothing here is a literal benchmark figure.
export default function HomePage({ heroVariant }: { heroVariant: HeroVariant }) {
  return (
    <div>
      <LocaleDocumentMetadata title={siteMetadata.title} description={siteMetadata.description} />
      <Hero variant={heroVariant} />
      <FlagshipExhibit />
      <AgentSystemsExhibit />
      <StackExhibit />
      <NegativeRunsExhibit />
      <ShelfExhibit />
      <ReceiptsExhibit />
    </div>
  );
}

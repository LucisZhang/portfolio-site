import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import { getHomeQuestions } from "@/lib/ask-question-bank";
import { homepageProjects, routableProjects, tracks } from "@/lib/projects";
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
  // Send only the catalog fields these exhibits render. The complete project
  // reports stay in their routes and in the palette's on-demand catalog.
  const projects = homepageProjects.map(({ slug, track, tier, title, glossZh, summary, metrics }) =>
    ({ slug, track, tier, title, glossZh, summary, metrics }));
  const stackProjects = routableProjects.map(({ slug, track, title }) => ({ slug, track, title }));
  return (
    // Task D-01: the wrapper carries the homepage's exhibition-rhythm scope
    // (home.css `.home-exhibits`) so the desktop screen-height model applies
    // only to these seven exhibits, not to every route's `.exhibit`.
    <div className="home-exhibits">
      <LocaleDocumentMetadata title={siteMetadata.title} description={siteMetadata.description} />
      <Hero variant={heroVariant} />
      <FlagshipExhibit project={projects.find((project) => project.tier === "flagship")} />
      <AgentSystemsExhibit projects={projects} questions={{ en: getHomeQuestions("en"), zh: getHomeQuestions("zh") }} />
      <StackExhibit projects={stackProjects} thesis={tracks.find((track) => track.id === "engineering")?.thesis} />
      <NegativeRunsExhibit />
      <ShelfExhibit projects={projects} />
      <ReceiptsExhibit />
    </div>
  );
}

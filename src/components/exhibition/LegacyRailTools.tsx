import { featuredProjects, tracks } from "@/lib/projects";
import LegacyRailToolsClient from "./LegacyRailToolsClient";
export default function LegacyRailTools() { return <LegacyRailToolsClient projects={featuredProjects} tracks={tracks} />; }

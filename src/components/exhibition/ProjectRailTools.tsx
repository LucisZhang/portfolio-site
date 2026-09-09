import { featuredProjects, tracks } from "@/lib/projects";
import ProjectRailToolsClient from "./ProjectRailToolsClient";
export default function ProjectRailTools() { return <ProjectRailToolsClient projects={featuredProjects} tracks={tracks} />; }

import type { MetadataRoute } from "next";
import { routableProjects } from "@/lib/projects";

const SITE_ORIGIN = "https://xiangguozhang.com";
const RETIRED_PROJECT_ROUTES = new Set(["/projects/analytics-tandem"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const projectRoutes = routableProjects
    .map((project) => `/projects/${project.slug}`)
    .filter((route) => !RETIRED_PROJECT_ROUTES.has(route));

  return ["/", ...projectRoutes, "/artifact"].map((route) => ({
    url: new URL(route, SITE_ORIGIN).href,
  }));
}

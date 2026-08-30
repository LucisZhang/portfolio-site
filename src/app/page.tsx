import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import { homeRail } from "@/components/home/homeRail";
import HomeRailTools from "@/components/home/HomeRailTools";
import HomePage from "@/components/home/HomePage";
import type { HeroVariant } from "@/components/home/Hero";

function heroVariant(value: string | string[] | undefined): HeroVariant {
  const requested = Array.isArray(value) ? value[0] : value;
  return requested === "a" || requested === "b" || requested === "c" ? requested : "a";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    // Task W3 (RAIL-SCOPE.md verdict "太空" -- the collapsed-state hero has
    // no right-column content to fill the freed width): stays on
    // ExhibitShell's default `mode="fixed"`, exempt from auto-rail v3.
    <ExhibitShell rail={homeRail} railTools={<HomeRailTools />}>
      <HomePage heroVariant={heroVariant(params.hero)} />
    </ExhibitShell>
  );
}

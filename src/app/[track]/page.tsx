import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TrackPageView from "@/components/TrackPageView";
import { getTrack, isTrackId, tracks } from "@/lib/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return tracks.map((track) => ({ track: track.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }): Promise<Metadata> {
  const { track: trackId } = await params;
  if (!isTrackId(trackId)) return {};
  const track = getTrack(trackId);
  return track ? { title: `${track.label.en} | Xiangguo Zhang`, description: track.thesis.en } : {};
}

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  if (!isTrackId(track)) notFound();
  return <TrackPageView trackId={track} />;
}

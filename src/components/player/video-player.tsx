"use client";

import { getVideoEmbedUrl } from "@/lib/utils";

export function VideoPlayer({ url }: { url: string }) {
  const embed = getVideoEmbedUrl(url);

  if (embed.type === "direct") {
    return (
      <video
        controls
        controlsList="nodownload"
        className="aspect-video w-full rounded-lg bg-black"
        src={embed.src}
      />
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={embed.src}
        title="Video de la lección"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

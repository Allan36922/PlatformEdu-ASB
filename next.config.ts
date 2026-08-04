import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Los thumbnails viven en Supabase Storage (dominio propio del proyecto) o
    // en URLs externas que el instructor pegue; se permite cualquier host HTTPS
    // porque el dominio de Supabase Storage varía por proyecto/usuario.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;

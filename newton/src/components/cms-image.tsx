import { getMediaAlt } from "@/lib/content";
import { AssetImage } from "./asset-image";
export async function CMSImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <AssetImage
      src={src}
      alt={await getMediaAlt(src, alt)}
      className={className}
    />
  );
}

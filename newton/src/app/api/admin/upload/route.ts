import sharp from "sharp";
import sanitize from "sanitize-html";
import { randomUUID } from "node:crypto";
import { authorize, audit, HttpError, errorResponse } from "@/lib/auth";
import { putObject } from "@/lib/storage";
import { query } from "@/lib/db";
import { boundedBody } from "@/lib/request";
export async function POST(req: Request) {
  try {
    const u = await authorize(req);
    if (Number(req.headers.get("content-length") || 0) > 6 * 1024 * 1024)
      throw new HttpError(413, "Maximum upload size is 5 MB.");
    const body = await boundedBody(req, 6 * 1024 * 1024);
    const form = await new Response(body.buffer as ArrayBuffer, {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      file.size === 0
    )
      throw new HttpError(400, "Choose an image up to 5 MB.");
    if (
      !["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(
        file.type,
      )
    )
      throw new HttpError(400, "Use JPG, PNG, WebP, or SVG.");
    let bytes = Buffer.from(await file.arrayBuffer());
    if (file.type === "image/svg+xml") {
      const source = bytes.toString("utf8");
      if (
        /<!ENTITY|<!DOCTYPE|href\s*=|url\s*\(|<script|<foreignObject|<image|<use/i.test(
          source,
        )
      )
        throw new HttpError(
          400,
          "SVGs must contain only self-contained vector shapes. Remove scripts, external references, and embedded content.",
        );
      const clean = sanitize(source, {
        allowedTags: [
          "svg",
          "g",
          "path",
          "rect",
          "circle",
          "ellipse",
          "line",
          "polyline",
          "polygon",
          "title",
          "desc",
        ],
        allowedAttributes: {
          "*": [
            "fill",
            "stroke",
            "stroke-width",
            "d",
            "x",
            "y",
            "x1",
            "y1",
            "x2",
            "y2",
            "cx",
            "cy",
            "r",
            "rx",
            "ry",
            "width",
            "height",
            "points",
            "transform",
            "opacity",
            "viewBox",
            "xmlns",
          ],
        },
        parser: { lowerCaseAttributeNames: false, lowerCaseTags: false },
      });
      bytes = Buffer.from(clean);
    }
    const image = sharp(bytes, { limitInputPixels: 40_000_000 });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp", "svg"].includes(metadata.format || ""))
      throw new HttpError(
        400,
        "Image content does not match a supported format.",
      );
    const output = await image
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88 })
      .toBuffer();
    const id = randomUUID(),
      key = `media/${id}.webp`,
      url = await putObject(key, output, "image/webp");
    const alt = String(form.get("alt") || "").slice(0, 250);
    await query(
      "INSERT INTO media_assets(id,name,url,object_key,alt,mime,size) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [id, file.name.slice(0, 250), url, key, alt, "image/webp", output.length],
    );
    await audit(u.user_id, "uploaded", "media", id);
    return Response.json({ ok: true, url, id });
  } catch (e) {
    return errorResponse(e);
  }
}

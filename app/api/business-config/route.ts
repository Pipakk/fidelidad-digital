import { NextResponse } from "next/server";
import { ConfigService } from "@/lib/config/ConfigService";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") || "";

  if (!slug) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { business, config, issues } = await ConfigService.getConfig(slug);
  if (!business) return NextResponse.json({ error: config.texts.api.bar_not_found }, { status: 404 });

  // Public payload (no secrets): config + minimal branding/business identifiers.
  return NextResponse.json({
    business: { id: business.id, slug: business.slug, name: business.name, logo_url: business.logo_url },
    config,
    issues,
  });
}


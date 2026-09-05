import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const term = `${q} physiotherapy OR physical therapy OR rehabilitation`;
  const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("retmode", "json");
  url.searchParams.set("retmax", "5");
  url.searchParams.set("term", term);

  try {
    const search = await fetch(url.toString(), { next: { revalidate: 3600 } });
    const data = (await search.json()) as { esearchresult?: { idlist?: string[] } };
    const ids = data.esearchresult?.idlist ?? [];
    if (ids.length === 0) return NextResponse.json({ results: [] });

    const summaryUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
    summaryUrl.searchParams.set("db", "pubmed");
    summaryUrl.searchParams.set("retmode", "json");
    summaryUrl.searchParams.set("id", ids.join(","));
    const summary = await fetch(summaryUrl.toString(), { next: { revalidate: 3600 } });
    const sum = (await summary.json()) as {
      result?: Record<string, { title?: string; authors?: { name: string }[]; source?: string; pubdate?: string; uid?: string }>;
    };

    const results = ids.map((id) => {
      const r = sum.result?.[id];
      return {
        pmid: id,
        title: r?.title ?? "Sin título",
        authors: (r?.authors ?? []).slice(0, 3).map((a) => a.name).join(", "),
        source: r?.source ?? "PubMed",
        year: r?.pubdate?.slice(0, 4) ?? "",
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      };
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "No se pudo consultar PubMed" }, { status: 502 });
  }
}

/**
 * Injeta um bloco de dados estruturados (JSON-LD, schema.org) no HTML.
 * Renderizado no servidor; seguro pois a origem dos dados é o próprio catálogo.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

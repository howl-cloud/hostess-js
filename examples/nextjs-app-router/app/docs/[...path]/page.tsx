export default async function Docs({ params }: { params: { path: string[] } }) {
  return (
    <main>
      <h1>Docs: {params.path.join(" / ")}</h1>
      <p>This catch-all route reports as the template /docs/[...path].</p>
    </main>
  );
}

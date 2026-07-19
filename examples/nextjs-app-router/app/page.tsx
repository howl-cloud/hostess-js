import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Hostess — App Router example</h1>
      <ul>
        <li>
          <Link href="/blog/hello-world">/blog/hello-world (→ /blog/[slug])</Link>
        </li>
        <li>
          <Link href="/docs/getting/started">/docs/getting/started (→ /docs/[...path])</Link>
        </li>
      </ul>
    </main>
  );
}

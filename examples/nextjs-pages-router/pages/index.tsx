import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Hostess — Pages Router example</h1>
      <ul>
        <li>
          <Link href="/blog/hello-world">/blog/hello-world (→ /blog/[slug])</Link>
        </li>
      </ul>
    </main>
  );
}

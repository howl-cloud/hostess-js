import { useRouter } from "next/router";

export default function BlogPost() {
  const { query } = useRouter();
  return (
    <main>
      <h1>Blog post: {String(query.slug ?? "")}</h1>
      <p>This route reports as the template /blog/[slug] (free from router.route).</p>
    </main>
  );
}

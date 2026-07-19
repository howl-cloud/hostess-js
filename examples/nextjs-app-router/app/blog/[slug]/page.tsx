export default async function BlogPost({ params }: { params: { slug: string } }) {
  return (
    <main>
      <h1>Blog post: {params.slug}</h1>
      <p>This route reports as the template /blog/[slug].</p>
    </main>
  );
}

import Link from "next/link";
export default function NotFound() {
  return (
    <main className="container empty-state">
      <span className="eyebrow">PAGE NOT FOUND</span>
      <h1>Let’s get you back on track.</h1>
      <Link className="button" href="/">
        Back to home
      </Link>
    </main>
  );
}

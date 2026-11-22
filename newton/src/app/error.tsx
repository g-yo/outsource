"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container empty-state">
      <h1>Something didn’t load.</h1>
      <p>
        Please try again. If the issue continues, contact the site
        administrator.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { identity } from "@/lib/auth";
import { Login } from "@/components/login";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false },
};
export default async function LoginPage() {
  if (await identity()) redirect("/admin/dashboard");
  return (
    <main className="login-page">
      <Link className="brand" href="/">
        <span className="brand-symbol">n</span>
        <span>
          newTon<small>TECHNOLOGY</small>
        </span>
      </Link>
      <Login />
      <Link className="login-back" href="/">
        Back to website
      </Link>
    </main>
  );
}

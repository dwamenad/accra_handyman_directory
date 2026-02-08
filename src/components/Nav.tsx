import Link from "next/link";
import { getSession } from "@/lib/auth";

export async function Nav() {
  const session = await getSession();
  const user = session?.user;

  return (
    <header className="nav-wrap">
      <nav className="container nav">
        <Link href="/" className="brand">
          Accra Handyman
        </Link>
        <div className="nav-links">
          <Link href="/search">Find</Link>
          {!user && <Link href="/auth/login">Login</Link>}
          {!user && <Link href="/auth/signup-handyman">Join as Handyman</Link>}
          {user?.role === "HANDYMAN" && <Link href="/dashboard">Dashboard</Link>}
          {user?.role === "ADMIN" && <Link href="/admin">Admin</Link>}
          {user && (
            <form action="/api/auth/logout" method="post">
              <button className="linklike">Logout</button>
            </form>
          )}
        </div>
      </nav>
    </header>
  );
}

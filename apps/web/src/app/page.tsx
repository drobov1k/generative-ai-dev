import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Document Q&amp;A</h1>
        <p style={styles.welcome}>
          Welcome, <strong>{session.user?.name ?? session.user?.email}</strong>
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" style={styles.button}>
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "8px",
    padding: "40px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center" as const,
    minWidth: "320px",
  },
  heading: {
    margin: "0 0 16px",
    fontSize: "1.5rem",
    color: "#111",
  },
  welcome: {
    margin: "0 0 24px",
    color: "#444",
    fontSize: "1rem",
  },
  button: {
    padding: "10px 24px",
    fontSize: "0.9rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer",
    color: "#374151",
  },
} as const;

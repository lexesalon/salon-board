"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SalonBoard from "./SalonBoard";
import OwnerDashboard from "./OwnerDashboard";

export default function AppClient({ initialSession }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/sales")
      .then(r => r.json())
      .then(json => { if (json.ok) setData(json); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", gap:12, color:"#aaa" }}>
      <div style={{ fontSize:28 }}>✂️</div>
      <div style={{ fontSize:14 }}>読み込み中…</div>
    </div>
  );

  if (initialSession.role === "owner") {
    return <OwnerDashboard allSales={data?.data || []} session={initialSession} onLogout={logout} />;
  }

  return (
    <SalonBoard
      initialSales={data?.data || []}
      session={initialSession}
      onLogout={logout}
    />
  );
}

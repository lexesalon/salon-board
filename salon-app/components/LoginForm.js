"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = async () => {
    if (!username || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push("/");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const inp = { border:"1px solid #EDE8E1", borderRadius:8, padding:"12px 14px", fontSize:15, color:"#1A1A2E", background:"#FAFAF8", width:"100%", fontFamily:"'Noto Sans JP',sans-serif" };

  return (
    <div style={{ minHeight:"100vh", background:"#F7F3EE", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:360 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:36, marginBottom:12 }}>✂️</div>
          <h1 style={{ fontFamily:"'Noto Serif JP',serif", fontSize:24, fontWeight:600, letterSpacing:"0.1em", color:"#1A1A2E" }}>サロンボード</h1>
          <div style={{ fontSize:12, color:"#aaa", marginTop:6, letterSpacing:"0.06em" }}>スタッフログイン</div>
        </div>

        <div style={{ background:"#fff", borderRadius:16, padding:28, border:"1px solid #EDE8E1" }}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, letterSpacing:"0.08em", color:"#888", textTransform:"uppercase", display:"block", marginBottom:6 }}>ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key==="Enter" && login()}
              placeholder="例: yuki"
              style={inp}
              autoCapitalize="none"
            />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:11, letterSpacing:"0.08em", color:"#888", textTransform:"uppercase", display:"block", marginBottom:6 }}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key==="Enter" && login()}
              placeholder="••••••••"
              style={inp}
            />
          </div>
          {error && <div style={{ fontSize:12, color:"#e55", marginBottom:16, textAlign:"center" }}>{error}</div>}
          <button
            onClick={login}
            disabled={loading || !username || !password}
            style={{ width:"100%", padding:14, background: loading||!username||!password ? "#ccc" : "#1A1A2E", color:"#fff", border:"none", borderRadius:8, fontSize:15, letterSpacing:"0.08em", cursor: loading||!username||!password ? "not-allowed" : "pointer", fontFamily:"'Noto Sans JP',sans-serif" }}
          >
            {loading ? "ログイン中…" : "ログイン"}
          </button>
        </div>
      </div>
    </div>
  );
}

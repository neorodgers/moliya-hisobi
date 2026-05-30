import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SUPABASE_URL = "https://oijdhlvuhliupmlqrkza.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pamRobHZ1aGxpdXBtbHFya3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzQ2NTMsImV4cCI6MjA5NTY1MDY1M30.81QxJWGU6s-7X5L4TxFqNmgYYcj2eIVOtoynH2aSFhY";

const CATEGORIES = ["Oziq-ovqat", "Transport", "Uy-joy", "Kiyim", "Sog'liq", "Ta'lim", "Ko'ngilochar", "Boshqa"];
const TYPES = ["Naqd", "Plastik karta", "O'tkazma"];
const COLORS = ["#f97316","#3b82f6","#22c55e","#a855f7","#ec4899","#14b8a6","#f59e0b","#6b7280"];

const formatNum = (n) => Number(n).toLocaleString("uz-UZ") + " so'm";
const today = () => new Date().toISOString().split("T")[0];

async function dbGet() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*&order=created_at.desc`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
  });
  return res.json();
}

async function dbAdd(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(row)
  });
  return res.json();
}

async function dbDelete(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/transactions?id=eq.${id}`, {
    method: "DELETE",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
  });
}

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("home");
  const [form, setForm] = useState({ sana: today(), tavsif: "", kategoriya: CATEGORIES[0], miqdor: "", turi: TYPES[0], son: "1" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    dbGet().then(data => {
      setTransactions(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const addTransaction = async (type) => {
    if (!form.miqdor || isNaN(form.miqdor) || Number(form.miqdor) <= 0) {
      setMsg("❌ Miqdorni to'g'ri kiriting!"); return;
    }
    setSaving(true);
    const row = {
      type, sana: form.sana,
      tavsif: form.tavsif || (type === "chiqim" ? "Chiqim" : "Kirim"),
      kategoriya: form.kategoriya, miqdor: Number(form.miqdor), turi: form.turi, son: Number(form.son) || 1,
    };
    const result = await dbAdd(row);
    if (Array.isArray(result) && result[0]) {
      setTransactions(prev => [result[0], ...prev]);
      setForm({ sana: today(), tavsif: "", kategoriya: CATEGORIES[0], miqdor: "", turi: TYPES[0], son: "1" });
      setMsg(type === "chiqim" ? "✅ Chiqim saqlandi!" : "✅ Kirim saqlandi!");
      setTimeout(() => setMsg(""), 2500);
    } else {
      setMsg("❌ Xatolik! Qaytadan urinib ko'ring.");
    }
    setSaving(false);
  };

  const deleteTransaction = async (id) => {
    await dbDelete(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const stats = useMemo(() => {
    const kirim = transactions.filter(t => t.type === "kirim").reduce((s, t) => s + Number(t.miqdor) * Number(t.son), 0);
    const chiqim = transactions.filter(t => t.type === "chiqim").reduce((s, t) => s + Number(t.miqdor) * Number(t.son), 0);
    return { kirim, chiqim, balans: kirim - chiqim };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "chiqim").forEach(t => {
      map[t.kategoriya] = (map[t.kategoriya] || 0) + Number(t.miqdor) * Number(t.son);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const m = t.sana?.slice(0, 7) || "N/A";
      if (!map[m]) map[m] = { oy: m, kirim: 0, chiqim: 0 };
      map[m][t.type] += Number(t.miqdor) * Number(t.son);
    });
    return Object.values(map).sort((a, b) => a.oy.localeCompare(b.oy));
  }, [transactions]);

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#0d0d1a", minHeight: "100vh", color: "white" }}>
      <div style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1a40 50%, #001a1a 100%)", borderBottom: "1px solid #2d2d4e", padding: "20px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, background: "linear-gradient(90deg, #a78bfa, #60a5fa, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>💰 Moliya Hisobchisi</h1>
          <p style={{ margin: "4px 0 16px", color: "#6b7280", fontSize: 13 }}>☁ Barcha ma'lumotlar doimiy saqlanadi</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[{label:"Kirim",val:stats.kirim,color:"#22c55e",icon:"📈"},{label:"Chiqim",val:stats.chiqim,color:"#f97316",icon:"📉"},{label:"Balans",val:stats.balans,color:stats.balans>=0?"#60a5fa":"#f43f5e",icon:"💎"}].map(({label,val,color,icon})=>(
              <div key={label} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${color}33`,borderRadius:16,padding:"14px 16px"}}>
                <div style={{fontSize:11,color:"#9ca3af",marginBottom:4}}>{icon} {label}</div>
                <div style={{fontSize:15,fontWeight:700,color}}>{formatNum(val)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {["home","kirim","chiqim","hisobot"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{padding:"8px 18px",borderRadius:50,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",background:mode===m?(m==="kirim"?"#22c55e":m==="chiqim"?"#f97316":m==="hisobot"?"#6c63ff":"#374151"):"rgba(255,255,255,0.07)",color:mode===m?"#fff":"#9ca3af"}}>
                {m==="home"?"🏠 Asosiy":m==="kirim"?"➕ Kirim":m==="chiqim"?"➖ Chiqim":"📊 Hisobot"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {msg&&<div style={{background:msg.includes("❌")?"#1a0505":"#052e16",border:`1px solid ${msg.includes("❌")?"#f43f5e":"#22c55e"}`,borderRadius:12,padding:"12px 16px",marginBottom:16,color:msg.includes("❌")?"#fca5a5":"#86efac",fontSize:14}}>{msg}</div>}
        {mode==="home"&&(
          <div>
            <h2 style={{fontSize:18,color:"#e2e8f0",marginBottom:16}}>📋 So'nggi tranzaksiyalar</h2>
            {loading?<div style={{textAlign:"center",padding:"60px 20px",color:"#6b7280"}}><div style={{fontSize:36,marginBottom:12}}>⏳</div><p>Yuklanmoqda...</p></div>:transactions.length===0?<div style={{textAlign:"center",padding:"60px 20px",color:"#4b5563"}}><div style={{fontSize:48,marginBottom:12}}>📂</div><p>Hali tranzaksiya yo'q.</p></div>:(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {transactions.map(t=>(
                  <div key={t.id} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${t.type==="kirim"?"#22c55e33":"#f9731633"}`,borderRadius:14,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:14,color:"#e2e8f0"}}>{t.tavsif}</div>
                      <div style={{fontSize:12,color:"#6b7280",marginTop:3}}>📅 {t.sana} · 🏷️ {t.kategoriya} · 💳 {t.turi} · ×{t.son}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:700,fontSize:15,color:t.type==="kirim"?"#22c55e":"#f97316"}}>{t.type==="kirim"?"+":"-"}{formatNum(Number(t.miqdor)*Number(t.son))}</div>
                      <button onClick={()=>deleteTransaction(t.id)} style={{background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:12,marginTop:4}}>🗑️ O'chirish</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {(mode==="kirim"||mode==="chiqim")&&(
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid #2d2d4e",borderRadius:20,padding:24}}>
            <h2 style={{fontSize:18,marginBottom:20,color:mode==="kirim"?"#22c55e":"#f97316"}}>{mode==="kirim"?"➕ Kirim qo'shish":"➖ Chiqim qo'shish"}</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div><label style={{display:"block",fontSize:11,fontWeight:600,color:"#9ca3af",marginBottom:6,textTransform:"uppercase"}}>📅 Sana</label><input type="date" value={form.sana} onChange={e=>setForm(p=>({...p,sana:e.target.value}))} style={{width:"100%",background:"#1a1a2e",border:"1px solid #2d2d4e",borderRadius:12,padding:"12px 16px",color:"white",fontSize:14,outline:"none",boxSizing:"border-box"}}/></div>
              <div><label style={{display:"block",fontSize:11,fontWeight:600,color:"#9ca3af",marginBottom:6,textTransform:"uppercase"}}>💰 Miqdor</label><input type="number" placeholder="0" value={form.miqdor} onChange={e=>setForm(p=>({...p,miqdor:e.target.value}))} style={{width:"100%",background:"#1a1a2e",border:"1px solid #2d2d4e",borderRadius:12,padding:"12px 16px",color:"white",fontSize:14,outline:"none",boxSizing:"border-box"}}/></div>
              <div style={{gridColumn:"1 / -1"}}><label style={{display:"block",fontSize:11,fontWeight:600,color:"#9ca3af",marginBottom:6,textTransform:"uppercase"}}>📝 Tavsif</label><input type="text" placeholder="Masalan: Bozordan sabzavot" value={form.tavsif} onChange={e=>setForm(p=>({...p,tavsif:e.target.value}))} style={{width:"100%",background:"#1a1a2e",border:"1px solid #2d2d4e",borderRadius:12,padding:"12px 16px",color:"white",fontSize:14,outline:"none",boxSizing:"border-box"}}/></div>
              <div><label style={{display:"block",fontSize:11,fontWeight:600,color:"#9ca3af",marginBottom:6,textTransform:"uppercase"}}>🏷️ Kategoriya</label><select value={form.kategoriya} onChange={e=>setForm(p=>({...p,kategoriya:e.target.value}))} style={{width:"100%",background:"#1a1a2e",border:"1px solid #2d2d4e",borderRadius:12,padding:"12px 16px",color:"white",fontSize:14,outline:"none",boxSizing:"border-box"}}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label style={{display:"block",fontSize:11,fontWeight:600,color:"#9ca3af",marginBottom:6,textTransform:"uppercase"}}>💳 Turi</label><select value={form.turi} onChange={e=>setForm(p=>({...p,turi:e.target.value}))} style={{width:"100%",background:"#1a1a2e",border:"1px solid #2d2d4e",borderRadius:12,padding:"12px 16px",color:"white",fontSize:14,outline:"none",boxSizing:"border-box"}}>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
              <div><label style={{display:"block",fontSize:11,fontWeight:600,color:"#9ca3af",marginBottom:6,textTransform:"uppercase"}}>🔢 Son</label><input type="number" min="1" value={form.son} onChange={e=>setForm(p=>({...p,son:e.target.value}))} style={{width:"100%",background:"#1a1a2e",border:"1px solid #2d2d4e",borderRadius:12,padding:"12px 16px",color:"white",fontSize:14,outline:"none",boxSizing:"border-box"}}/></div>
            </div>
            <button onClick={()=>addTransaction(mode)} disabled={saving} style={{marginTop:20,width:"100%",padding:"14px",borderRadius:14,border:"none",cursor:saving?"not-allowed":"pointer",fontSize:15,fontWeight:700,background:saving?"#374151":mode==="kirim"?"linear-gradient(135deg,#22c55e,#16a34a)":"linear-gradient(135deg,#f97316,#ea580c)",color:"white",opacity:saving?0.7:1}}>
              {saving?"⏳ Saqlanmoqda...":mode==="kirim"?"✅ Kirimni saqlash":"✅ Chiqimni saqlash"}
            </button>
          </div>
        )}
        {mode==="hisobot"&&(
          <div>
            <h2 style={{fontSize:18,color:"#a78bfa",marginBottom:20}}>📊 Moliyaviy Hisobot</h2>
            {transactions.length===0?<div style={{textAlign:"center",padding:"60px 20px",color:"#4b5563"}}><div style={{fontSize:48,marginBottom:12}}>📊</div><p>Hisobot uchun avval kirim/chiqim qo'shing!</p></div>:(
              <>
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid #2d2d4e",borderRadius:16,overflow:"hidden",marginBottom:24}}>
                  <div style={{padding:"14px 20px",borderBottom:"1px solid #2d2d4e",fontWeight:700,color:"#e2e8f0"}}>📋 Batafsil jadval</div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead><tr style={{background:"rgba(255,255,255,0.05)"}}>{["Sana","Tavsif","Kategoriya","Turi","Son","Miqdor","Jami","Tur"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",color:"#9ca3af",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                      <tbody>{transactions.map((t,i)=><tr key={t.id} style={{borderTop:"1px solid #1f2937",background:i%2===0?"transparent":"rgba(255,255,255,0.02)"}}><td style={{padding:"10px 12px",color:"#d1d5db",whiteSpace:"nowrap"}}>{t.sana}</td><td style={{padding:"10px 12px",color:"#e2e8f0"}}>{t.tavsif}</td><td style={{padding:"10px 12px",color:"#a78bfa"}}>{t.kategoriya}</td><td style={{padding:"10px 12px",color:"#60a5fa"}}>{t.turi}</td><td style={{padding:"10px 12px",color:"#fbbf24",textAlign:"center"}}>{t.son}</td><td style={{padding:"10px 12px",color:"#d1d5db",whiteSpace:"nowrap"}}>{formatNum(t.miqdor)}</td><td style={{padding:"10px 12px",fontWeight:700,whiteSpace:"nowrap",color:t.type==="kirim"?"#22c55e":"#f97316"}}>{formatNum(Number(t.miqdor)*Number(t.son))}</td><td style={{padding:"10px 12px"}}><span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:t.type==="kirim"?"#052e16":"#431407",color:t.type==="kirim"?"#86efac":"#fed7aa"}}>{t.type==="kirim"?"↑ Kirim":"↓ Chiqim"}</span></td></tr>)}</tbody>
                    </table>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
                  {categoryData.length>0&&<div style={{background:"rgba(255,255,255,0.03)",border:"1px solid #2d2d4e",borderRadius:16,padding:20}}><div style={{fontWeight:700,marginBottom:16,color:"#e2e8f0",fontSize:14}}>🥧 Kategoriyalar</div><ResponsiveContainer width="100%" height={180}><PieChart><Pie data={categoryData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({percent})=>`${(percent*100).toFixed(0)}%`} fontSize={10}>{categoryData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v)=>formatNum(v)}/></PieChart></ResponsiveContainer></div>}
                  {monthlyData.length>0&&<div style={{background:"rgba(255,255,255,0.03)",border:"1px solid #2d2d4e",borderRadius:16,padding:20}}><div style={{fontWeight:700,marginBottom:16,color:"#e2e8f0",fontSize:14}}>📅 Oylik</div><ResponsiveContainer width="100%" height={180}><BarChart data={monthlyData}><XAxis dataKey="oy" tick={{fill:"#6b7280",fontSize:10}}/><YAxis tick={{fill:"#6b7280",fontSize:10}} tickFormatter={v=>(v/1000000).toFixed(1)+"M"}/><Tooltip formatter={(v)=>formatNum(v)}/><Legend/><Bar dataKey="kirim" fill="#22c55e" radius={[4,4,0,0]} name="Kirim"/><Bar dataKey="chiqim" fill="#f97316" radius={[4,4,0,0]} name="Chiqim"/></BarChart></ResponsiveContainer></div>}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

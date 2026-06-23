"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function billingKey(dateStr) {
  const d = dateStr ? new Date(dateStr+"T00:00:00") : new Date();
  if (d.getDate()>=26) {
    const y=d.getMonth()===11?d.getFullYear()+1:d.getFullYear();
    const m=d.getMonth()===11?1:d.getMonth()+2;
    return `${y}-${String(m).padStart(2,"0")}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function periodLabel(key) {
  const [y,m]=key.split("-").map(Number);
  const prev=m===1?12:m-1,prevY=m===1?y-1:y;
  return `${prevY}年${prev}月26日 〜 ${y}年${m}月25日`;
}
function todayStr() {
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmt(n){ return "¥"+Number(n).toLocaleString(); }

export default function OwnerDashboard({ allSales, session, onLogout }) {
  const [tab, setTab] = useState("summary");
  const today = todayStr();
  const currentPeriod = billingKey();

  const periodSales = allSales.filter(r=>billingKey(r.date)===currentPeriod);
  const todaySales  = allSales.filter(r=>r.date===today);

  // スタッフ別集計
  const staffNames = [...new Set(allSales.map(r=>r.staffName))].filter(Boolean);
  const staffStats = staffNames.map(name => {
    const pSales = periodSales.filter(r=>r.staffName===name);
    const tSales = todaySales.filter(r=>r.staffName===name);
    return {
      name,
      periodTotal: pSales.reduce((s,r)=>s+r.amount,0),
      periodCount: pSales.length,
      todayTotal: tSales.reduce((s,r)=>s+r.amount,0),
      todayCount: tSales.length,
    };
  }).sort((a,b)=>b.periodTotal-a.periodTotal);

  const grandTotal = periodSales.reduce((s,r)=>s+r.amount,0);
  const grandToday = todaySales.reduce((s,r)=>s+r.amount,0);
  const sumBy=(list,type)=>list.filter(r=>(r.payment||"現金")===type).reduce((s,r)=>s+r.amount,0);

  // 日別グラフ
  const dailyData=(()=>{
    const map={};
    periodSales.forEach(r=>{ map[r.date]=(map[r.date]||0)+r.amount; });
    return [...new Set(periodSales.map(r=>r.date))].sort().map(d=>({label:d.slice(5).replace("-","/"),売上:map[d]||0}));
  })();

  const now=new Date(),days=["日","月","火","水","木","金","土"];
  const dateLabel=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日（${days[now.getDay()]}）`;
  const pill=(a)=>({fontSize:11,padding:"5px 14px",borderRadius:20,border:`1px solid ${a?"#1A1A2E":"#EDE8E1"}`,background:a?"#1A1A2E":"#fff",color:a?"#fff":"#888",cursor:"pointer",letterSpacing:"0.04em",fontFamily:"'Noto Sans JP',sans-serif"});

  return (
    <div style={{background:"#F7F3EE",minHeight:"100vh",paddingBottom:80}}>
      <div style={{padding:"28px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <h1 style={{fontFamily:"'Noto Serif JP',serif",fontSize:20,fontWeight:600,letterSpacing:"0.1em"}}>オーナー画面</h1>
          <div style={{fontSize:12,color:"#aaa",marginTop:2}}>{dateLabel}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
          <div style={{fontSize:11,color:"#C9A84C",fontWeight:500}}>👑 オーナー</div>
          <button onClick={onLogout} style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:"1px solid #EDE8E1",background:"#fff",color:"#888",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>ログアウト</button>
        </div>
      </div>
      <div style={{fontSize:11,color:"#C9A84C",letterSpacing:"0.08em",padding:"6px 20px 20px"}}>{periodLabel(currentPeriod)}</div>

      {/* タブ */}
      <div style={{display:"flex",gap:8,padding:"0 20px",marginBottom:20}}>
        {[["summary","サマリー"],["staff","スタッフ別"],["graph","グラフ"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={pill(tab===k)}>{l}</button>
        ))}
      </div>

      {tab==="summary"&&(
        <div style={{padding:"0 20px"}}>
          {/* 全体売上 */}
          <div style={{background:"#1A1A2E",borderRadius:12,padding:"18px 20px",color:"#fff",marginBottom:12}}>
            <div style={{fontSize:10,letterSpacing:"0.1em",color:"#C9A84C",marginBottom:10,textTransform:"uppercase"}}>月間売上合計（全スタッフ）</div>
            <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:28,fontWeight:600,marginBottom:10}}>{fmt(grandTotal)}</div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:"#4A7C59"}}/><span style={{fontSize:11,color:"#aaa"}}>現金</span><span style={{fontSize:14,fontFamily:"'Noto Serif JP',serif",fontWeight:600}}>{fmt(sumBy(periodSales,"現金"))}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:"#6A7ECC"}}/><span style={{fontSize:11,color:"#aaa"}}>カード</span><span style={{fontSize:14,fontFamily:"'Noto Serif JP',serif",fontWeight:600}}>{fmt(sumBy(periodSales,"カード"))}</span></div>
              <div style={{marginLeft:"auto",fontSize:11,color:"#8899aa"}}>{periodSales.length}件</div>
            </div>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:"16px 20px",border:"1px solid #EDE8E1",marginBottom:12}}>
            <div style={{fontSize:10,color:"#aaa",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>本日の売上合計</div>
            <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:24,fontWeight:600,color:"#C9A84C"}}>{fmt(grandToday)}</div>
            <div style={{fontSize:12,color:"#aaa",marginTop:4}}>{todaySales.length}件</div>
          </div>
        </div>
      )}

      {tab==="staff"&&(
        <div style={{padding:"0 20px"}}>
          {staffStats.length===0
            ?<div style={{textAlign:"center",padding:40,color:"#bbb",fontSize:13}}>データがありません</div>
            :staffStats.map((s,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:12,padding:"16px 18px",border:"1px solid #EDE8E1",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontWeight:500,fontSize:15}}>{s.name}</div>
                  <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:18,fontWeight:600,color:"#1A1A2E"}}>{fmt(s.periodTotal)}</div>
                </div>
                <div style={{display:"flex",gap:16,fontSize:12,color:"#888"}}>
                  <span>月間 {s.periodCount}件</span>
                  <span style={{color:"#C9A84C"}}>本日 {fmt(s.todayTotal)} ({s.todayCount}件)</span>
                </div>
                {/* 構成比バー */}
                {grandTotal>0&&(
                  <div style={{marginTop:10}}>
                    <div style={{height:4,background:"#F0EBE3",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.round(s.periodTotal/grandTotal*100)}%`,background:"#C9A84C",borderRadius:2}}/>
                    </div>
                    <div style={{fontSize:10,color:"#aaa",marginTop:4}}>{Math.round(s.periodTotal/grandTotal*100)}%</div>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}

      {tab==="graph"&&(
        <div style={{padding:"0 20px"}}>
          <div style={{fontSize:13,color:"#888",marginBottom:12}}>今月の日別売上（全スタッフ合計）</div>
          {dailyData.length===0?<div style={{textAlign:"center",padding:40,color:"#bbb",fontSize:13}}>データがありません</div>
            :<ResponsiveContainer width="100%" height={260}><BarChart data={dailyData} margin={{top:4,right:4,left:0,bottom:4}}>
              <XAxis dataKey="label" tick={{fontSize:10,fill:"#aaa"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:"#aaa"}} axisLine={false} tickLine={false} tickFormatter={v=>`¥${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>[fmt(v),"売上"]} contentStyle={{borderRadius:8,border:"1px solid #EDE8E1",fontSize:12}}/>
              <Bar dataKey="売上" fill="#C9A84C" radius={[4,4,0,0]}/>
            </BarChart></ResponsiveContainer>}
        </div>
      )}

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #EDE8E1",display:"flex",justifyContent:"space-around",padding:"10px 0 16px"}}>
        {[["summary","📋","サマリー"],["staff","👥","スタッフ"],["graph","📊","グラフ"]].map(([k,icon,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===k?"#1A1A2E":"#bbb",fontSize:10,letterSpacing:"0.06em",fontFamily:"'Noto Sans JP',sans-serif"}}>
            <span style={{fontSize:20}}>{icon}</span><span>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

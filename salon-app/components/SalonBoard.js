"use client";
import { useState, useCallback } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
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
  const prev=m===1?12:m-1, prevY=m===1?y-1:y;
  return `${prevY}年${prev}月26日 〜 ${y}年${m}月25日`;
}
function fmt(n){ return "¥"+Number(n).toLocaleString(); }

const MENUS=["カット","カラー","パーマ","トリートメント","セラピー","縮毛矯正","店販"];
const MENU_COLORS=["#C9A84C","#1A1A2E","#7B9EA6","#B76E6E","#8B7355","#5B7A5B","#A78BBA"];
const inp={border:"1px solid #EDE8E1",borderRadius:8,padding:"10px 12px",fontSize:14,color:"#1A1A2E",background:"#FAFAF8",width:"100%",fontFamily:"'Noto Sans JP',sans-serif"};
const lbl={fontSize:11,letterSpacing:"0.08em",color:"#888",textTransform:"uppercase",display:"block",marginBottom:5};
const pill=(a)=>({fontSize:11,padding:"5px 14px",borderRadius:20,border:`1px solid ${a?"#1A1A2E":"#EDE8E1"}`,background:a?"#1A1A2E":"#fff",color:a?"#fff":"#888",cursor:"pointer",letterSpacing:"0.04em",fontFamily:"'Noto Sans JP',sans-serif"});
const tag={display:"inline-block",fontSize:10,padding:"3px 8px",borderRadius:20,background:"#F0EBE3",color:"#6B4E3D",marginRight:3,marginBottom:2};
const payBadge=(p)=>({display:"inline-block",fontSize:10,padding:"2px 7px",borderRadius:20,marginLeft:4,background:(p||"現金")==="現金"?"#EEF4EE":"#EEF0FF",color:(p||"現金")==="現金"?"#4A7C59":"#4A5A9C"});

export default function SalonBoard({ initialSales, session, onLogout }) {
  const [allSales,setAllSales]=useState(initialSales);
  const [tab,setTab]=useState("home");
  const [selectedMenus,setSelectedMenus]=useState([]);
  const [amount,setAmount]=useState("");
  const [paymentType,setPaymentType]=useState("現金");
  const [timeInput,setTimeInput]=useState(()=>{ const n=new Date(); return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`; });
  const [historyFilter,setHistoryFilter]=useState("today");
  const [graphMode,setGraphMode]=useState("daily");
  const [saveStatus,setSaveStatus]=useState("idle");

  const today=todayStr(), currentPeriod=billingKey();

  const persist=useCallback(async(next)=>{
    setSaveStatus("saving");
    try {
      await fetch("/api/sales",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:next})});
      setSaveStatus("saved"); setTimeout(()=>setSaveStatus("idle"),1500);
    } catch { setSaveStatus("error"); setTimeout(()=>setSaveStatus("idle"),2000); }
  },[]);

  const periodSales=allSales.filter(r=>billingKey(r.date)===currentPeriod);
  const todaySales=allSales.filter(r=>r.date===today);
  const sumBy=(list,type)=>list.filter(r=>(r.payment||"現金")===type).reduce((s,r)=>s+r.amount,0);
  const periodCash=sumBy(periodSales,"現金"),periodCard=sumBy(periodSales,"カード");
  const todayCash=sumBy(todaySales,"現金"),todayCard=sumBy(todaySales,"カード");
  const totalPeriod=periodCash+periodCard,totalToday=todayCash+todayCard;
  function getMenus(r){return r.menus||[r.menu];}
  const toggleMenu=(m)=>setSelectedMenus(prev=>prev.includes(m)?prev.filter(x=>x!==m):[...prev,m]);

  const addSale=useCallback(()=>{
    const amt=parseInt(amount,10);
    if(!amt||amt<=0||selectedMenus.length===0) return;
    const n=new Date();
    const hhmm=timeInput||`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
    const rec={id:Date.now(),date:today,time:hhmm,menu:selectedMenus.join("＋"),menus:selectedMenus,amount:amt,payment:paymentType};
    const next=[...allSales,rec];
    setAllSales(next); setAmount(""); setSelectedMenus([]); persist(next);
  },[amount,timeInput,selectedMenus,paymentType,today,allSales,persist]);

  const deleteSale=useCallback((id)=>{ const next=allSales.filter(r=>r.id!==id); setAllSales(next); persist(next); },[allSales,persist]);

  const dailyData=(()=>{
    const mC={},mK={};
    periodSales.forEach(r=>{ const p=r.payment||"現金"; if(p==="現金") mC[r.date]=(mC[r.date]||0)+r.amount; else mK[r.date]=(mK[r.date]||0)+r.amount; });
    return [...new Set(periodSales.map(r=>r.date))].sort().map(d=>({label:d.slice(5).replace("-","/"),現金:mC[d]||0,カード:mK[d]||0}));
  })();
  const menuData=(()=>{ const map={}; periodSales.forEach(r=>getMenus(r).forEach(m=>{map[m]=(map[m]||0)+r.amount;})); return Object.entries(map).map(([name,value])=>({name,value})); })();
  const historyList=historyFilter==="today"?[...todaySales].reverse():historyFilter==="period"?[...periodSales].reverse():[...allSales].reverse();

  const now=new Date(),days=["日","月","火","水","木","金","土"];
  const dateLabel=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日（${days[now.getDay()]}）`;

  return (
    <div style={{background:"#F7F3EE",minHeight:"100vh",paddingBottom:80}}>
      {saveStatus==="saving"&&<div style={{position:"fixed",top:12,right:16,fontSize:11,color:"#C9A84C",background:"#fff",padding:"4px 12px",borderRadius:20,border:"1px solid #EDE8E1",zIndex:100}}>保存中…</div>}
      {saveStatus==="saved"&&<div style={{position:"fixed",top:12,right:16,fontSize:11,color:"#4A7C59",background:"#fff",padding:"4px 12px",borderRadius:20,border:"1px solid #EDE8E1",zIndex:100}}>✓ 保存済み</div>}

      {tab==="home"&&(
        <div>
          <div style={{padding:"28px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <h1 style={{fontFamily:"'Noto Serif JP',serif",fontSize:20,fontWeight:600,letterSpacing:"0.1em"}}>サロンボード</h1>
              <div style={{fontSize:12,color:"#aaa",marginTop:2}}>{dateLabel}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <button onClick={onLogout} style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:"1px solid #EDE8E1",background:"#fff",color:"#888",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>ログアウト</button>
            </div>
          </div>
          <div style={{fontSize:11,color:"#C9A84C",letterSpacing:"0.08em",padding:"6px 20px 20px"}}>{periodLabel(currentPeriod)}</div>

          <div style={{padding:"0 20px",marginBottom:12}}>
            <div style={{background:"#1A1A2E",borderRadius:12,padding:"18px 20px",color:"#fff"}}>
              <div style={{fontSize:10,letterSpacing:"0.1em",color:"#C9A84C",marginBottom:10,textTransform:"uppercase"}}>月間売上（締め期間）</div>
              <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:26,fontWeight:600,marginBottom:10}}>{fmt(totalPeriod)}</div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:"#4A7C59"}}/><span style={{fontSize:11,color:"#aaa"}}>現金</span><span style={{fontSize:14,fontFamily:"'Noto Serif JP',serif",fontWeight:600}}>{fmt(periodCash)}</span></div>
                <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:"#6A7ECC"}}/><span style={{fontSize:11,color:"#aaa"}}>カード</span><span style={{fontSize:14,fontFamily:"'Noto Serif JP',serif",fontWeight:600}}>{fmt(periodCard)}</span></div>
                <div style={{marginLeft:"auto",fontSize:11,color:"#8899aa"}}>{periodSales.length}件</div>
              </div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,padding:"0 20px",marginBottom:24}}>
            <div style={{background:"#fff",borderRadius:12,padding:"14px",border:"1px solid #EDE8E1",gridColumn:"span 2"}}>
              <div style={{fontSize:10,letterSpacing:"0.1em",color:"#aaa",marginBottom:8,textTransform:"uppercase"}}>本日の売上</div>
              <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:22,fontWeight:600,color:"#C9A84C",marginBottom:8}}>{fmt(totalToday)}</div>
              <div style={{display:"flex",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:"50%",background:"#4A7C59"}}/><span style={{fontSize:10,color:"#aaa"}}>現金</span><span style={{fontSize:12,fontFamily:"'Noto Serif JP',serif",fontWeight:600}}>{fmt(todayCash)}</span></div>
                <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:"50%",background:"#6A7ECC"}}/><span style={{fontSize:10,color:"#aaa"}}>カード</span><span style={{fontSize:12,fontFamily:"'Noto Serif JP',serif",fontWeight:600}}>{fmt(todayCard)}</span></div>
              </div>
            </div>
            <div style={{background:"#fff",borderRadius:12,padding:"14px",border:"1px solid #EDE8E1"}}>
              <div style={{fontSize:10,letterSpacing:"0.1em",color:"#aaa",marginBottom:6,textTransform:"uppercase"}}>来客数</div>
              <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:22,fontWeight:600}}>{periodSales.length}</div>
              <div style={{fontSize:10,color:"#bbb",marginTop:3}}>名</div>
            </div>
          </div>

          <div style={{padding:"0 20px",marginBottom:20}}>
            <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:14,fontWeight:600,letterSpacing:"0.08em",marginBottom:12}}>売上入力</div>
            <div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #EDE8E1"}}>
              <div style={{marginBottom:16}}>
                <label style={lbl}>メニュー（複数選択可）</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:2}}>
                  {MENUS.map(m=>{ const active=selectedMenus.includes(m); return (
                    <button key={m} onClick={()=>toggleMenu(m)} style={{padding:"7px 13px",borderRadius:20,fontSize:12,border:`1.5px solid ${active?"#1A1A2E":"#EDE8E1"}`,background:active?"#1A1A2E":"#fff",color:active?"#fff":"#555",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif",fontWeight:active?500:400}}>
                      {active&&<span style={{marginRight:4,fontSize:10}}>✓</span>}{m}
                    </button>
                  );})}
                </div>
                {selectedMenus.length>1&&<div style={{marginTop:8,fontSize:11,color:"#C9A84C"}}>　{selectedMenus.join("＋")} で登録</div>}
                {selectedMenus.length===0&&<div style={{marginTop:6,fontSize:11,color:"#ccc"}}>メニューを選んでください</div>}
              </div>
              <div style={{marginBottom:14}}>
                <label style={lbl}>支払い方法</label>
                <div style={{display:"flex",gap:10}}>
                  {["現金","カード"].map(p=>{ const active=paymentType===p,color=p==="現金"?"#4A7C59":"#4A5A9C"; return (
                    <button key={p} onClick={()=>setPaymentType(p)} style={{flex:1,padding:"10px",borderRadius:8,fontSize:14,border:`1.5px solid ${active?color:"#EDE8E1"}`,background:active?color:"#fff",color:active?"#fff":"#888",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif",fontWeight:active?500:400}}>
                      {p==="現金"?"💴":"💳"} {p}
                    </button>
                  );})}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
                <div><label style={lbl}>金額 (円)</label><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSale()} placeholder="0" min="0" step="100" style={inp}/></div>
                <div><label style={lbl}>時間</label><input type="time" value={timeInput} onChange={e=>setTimeInput(e.target.value)} style={inp}/></div>
              </div>
              <button onClick={addSale} style={{width:"100%",padding:12,background:selectedMenus.length>0?"#1A1A2E":"#ccc",color:"#fff",border:"none",borderRadius:8,fontSize:14,letterSpacing:"0.08em",cursor:selectedMenus.length>0?"pointer":"not-allowed",marginTop:8,fontFamily:"'Noto Sans JP',sans-serif"}}>＋ 追加する</button>
            </div>
          </div>

          <div style={{padding:"0 20px"}}>
            <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:14,fontWeight:600,letterSpacing:"0.08em",marginBottom:12}}>本日の記録</div>
            <div style={{background:"#fff",borderRadius:12,border:"1px solid #EDE8E1",overflow:"hidden"}}>
              {todaySales.length===0?<div style={{textAlign:"center",padding:28,color:"#bbb",fontSize:13}}>本日のデータがありません</div>
                :<table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><tbody>
                  {[...todaySales].reverse().map(r=>(
                    <tr key={r.id}>
                      <td style={{padding:"11px 14px",borderBottom:"1px solid #F3EFE9",color:"#aaa",fontSize:12,whiteSpace:"nowrap"}}>{r.time}</td>
                      <td style={{padding:"11px 14px",borderBottom:"1px solid #F3EFE9"}}>{getMenus(r).map((m,i)=><span key={i} style={tag}>{m}</span>)}<span style={payBadge(r.payment)}>{r.payment||"現金"}</span></td>
                      <td style={{padding:"11px 14px",borderBottom:"1px solid #F3EFE9",fontFamily:"'Noto Serif JP',serif",fontWeight:600,whiteSpace:"nowrap"}}>{fmt(r.amount)}</td>
                      <td style={{padding:"11px 14px",borderBottom:"1px solid #F3EFE9"}}><button onClick={()=>deleteSale(r.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:15}}>✕</button></td>
                    </tr>
                  ))}
                </tbody></table>}
            </div>
          </div>
        </div>
      )}

      {tab==="graph"&&(
        <div style={{padding:"28px 20px 0"}}>
          <h2 style={{fontFamily:"'Noto Serif JP',serif",fontSize:18,fontWeight:600,marginBottom:4}}>グラフ</h2>
          <div style={{fontSize:11,color:"#aaa",marginBottom:20}}>{periodLabel(currentPeriod)}</div>
          <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
            {[["daily","日別売上"],["menu","メニュー別"]].map(([k,l])=>(
              <button key={k} onClick={()=>setGraphMode(k)} style={pill(graphMode===k)}>{l}</button>
            ))}
          </div>
          {graphMode==="daily"&&(<>
            <div style={{fontSize:13,color:"#888",marginBottom:12}}>今月締め期間の日別売上</div>
            {dailyData.length===0?<div style={{textAlign:"center",padding:40,color:"#bbb",fontSize:13}}>データがありません</div>
              :<ResponsiveContainer width="100%" height={240}><BarChart data={dailyData} margin={{top:4,right:4,left:0,bottom:4}}>
                <XAxis dataKey="label" tick={{fontSize:10,fill:"#aaa"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"#aaa"}} axisLine={false} tickLine={false} tickFormatter={v=>`¥${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={(v,n)=>[fmt(v),n]} contentStyle={{borderRadius:8,border:"1px solid #EDE8E1",fontSize:12}}/>
                <Bar dataKey="現金" stackId="a" fill="#4A7C59"/><Bar dataKey="カード" stackId="a" fill="#6A7ECC" radius={[4,4,0,0]}/>
              </BarChart></ResponsiveContainer>}
          </>)}
          {graphMode==="menu"&&(<>
            <div style={{fontSize:13,color:"#888",marginBottom:12}}>今月締め期間のメニュー別構成</div>
            {menuData.length===0?<div style={{textAlign:"center",padding:40,color:"#bbb",fontSize:13}}>データがありません</div>
              :<><ResponsiveContainer width="100%" height={220}><PieChart>
                <Pie data={menuData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                  {menuData.map((e,i)=><Cell key={i} fill={MENU_COLORS[MENUS.indexOf(e.name)%MENU_COLORS.length]||"#aaa"}/>)}
                </Pie>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:8,border:"1px solid #EDE8E1",fontSize:12}}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
              </PieChart></ResponsiveContainer>
              <div style={{marginTop:16}}>{[...menuData].sort((a,b)=>b.value-a.value).map((d,i)=>{
                const total=menuData.reduce((s,x)=>s+x.value,0),color=MENU_COLORS[MENUS.indexOf(d.name)%MENU_COLORS.length]||"#aaa";
                return <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>
                  <div style={{fontSize:13,color:"#333",flex:1}}>{d.name}</div>
                  <div style={{fontSize:12,color:"#888"}}>{Math.round(d.value/total*100)}%</div>
                  <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:13,fontWeight:600}}>{fmt(d.value)}</div>
                </div>;
              })}</div></>}
          </>)}
        </div>
      )}

      {tab==="history"&&(
        <div style={{padding:"28px 20px 0"}}>
          <h2 style={{fontFamily:"'Noto Serif JP',serif",fontSize:18,fontWeight:600,marginBottom:16}}>履歴</h2>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {[["today","本日"],["period","今月締め"],["all","全期間"]].map(([k,l])=>(
              <button key={k} onClick={()=>setHistoryFilter(k)} style={pill(historyFilter===k)}>{l}</button>
            ))}
          </div>
          <div style={{background:"#1A1A2E",borderRadius:12,padding:"14px 18px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:12,color:"#8899aa"}}>合計 {historyList.length}件</div>
              <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:20,fontWeight:600,color:"#fff"}}>{fmt(historyList.reduce((s,r)=>s+r.amount,0))}</div>
            </div>
            <div style={{display:"flex",gap:20,borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:10}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:"#4A7C59"}}/><span style={{fontSize:11,color:"#aaa"}}>現金</span><span style={{fontSize:13,fontFamily:"'Noto Serif JP',serif",fontWeight:600,color:"#fff"}}>{fmt(historyList.filter(r=>(r.payment||"現金")==="現金").reduce((s,r)=>s+r.amount,0))}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:"#6A7ECC"}}/><span style={{fontSize:11,color:"#aaa"}}>カード</span><span style={{fontSize:13,fontFamily:"'Noto Serif JP',serif",fontWeight:600,color:"#fff"}}>{fmt(historyList.filter(r=>(r.payment||"現金")==="カード").reduce((s,r)=>s+r.amount,0))}</span></div>
            </div>
          </div>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid #EDE8E1",overflow:"hidden"}}>
            {historyList.length===0?<div style={{textAlign:"center",padding:36,color:"#bbb",fontSize:13}}>データがありません</div>
              :<table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr>{["日付","時間","メニュー","支払","金額",""].map(h=>(
                  <th key={h} style={{textAlign:"left",fontSize:10,letterSpacing:"0.1em",color:"#aaa",textTransform:"uppercase",padding:"8px 10px",borderBottom:"1px solid #EDE8E1",fontWeight:400}}>{h}</th>
                ))}</tr></thead>
                <tbody>{historyList.map(r=>(
                  <tr key={r.id}>
                    <td style={{padding:"10px",borderBottom:"1px solid #F3EFE9",color:"#aaa",fontSize:12,whiteSpace:"nowrap"}}>{r.date.slice(5).replace("-","/")}</td>
                    <td style={{padding:"10px",borderBottom:"1px solid #F3EFE9",color:"#555",whiteSpace:"nowrap"}}>{r.time}</td>
                    <td style={{padding:"10px",borderBottom:"1px solid #F3EFE9"}}>{getMenus(r).map((m,i)=><span key={i} style={tag}>{m}</span>)}</td>
                    <td style={{padding:"10px",borderBottom:"1px solid #F3EFE9"}}><span style={payBadge(r.payment)}>{r.payment||"現金"}</span></td>
                    <td style={{padding:"10px",borderBottom:"1px solid #F3EFE9",fontFamily:"'Noto Serif JP',serif",fontWeight:600,whiteSpace:"nowrap"}}>{fmt(r.amount)}</td>
                    <td style={{padding:"10px",borderBottom:"1px solid #F3EFE9"}}><button onClick={()=>deleteSale(r.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:15}}>✕</button></td>
                  </tr>
                ))}</tbody>
              </table>}
          </div>
        </div>
      )}

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #EDE8E1",display:"flex",justifyContent:"space-around",padding:"10px 0 16px"}}>
        {[["home","🏠","ホーム"],["graph","📊","グラフ"],["history","📋","履歴"]].map(([k,icon,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===k?"#1A1A2E":"#bbb",fontSize:10,letterSpacing:"0.06em",fontFamily:"'Noto Sans JP',sans-serif"}}>
            <span style={{fontSize:20}}>{icon}</span><span>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

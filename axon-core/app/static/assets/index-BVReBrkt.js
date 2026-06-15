(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function o(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(s){if(s.ep)return;s.ep=!0;const i=o(s);fetch(s.href,i)}})();function e(t,n={},...o){const a=document.createElement(t);for(const[s,i]of Object.entries(n))s==="className"?a.className=i:s==="innerHTML"?a.innerHTML=i:s==="textContent"?a.textContent=i:s.startsWith("on")?a.addEventListener(s.slice(2).toLowerCase(),i):s==="dataset"?Object.assign(a.dataset,i):a.setAttribute(s,i);for(const s of o)typeof s=="string"?a.appendChild(document.createTextNode(s)):s instanceof Node&&a.appendChild(s);return a}function M(t,...n){typeof t=="string"&&(t=document.querySelector(t)),t.innerHTML="",n.forEach(o=>{o&&t.appendChild(o)})}const Pe={serverOnline:!1,currentPage:"dashboard",agentCount:0,memoryCount:0,lockCount:0,receiptCount:0,events:[],credentials:{apiKey:null,projectId:null}},ne=new Map;function K(){return Pe}function F(t,n){Pe[t]=n,ne.has(t)&&ne.get(t).forEach(o=>o(n))}function je(t,n){return ne.has(t)||ne.set(t,[]),ne.get(t).push(n),()=>{const o=ne.get(t);ne.set(t,o.filter(a=>a!==n))}}const Ve="";let oe=null,Ce=null,se=null;function re(t,n,o=null){oe=t,Ce=n,o&&(se=o,localStorage.setItem("axon_user_token",o)),t&&localStorage.setItem("axon_api_key",t),n&&localStorage.setItem("axon_project_id",n)}function We(){oe=null,Ce=null,se=null,localStorage.removeItem("axon_api_key"),localStorage.removeItem("axon_project_id"),localStorage.removeItem("axon_user_token")}async function L(t,n,o=null){const a={"Content-Type":"application/json"};se||(se=localStorage.getItem("axon_user_token")),oe||(oe=localStorage.getItem("axon_api_key")),Ce||(Ce=localStorage.getItem("axon_project_id")),oe&&(a["X-API-Key"]=oe),se&&(a.Authorization=`Bearer ${se}`);const s={method:t,headers:a};o&&(s.body=JSON.stringify(o));const i=await fetch(`${Ve}${n}`,s);if(!i.ok){const l=await i.json().catch(()=>({detail:i.statusText}));throw new Error(l.detail||`HTTP ${i.status}`)}return i.json()}const Se={signup:(t,n)=>L("POST","/v1/auth/signup",{email:t,password:n}),login:(t,n)=>L("POST","/v1/auth/login",{email:t,password:n}),me:()=>L("GET","/v1/auth/me")},xe={create:t=>L("POST","/v1/projects",{name:t}),list:()=>L("GET","/v1/projects"),rotateKey:t=>L("POST",`/v1/projects/${t}/rotate-key`)},Ae={checkout:t=>L("POST","/v1/billing/checkout",{base_url:t}),portal:t=>L("POST","/v1/billing/portal",{base_url:t})},Re={ping:()=>L("GET","/v1/health"),ready:()=>L("GET","/v1/health/ready")},ce={register:(t,n,o=[])=>L("POST","/v1/agents/register",{name:t,project_id:n,capabilities:o}),me:()=>L("GET","/v1/agents/me"),list:()=>L("GET","/v1/agents/list")},ie={store:(t,n={},o="project",a=null)=>L("POST","/v1/memory/store",{content:t,tags:n,scope:o,ttl:a}),search:(t,n=20,o=.3)=>L("POST","/v1/memory/search",{query:t,limit:n,min_similarity:o}),list:()=>L("GET","/v1/memory/list"),get:t=>L("GET",`/v1/memory/${t}`),delete:t=>L("DELETE",`/v1/memory/${t}`)},Me={acquire:(t,n=300)=>L("POST","/v1/lock/acquire",{resource_id:t,timeout:n}),release:t=>L("POST",`/v1/lock/release?resource_id=${t}`),status:t=>L("GET",`/v1/lock/status/${t}`),list:()=>L("GET","/v1/lock/list")},fe={create:(t,n,o)=>L("POST","/v1/receipts/create",{input:t,steps:n,output:o}),get:t=>L("GET",`/v1/receipts/${t}`),verify:t=>L("POST",`/v1/receipts/verify?receipt_id=${t}`),list:()=>L("GET","/v1/receipts/list")},Ie={send:(t,n,o)=>L("POST","/v1/messages/send",{recipient_id:t,topic:n,payload:o}),inbox:(t=null,n=50)=>{const o=new URLSearchParams({limit:n});return t&&o.append("topic",t),L("GET",`/v1/messages/inbox?${o.toString()}`)},ack:t=>L("POST",`/v1/messages/ack?message_id=${t}`)};let Q=null,be=[],ze=null;function he(t){$e();const o=`${location.protocol==="https:"?"wss:":"ws:"}//${location.host}/v1/events/${t}`;Q=new WebSocket(o),Q.onopen=()=>{console.log("[Axon WS] Connected"),Ee({type:"ws.connected"})},Q.onmessage=a=>{try{const s=JSON.parse(a.data);if(s.type==="ping"||s.type==="connected")return;Ee(s)}catch{console.warn("[Axon WS] Invalid message:",a.data)}},Q.onclose=()=>{console.log("[Axon WS] Disconnected, reconnecting in 3s..."),Ee({type:"ws.disconnected"}),ze=setTimeout(()=>he(t),3e3)},Q.onerror=a=>{console.error("[Axon WS] Error:",a)}}function $e(){clearTimeout(ze),Q&&(Q.onclose=null,Q.close(),Q=null)}function Oe(t){return be.push(t),()=>{be=be.filter(n=>n!==t)}}function Ee(t){be.forEach(n=>n(t))}const He={};function G(t,n){He[t]=n}function le(t){window.location.hash=`#/${t}`}function Ge(t="dashboard"){function n(){const o=localStorage.getItem("axon_user_token");let a=window.location.hash.replace("#/","");if((!a||a==="/")&&(a=t),o){if(a==="login"){window.location.hash=`#/${t}`;return}const i=localStorage.getItem("axon_api_key"),l=localStorage.getItem("axon_project_id");if((!i||!l)&&a!=="projects"&&a!=="billing"){window.location.hash="#/projects";return}}else if(a!=="login"){window.location.hash="#/login";return}const s=He[a];s?s():(a==="login"||a==="projects"||a==="billing")&&console.warn(`Route render function for ${a} not found yet.`)}window.addEventListener("hashchange",n),n()}function Te(){if(!localStorage.getItem("axon_user_token"))return"login";const n=window.location.hash.replace("#/","")||"dashboard";return!localStorage.getItem("axon_project_id")&&n!=="projects"&&n!=="billing"?"projects":n}function b(t,n="info"){const o=document.getElementById("toast-container");if(!o)return;const a=e("div",{className:`toast toast-${n}`,textContent:t});o.appendChild(a),setTimeout(()=>{a.style.animation="fadeOut 0.3s ease-out forwards",a.addEventListener("animationend",()=>{a.remove()})},4e3)}function X(t,n,o=null,a="Confirm"){const s=document.getElementById("modal-overlay");if(!s)return;const i=e("div",{className:"modal-body"});typeof n=="string"?i.innerHTML=n:n instanceof Node&&i.appendChild(n);const l=e("div",{className:"modal-actions"},e("button",{className:"btn btn-secondary",textContent:"Cancel",onclick:Le}));o&&l.appendChild(e("button",{className:"btn btn-primary",textContent:a,onclick:async()=>{await o()!==!1&&Le()}}));const p=e("div",{className:"modal"},e("h3",{className:"modal-title",textContent:t}),i,l);M(s,p),s.classList.add("active")}function Le(){const t=document.getElementById("modal-overlay");t&&(t.classList.remove("active"),t.innerHTML="")}const J={dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',projects:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18l-8-4-8 4z"/></svg>',billing:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><rect width="20" height="14" x="2" y="5" rx="2" ry="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',agents:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',database:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>',locks:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',receipts:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>',activity:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',message:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>'};function De(){const t=Te(),n=localStorage.getItem("axon_user_token"),o=document.getElementById("sidebar");if(n)o&&(o.style.display="block");else{o&&(o.style.display="none");return}const a=e("div",{className:"sidebar-logo"},e("div",{className:"sidebar-logo-icon"},"A"),e("span",{className:"sidebar-logo-text"},"Axon Protocol"),e("span",{className:"sidebar-logo-version"},"v0.1")),s=[{name:"Dashboard",path:"dashboard",icon:J.dashboard},{name:"Projects",path:"projects",icon:J.projects},{name:"Billing",path:"billing",icon:J.billing},{name:"Agents",path:"agents",icon:J.agents},{name:"Memories",path:"memories",icon:J.database},{name:"Active Locks",path:"locks",icon:J.locks},{name:"Chained Receipts",path:"receipts",icon:J.receipts},{name:"Agent Messages",path:"messages",icon:J.message},{name:"Live Event Stream",path:"events",icon:J.activity}],i=e("a",{href:"#/login",className:"sidebar-link",style:"margin-top: auto; border-top: 1px solid var(--border-color); padding-top: var(--space-md);"});i.innerHTML=J.logout+"<span>Logout</span>",i.addEventListener("click",p=>{p.preventDefault(),We(),window.location.hash="#/login"});const l=e("nav",{className:"sidebar-nav",style:"height: calc(100% - 70px); display: flex; flex-direction: column;"},e("div",{className:"sidebar-section-label"},"Menu"),...s.map(p=>{const v=e("a",{href:`#/${p.path}`,className:`sidebar-link ${t===p.path?"active":""}`});return v.innerHTML=p.icon+`<span>${p.name}</span>`,v}),i);M("#sidebar",a,l)}window.addEventListener("hashchange",De);function D(t){return t?t.substring(0,8):"—"}function W(t){return t?new Date(t).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}):"—"}function Ue(t){const n=new Date,a=new Date(t)-n;if(a<=0)return{text:"Expired",status:"expired"};const s=Math.floor(a/6e4),i=Math.floor(a%6e4/1e3),l=`${s}m ${i}s`,p=s<1?"expiring":"safe";return{text:l,status:p}}function qe(t,n=80){return!t||t.length<=n?t:t.substring(0,n)+"…"}const Ye={dashboard:"System Overview",agents:"Agent Management",memories:"Semantic Memory Browser",locks:"Resource Coordination Locks",receipts:"Reasoning Receipts Registry","receipt-detail":"Reasoning Receipt Inspection",events:"Live WebSocket Event Log"};function Ne(){const t=Te(),n=Ye[t]||"Axon Dashboard",o=K(),a=e("div",{className:"header-title"},n),s=e("div",{className:"header-right"},e("div",{className:`status-dot ${o.serverOnline?"online":"offline"}`}),e("span",{className:"mono",textContent:o.serverOnline?"SERVER: ONLINE":"SERVER: OFFLINE",style:`color: ${o.serverOnline?"var(--color-success)":"var(--color-error)"}; font-size: 11px; font-weight: 600; margin-right: var(--space-md);`}),e("div",{style:"display: flex; align-items: center; gap: 8px; background: var(--bg-tertiary); padding: 4px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);"},e("span",{className:"mono",style:"font-size: 11px; color: var(--text-secondary);",textContent:`PROJECT: ${o.credentials.projectId?D(o.credentials.projectId):"None"}`})));M("#header",a,s)}je("serverOnline",Ne);je("credentials",Ne);window.addEventListener("hashchange",Ne);function ye(t,n,o="purple",a="",s=""){const i=e("div",{className:"card-value",textContent:"0"}),l=e("div",{className:"card stat-card"},e("div",{className:"card-header"},e("span",{className:"card-title",textContent:t}),e("div",{className:`stat-icon ${o}`,innerHTML:a})),i,e("div",{className:"card-subtitle",textContent:s})),p=parseInt(n,10);if(!isNaN(p)&&p>0){let v=null;const h=800,C=c=>{v||(v=c);const m=Math.min((c-v)/h,1);i.textContent=Math.floor(m*p),m<1&&window.requestAnimationFrame(C)};window.requestAnimationFrame(C)}else i.textContent=n;return l}function Fe(t){let n="badge-info",o=t;return t.includes("lock.acquired")?(n="badge-info",o="Lock Acquired"):t.includes("lock.released")?(n="badge-success",o="Lock Released"):t.includes("memory.stored")?(n="badge-purple",o="Memory Stored"):t.includes("receipt.created")?(n="badge-warning",o="Receipt Created"):t==="ws.connected"?(n="badge-success",o="WS Connected"):t==="ws.disconnected"&&(n="badge-error",o="WS Offline"),e("span",{className:`badge ${n}`,textContent:o})}const ve={agents:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',memories:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>',locks:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',receipts:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>'};async function Je(){var w,T,A,O,j,z,$;const t=document.getElementById("content"),n=K();t.innerHTML=`
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Overview</h1>
        <p class="page-subtitle">Real-time status of the Axon multi-agent environment</p>
      </div>
    </div>
    <div class="grid-4">
      <div class="card skeleton skeleton-card"></div>
      <div class="card skeleton skeleton-card"></div>
      <div class="card skeleton skeleton-card"></div>
      <div class="card skeleton skeleton-card"></div>
    </div>
    <div class="grid-2 section-gap">
      <div class="card skeleton" style="height: 300px;"></div>
      <div class="card skeleton" style="height: 300px;"></div>
    </div>
  `;let o=0,a=0,s=0,i=0,l={status:"offline",services:{db:!1,redis:!1,embeddings:!1}};if(n.serverOnline)try{const S=await ce.list().catch(()=>({agents:[]})),_=await ie.list().catch(()=>({memories:[]})),R=await Me.list().catch(()=>({locks:[]})),V=await fe.list().catch(()=>({receipts:[]}));l=await Re.ready().catch(()=>({status:"error",services:{db:!1,redis:!1,embeddings:!1}})),o=((w=S.agents)==null?void 0:w.length)||0,a=((T=_.memories)==null?void 0:T.length)||0,s=((A=R.locks)==null?void 0:A.length)||0,i=((O=V.receipts)==null?void 0:O.length)||0,F("agentCount",o),F("memoryCount",a),F("lockCount",s),F("receiptCount",i)}catch(S){console.error("Error fetching dashboard stats:",S)}t.innerHTML="";const p=e("div",{className:"page-header animate-fade-in"},e("div",{},e("h1",{className:"page-title",textContent:"Overview"}),e("p",{className:"page-subtitle",textContent:"Real-time status of the Axon multi-agent environment"}))),v=e("div",{className:"grid-4 animate-fade-in-up stagger-1"},ye("Total Agents",o,"purple",ve.agents,"Registered project-wide"),ye("Stored Memories",a,"green",ve.memories,"Semantic vectors in pgvector"),ye("Active Locks",s,"blue",ve.locks,"Synchronized resources"),ye("Chained Receipts",i,"amber",ve.receipts,"Cryptographic reasoning logs")),h=S=>S?e("span",{className:"badge badge-success",textContent:"Healthy"}):e("span",{className:"badge badge-error",textContent:"Unreachable"}),C=e("div",{className:"card animate-fade-in-up stagger-2"},e("div",{className:"card-header"},e("span",{className:"card-title",textContent:"Backend Dependency Health"})),e("div",{style:"display: flex; flex-direction: column; gap: var(--space-md); margin-top: var(--space-md);"},e("div",{style:"display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm);"},e("span",{textContent:"PostgreSQL Database"}),h((j=l.services)==null?void 0:j.db)),e("div",{style:"display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm);"},e("span",{textContent:"Redis Caching & PubSub"}),h((z=l.services)==null?void 0:z.redis)),e("div",{style:"display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm);"},e("span",{textContent:"SentenceTransformers (Embeddings)"}),h((($=l.services)==null?void 0:$.embeddings)||l.status==="ok")),e("div",{style:"display: flex; align-items: center; justify-content: space-between;"},e("span",{textContent:"API Server Status"}),e("span",{className:`badge ${n.serverOnline?"badge-success":"badge-error"}`,textContent:n.serverOnline?"Online":"Offline"})))),c=e("div",{className:"event-log"}),m=()=>{c.innerHTML="";const S=n.events.slice(0,10);if(S.length===0){c.appendChild(e("div",{style:"padding: var(--space-xl); text-align: center; color: var(--text-muted); font-size: 13px;",textContent:"No recent events. Actions will stream here in real time."}));return}S.forEach(_=>{c.appendChild(e("div",{className:"event-item"},e("span",{className:"event-time",textContent:W(_.timestamp||new Date)}),e("span",{className:"event-type"},Fe(_.type)),e("span",{className:"event-detail mono",textContent:JSON.stringify(_.payload||_)})))})};m();const r=e("div",{className:"card animate-fade-in-up stagger-3"},e("div",{className:"card-header"},e("span",{className:"card-title",textContent:"Live Environment Activity"})),c),g=e("div",{className:"grid-2 section-gap"},C,r);M(t,p,v,g);const d=je("events",()=>{document.getElementById("content").contains(c)&&m()}),k=()=>{document.getElementById("content").contains(c)||(d(),window.removeEventListener("hashchange",k))};window.addEventListener("hashchange",k)}G("dashboard",Je);function q(t,n,o=""){return e("div",{className:"empty-state animate-fade-in"},e("div",{className:"empty-state-icon",innerHTML:o||"📁"}),e("div",{className:"empty-state-title",textContent:t}),e("p",{className:"empty-state-text",textContent:n}))}function ke(t=5,n=4){const o=e("tbody");for(let a=0;a<t;a++){const s=e("tr");for(let i=0;i<n;i++)s.appendChild(e("td",{},e("div",{className:`skeleton skeleton-line ${i===0?"medium":"short"}`})));o.appendChild(s)}return e("div",{className:"table-container"},e("table",{},e("thead",{},e("tr",{},...Array(n).fill(0).map(()=>e("th",{},e("div",{className:"skeleton skeleton-line short"}))))),o))}async function Ke(){const t=document.getElementById("content"),n=K();t.innerHTML=`
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Agent Management</h1>
        <p class="page-subtitle">Register, monitor, and configure active project agents</p>
      </div>
      <button class="btn btn-primary" id="btn-register-agent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Register Agent
      </button>
    </div>
    <div id="agents-table-container" class="animate-fade-in-up stagger-1"></div>
  `,document.getElementById("btn-register-agent").onclick=Xe;const o=document.getElementById("agents-table-container");if(M(o,ke(4,5)),!n.serverOnline){M(o,q("Server Offline","Cannot fetch agent list when the core server is offline."));return}try{const s=(await ce.list()).agents||[];if(s.length===0){M(o,q("No Agents Registered","Register your first agent using the button above to start interacting with Axon Protocol.",'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>'));return}const i=e("table",{},e("thead",{},e("tr",{},e("th",{textContent:"Name"}),e("th",{textContent:"Agent ID"}),e("th",{textContent:"Capabilities"}),e("th",{textContent:"Status"}),e("th",{textContent:"Last Active"}),e("th",{textContent:"Created"}))),e("tbody",{},...s.map(l=>e("tr",{},e("td",{style:"font-weight: 600; color: var(--text-primary);",textContent:l.name}),e("td",{className:"mono",textContent:D(l.id)}),e("td",{},...l.capabilities.map(p=>e("span",{className:"badge badge-purple",style:"margin-right: 4px; margin-bottom: 2px;",textContent:p}))),e("td",{},e("span",{className:`badge ${l.status==="active"?"badge-success":"badge-warning"}`,textContent:l.status})),e("td",{textContent:l.last_seen_at?W(l.last_seen_at):"—"}),e("td",{textContent:W(l.created_at)})))));M(o,e("div",{className:"table-container"},i))}catch(a){M(o,q("Failed to load agents",a.message))}}function Xe(){const t=e("div",{style:"display: flex; flex-direction: column; gap: var(--space-md); text-align: left;"},e("div",{className:"input-group"},e("label",{className:"input-label",textContent:"Agent Name"}),e("input",{id:"reg-name",className:"input",placeholder:"e.g. WriterAgent"})),e("div",{className:"input-group"},e("label",{className:"input-label",textContent:"Project ID"}),e("input",{id:"reg-project-id",className:"input",placeholder:"e.g. main-project-id",value:K().credentials.projectId||""})),e("div",{className:"input-group"},e("label",{className:"input-label",textContent:"Capabilities (comma-separated)"}),e("input",{id:"reg-caps",className:"input",placeholder:"e.g. web-search, db-read, file-write"})));X("Register New Agent",t,async()=>{const n=document.getElementById("reg-name").value.trim(),o=document.getElementById("reg-project-id").value.trim(),a=document.getElementById("reg-caps").value.trim();if(!n||!o)return b("Agent Name and Project ID are required!","error"),!1;const s=a?a.split(",").map(i=>i.trim()).filter(Boolean):[];try{const i=await ce.register(n,o,s),l={apiKey:i.api_key,projectId:i.agent.project_id};F("credentials",l),localStorage.setItem("axon_api_key",i.api_key),localStorage.setItem("axon_project_id",i.agent.project_id),re(i.api_key,i.agent.project_id);const p=e("div",{style:"background: var(--bg-tertiary); padding: var(--space-md); border-radius: var(--radius-md); border: 1px solid var(--border-accent); margin-top: var(--space-md); text-align: left;"},e("p",{style:"font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;",textContent:"Copy your credentials below. The API key cannot be retrieved again!"}),e("div",{style:"margin-bottom: 8px;"},e("span",{style:"font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); display: block;",textContent:"API Key (Token)"}),e("div",{style:"display: flex; gap: var(--space-sm); align-items: center;"},e("input",{id:"key-copy-input",className:"input mono",style:"flex: 1; font-size: 11px;",value:i.api_key,readonly:!0}),e("button",{className:"btn btn-secondary btn-sm",textContent:"Copy",onclick:()=>{const v=document.getElementById("key-copy-input");v.select(),navigator.clipboard.writeText(v.value),b("API Key copied to clipboard!","success")}}))),e("div",{},e("span",{style:"font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); display: block;",textContent:"Project ID"}),e("div",{style:"display: flex; gap: var(--space-sm); align-items: center;"},e("input",{id:"project-copy-input",className:"input mono",style:"flex: 1; font-size: 11px;",value:i.agent.project_id,readonly:!0}),e("button",{className:"btn btn-secondary btn-sm",textContent:"Copy",onclick:()=>{const v=document.getElementById("project-copy-input");v.select(),navigator.clipboard.writeText(v.value),b("Project ID copied to clipboard!","success")}}))));return X("Registration Successful",p,()=>{Le(),Ke()},"Done"),!0}catch(i){return b(`Registration failed: ${i.message}`,"error"),!1}})}G("agents",Ke);async function Qe(){const t=document.getElementById("content"),n=K();t.innerHTML=`
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Semantic Memories</h1>
        <p class="page-subtitle">Inspect, query, and manage agent semantic memory vectors</p>
      </div>
      <div style="display: flex; gap: var(--space-sm);">
        <button class="btn btn-secondary" id="btn-manual-memory">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;margin-right:4px;"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Store Memory
        </button>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="card animate-fade-in-up" style="margin-bottom: var(--space-xl);">
      <form id="memory-search-form" class="search-bar" onsubmit="event.preventDefault();">
        <input type="text" id="memory-search-input" class="input" placeholder="Enter natural language query to search memories semantically... e.g. What is the agent planning?" />
        <button type="submit" class="btn btn-primary" id="btn-search-memory">Search</button>
      </form>
      <div style="display: flex; gap: var(--space-xl); margin-top: var(--space-md); font-size: 13px; color: var(--text-secondary);">
        <div style="display: flex; align-items: center; gap: var(--space-sm);">
          <label for="search-limit">Limit:</label>
          <input type="number" id="search-limit" class="input" value="10" min="1" max="100" style="width: 70px; padding: 4px var(--space-sm);" />
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-sm); flex: 1;">
          <label for="search-similarity">Min Similarity:</label>
          <input type="range" id="search-similarity" min="0" max="1" step="0.05" value="0.3" style="flex: 1;" />
          <span id="similarity-value" class="mono">0.30</span>
        </div>
      </div>
    </div>

    <div id="memories-table-container" class="animate-fade-in-up stagger-1"></div>
  `;const o=document.getElementById("memory-search-input"),a=document.getElementById("search-limit"),s=document.getElementById("search-similarity"),i=document.getElementById("similarity-value"),l=document.getElementById("memory-search-form"),p=document.getElementById("btn-manual-memory");s.oninput=()=>{i.textContent=parseFloat(s.value).toFixed(2)},p.onclick=r,l.onsubmit=async g=>{g.preventDefault(),await C()};const v=document.getElementById("memories-table-container");await h();async function h(){if(M(v,ke(5,5)),!n.serverOnline){M(v,q("Server Offline","Cannot fetch memories when server is offline."));return}try{const d=(await ie.list()).memories||[];c(d,!1)}catch(g){M(v,q("Failed to load memories",g.message))}}async function C(){const g=o.value.trim();if(!g){await h();return}M(v,ke(3,6));try{const d=parseInt(a.value,10)||10,k=parseFloat(s.value)||.3,w=await ie.search(g,d,k);c(w,!0)}catch(d){b(`Search failed: ${d.message}`,"error"),h()}}function c(g,d=!1){if(g.length===0){M(v,q("No memories found",d?"No memories matched your search criteria.":"No memories stored in the project database yet."));return}const k=e("table",{},e("thead",{},e("tr",{},e("th",{textContent:"Content"}),e("th",{textContent:"Tags"}),e("th",{textContent:"Scope"}),d?e("th",{textContent:"Similarity"}):null,e("th",{textContent:"Agent"}),e("th",{textContent:"Created"}),e("th",{textContent:"Actions",style:"text-align: right;"}))),e("tbody",{},...g.map(w=>e("tr",{},e("td",{style:"max-width: 320px; font-weight: 500;",textContent:qe(w.content,120)}),e("td",{},Object.entries(w.tags||{}).map(([T,A])=>e("span",{className:"badge badge-info",style:"margin-right: 4px; margin-bottom: 2px; font-size: 10px;",textContent:`${T}:${A}`}))),e("td",{},e("span",{className:`badge ${w.scope==="project"?"badge-purple":"badge-warning"}`,textContent:w.scope})),d?e("td",{className:"mono",style:"font-weight: 600; color: var(--accent-primary);",textContent:(w.similarity||w.similarity_score||0).toFixed(4)}):null,e("td",{className:"mono",textContent:D(w.agent_id)}),e("td",{textContent:W(w.created_at)}),e("td",{style:"text-align: right;"},e("button",{className:"btn btn-danger btn-sm",textContent:"Delete",onclick:()=>m(w.id)}))))));M(v,e("div",{className:"table-container"},k))}function m(g){const d=e("p",{textContent:`Are you sure you want to permanently delete memory ${D(g)}? This action cannot be undone.`});X("Delete Memory",d,async()=>{try{return await ie.delete(g),b("Memory deleted successfully!","success"),o.value.trim()?await C():await h(),!0}catch(k){return b(`Delete failed: ${k.message}`,"error"),!1}},"Delete")}function r(){const g=e("div",{style:"display: flex; flex-direction: column; gap: var(--space-md); text-align: left;"},e("div",{className:"input-group"},e("label",{className:"input-label",textContent:"Memory Content"}),e("textarea",{id:"mem-content",className:"input",placeholder:"Enter fact, reflection, or data to encode...",rows:4,style:"resize: vertical;"})),e("div",{className:"input-group"},e("label",{className:"input-label",textContent:"Tags (JSON format)"}),e("input",{id:"mem-tags",className:"input mono",placeholder:'{"topic": "planning", "importance": "high"}'})),e("div",{className:"input-group"},e("label",{className:"input-label",textContent:"Scope"}),e("select",{id:"mem-scope",className:"input"},e("option",{value:"project",textContent:"Project (Shared)"}),e("option",{value:"agent",textContent:"Agent (Private)"}))),e("div",{className:"input-group"},e("label",{className:"input-label",textContent:"TTL (Seconds, optional)"}),e("input",{id:"mem-ttl",type:"number",className:"input",placeholder:"e.g. 3600 for 1 hour"})));X("Store Manual Memory",g,async()=>{const d=document.getElementById("mem-content").value.trim(),k=document.getElementById("mem-tags").value.trim(),w=document.getElementById("mem-scope").value,T=document.getElementById("mem-ttl").value.trim();if(!d)return b("Memory content is required!","error"),!1;let A={};if(k)try{A=JSON.parse(k)}catch{return b("Tags must be valid JSON!","error"),!1}const O=T?parseInt(T,10):null;try{return await ie.store(d,A,w,O),b("Memory stored successfully!","success"),await h(),!0}catch(j){return b(`Failed to store memory: ${j.message}`,"error"),!1}},"Store")}}G("memories",Qe);async function Ze(){const t=document.getElementById("content"),n=K();t.innerHTML=`
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Active Coordination Locks</h1>
        <p class="page-subtitle">Inspect active locks and prevent race conditions between agents</p>
      </div>
      <button class="btn btn-secondary" id="btn-refresh-locks">Refresh</button>
    </div>
    <div id="locks-table-container" class="animate-fade-in-up stagger-1"></div>
  `,document.getElementById("btn-refresh-locks").onclick=i;const o=document.getElementById("locks-table-container");let a=null,s=null;await i();async function i(){if(clearInterval(a),!n.serverOnline){M(o,q("Server Offline","Cannot fetch locks when core server is offline."));return}try{const C=(await Me.list()).locks||[];if(C.length===0){M(o,q("No Active Locks","All resources are currently unlocked. Agents can coordinate locks via the SDK.",'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'));return}const c=C.map(r=>{const g=r.expires_at,d=e("span",{className:"countdown"});return l(d,g),{lock:r,el:e("tr",{},e("td",{className:"mono",style:"font-weight: 600; color: var(--text-primary);",textContent:r.resource_id}),e("td",{className:"mono",textContent:D(r.agent_id)}),e("td",{textContent:W(r.acquired_at)}),e("td",{textContent:W(r.expires_at)}),e("td",{},d),e("td",{style:"text-align: right;"},e("button",{className:"btn btn-danger btn-sm",textContent:"Release",onclick:()=>p(r.resource_id)}))),countdownEl:d,expiresAt:g}}),m=e("table",{},e("thead",{},e("tr",{},e("th",{textContent:"Resource ID"}),e("th",{textContent:"Holder Agent ID"}),e("th",{textContent:"Acquired At"}),e("th",{textContent:"Expires At"}),e("th",{textContent:"Time Remaining"}),e("th",{textContent:"Actions",style:"text-align: right;"}))),e("tbody",{},...c.map(r=>r.el)));M(o,e("div",{className:"table-container"},m)),a=setInterval(()=>{c.forEach(r=>l(r.countdownEl,r.expiresAt))},1e3)}catch(h){M(o,q("Failed to load locks",h.message))}}function l(h,C){const c=Ue(C);h.textContent=c.text,h.className=`countdown ${c.status}`}function p(h){const C=e("p",{textContent:`Are you sure you want to force release the lock on "${h}"? This may cause race conditions if the holder agent is still running.`});X("Force Release Lock",C,async()=>{try{return await Me.release(h),b("Lock released successfully!","success"),await i(),!0}catch(c){return b(`Release failed: ${c.message}`,"error"),!1}},"Release")}s=setInterval(i,1e4);const v=()=>{document.getElementById("locks-table-container")||(clearInterval(a),clearInterval(s),window.removeEventListener("hashchange",v))};window.addEventListener("hashchange",v)}G("locks",Ze);async function et(){const t=document.getElementById("content"),n=K();t.innerHTML=`
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Reasoning Receipts</h1>
        <p class="page-subtitle">Cryptographically chain and verify agent reasoning steps</p>
      </div>
    </div>
    <div id="receipts-table-container" class="animate-fade-in-up stagger-1"></div>
  `;const o=document.getElementById("receipts-table-container");if(M(o,ke(5,5)),!n.serverOnline){M(o,q("Server Offline","Cannot fetch receipts when core server is offline."));return}try{const s=(await fe.list()).receipts||[];if(s.length===0){M(o,q("No Reasoning Receipts Found","Agents write receipts containing steps and signatures. No receipts are logged for this project yet.",'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>'));return}const i=e("table",{},e("thead",{},e("tr",{},e("th",{textContent:"Receipt ID"}),e("th",{textContent:"Agent ID"}),e("th",{textContent:"Input Summary"}),e("th",{textContent:"Cryptographic Chain Hash"}),e("th",{textContent:"Created"}),e("th",{textContent:"Verification"}),e("th",{textContent:"Actions",style:"text-align: right;"}))),e("tbody",{},...s.map(l=>{const p=e("span",{className:"badge badge-info",textContent:"Unverified"});return e("tr",{style:"cursor: pointer;",onclick:h=>{h.target.tagName==="BUTTON"||h.target.closest("button")||(F("inspectedReceiptId",l.id),le("receipt-detail"))}},e("td",{style:"font-weight: 600; color: var(--accent-primary);"},D(l.id)),e("td",{className:"mono",textContent:D(l.agent_id)}),e("td",{textContent:qe(l.input_text||"—",50)}),e("td",{className:"mono",style:"font-size: 11px; opacity: 0.8;",textContent:D(l.chain_hash)}),e("td",{textContent:W(l.created_at)}),e("td",{},p),e("td",{style:"text-align: right;"},e("button",{className:"btn btn-secondary btn-sm",textContent:"Verify",onclick:async h=>{h.stopPropagation(),p.textContent="Verifying...",p.className="badge badge-warning";try{(await fe.verify(l.id)).valid?(p.textContent="Verified (Valid)",p.className="badge badge-success",b(`Receipt ${D(l.id)} is cryptographically secure.`,"success")):(p.textContent="TAMPERED",p.className="badge badge-error",b(`Receipt ${D(l.id)} validation FAILED! Invalid signature or chain.`,"error"))}catch(C){p.textContent="Error",p.className="badge badge-error",b(`Verification failed: ${C.message}`,"error")}}})))})));M(o,e("div",{className:"table-container"},i))}catch(a){M(o,q("Failed to load receipts",a.message))}}G("receipts",et);async function tt(){const t=document.getElementById("content"),n=K(),o=n.inspectedReceiptId;if(!o){t.innerHTML="",t.appendChild(q("No Receipt Selected","Navigate back to the receipts page to select a receipt to inspect.",`<button class="btn btn-primary" onclick="window.location.hash = '#/receipts';">Back to Receipts</button>`));return}t.innerHTML=`
    <div class="page-header animate-fade-in">
      <div>
        <button class="btn btn-secondary btn-sm" id="btn-back-receipts" style="margin-bottom: var(--space-sm);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;margin-right:4px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to list
        </button>
        <h1 class="page-title">Receipt Inspection</h1>
        <p class="page-subtitle">Receipt ID: <span class="mono">${o}</span></p>
      </div>
      <button class="btn btn-primary" id="btn-verify-receipt">Verify Integrity</button>
    </div>
    <div class="grid-2 animate-fade-in-up stagger-1">
      <div class="card skeleton" style="height: 350px;"></div>
      <div class="card skeleton" style="height: 350px;"></div>
    </div>
  `,document.getElementById("btn-back-receipts").onclick=()=>le("receipts");const a=document.getElementById("btn-verify-receipt");if(!n.serverOnline){t.innerHTML="",t.appendChild(q("Server Offline","Cannot fetch receipt details when the server is offline."));return}try{const s=await fe.get(o);a.onclick=async()=>{a.textContent="Verifying...",a.disabled=!0;try{(await fe.verify(o)).valid?(b("Receipt verification passed! Signature matches hash chain.","success"),a.className="btn btn-secondary",a.textContent="Verified ✓"):(b("Receipt verification FAILED! Signature does not match or data has been altered.","error"),a.className="btn btn-danger",a.textContent="TAMPERED ✗")}catch(c){b(`Verification error: ${c.message}`,"error"),a.textContent="Verification Failed"}finally{a.disabled=!1}},t.innerHTML="";const i=e("div",{className:"page-header animate-fade-in"},e("div",{},e("button",{className:"btn btn-secondary btn-sm",style:"margin-bottom: var(--space-sm);",onclick:()=>le("receipts"),innerHTML:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;margin-right:4px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back to list'}),e("h1",{className:"page-title",textContent:"Receipt Inspection"}),e("p",{className:"page-subtitle"},"Receipt ID: ",e("span",{className:"mono",style:"color: var(--text-primary);",textContent:s.id}))),a),l=e("div",{className:"card animate-fade-in-up stagger-1"},e("div",{className:"card-header"},e("span",{className:"card-title",textContent:"Chained Signature Metadata"})),e("div",{style:"display: flex; flex-direction: column; gap: var(--space-md); font-size: 13px;"},e("div",{},e("strong",{textContent:"Agent ID: "}),e("span",{className:"mono",textContent:s.agent_id})),e("div",{},e("strong",{textContent:"Input Text: "}),e("blockquote",{style:"background: var(--bg-tertiary); padding: var(--space-sm); border-left: 2px solid var(--accent-primary); border-radius: var(--radius-sm); margin-top: 4px;",textContent:s.input_text})),e("div",{},e("strong",{textContent:"Output Text: "}),e("blockquote",{style:"background: var(--bg-tertiary); padding: var(--space-sm); border-left: 2px solid var(--color-success); border-radius: var(--radius-sm); margin-top: 4px;",textContent:s.output_text})),e("div",{},e("strong",{textContent:"Final Chain Hash: "}),e("pre",{className:"mono",style:"background: var(--bg-secondary); padding: var(--space-sm); border-radius: var(--radius-sm); font-size: 11px; overflow-x: auto; margin-top: 4px;",textContent:s.chain_hash})),e("div",{},e("strong",{textContent:"HMAC Cryptographic Signature: "}),e("pre",{className:"mono",style:"background: var(--bg-secondary); padding: var(--space-sm); border-radius: var(--radius-sm); font-size: 11px; overflow-x: auto; margin-top: 4px;",textContent:s.signature})),e("div",{},e("strong",{textContent:"Created At: "}),e("span",{textContent:W(s.created_at)})))),p=s.steps||[],v=e("div",{className:"receipt-chain"},...p.map((c,m)=>e("div",{className:"receipt-step"},e("div",{className:"step-dot"}),e("div",{className:"step-content"},e("div",{className:"step-thought",textContent:c.thought}),e("div",{className:"step-meta"},e("span",{style:"margin-right: var(--space-sm); font-weight: 600;",textContent:`Step ${m+1}`}),c.tool_called?e("span",{className:"step-tool",textContent:`Tool: ${c.tool_called}`}):e("span",{className:"step-tool",style:"background: rgba(255,255,255,0.06); color: var(--text-secondary);",textContent:"Reasoning Action"})),c.tool_output?e("pre",{className:"mono",style:"background: var(--bg-secondary); border: 1px solid var(--border-color); padding: var(--space-sm); border-radius: var(--radius-sm); font-size: 11px; margin-top: var(--space-sm); overflow-x: auto; max-height: 120px;",textContent:typeof c.tool_output=="object"?JSON.stringify(c.tool_output,null,2):c.tool_output}):null)))),h=e("div",{className:"card animate-fade-in-up stagger-2"},e("div",{className:"card-header"},e("span",{className:"card-title",textContent:"Execution Step Chain"})),p.length===0?e("p",{style:"color: var(--text-muted); font-size: 13px; text-align: center; padding: var(--space-xl);",textContent:"This receipt contains no intermediate steps."}):v),C=e("div",{className:"grid-2"},l,h);M(t,i,C)}catch(s){t.innerHTML="",t.appendChild(q("Failed to load receipt details",s.message))}}G("receipt-detail",tt);function nt(){const t=document.getElementById("content"),n=K();let o=!1,a=[],s="all";t.innerHTML=`
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Live WebSocket Event Log</h1>
        <p class="page-subtitle">Stream real-time locks, memories, and receipts activity from agents</p>
      </div>
      <div style="display: flex; gap: var(--space-sm); align-items: center;">
        <label for="filter-event-type" style="font-size: 13px; color: var(--text-secondary);">Filter:</label>
        <select id="filter-event-type" class="input" style="padding: 4px var(--space-sm); font-size: 13px;">
          <option value="all">All Events</option>
          <option value="lock">Locks</option>
          <option value="memory">Memories</option>
          <option value="receipt">Receipts</option>
        </select>
        <button class="btn btn-secondary" id="btn-pause-events">Pause Stream</button>
        <button class="btn btn-danger" id="btn-clear-events">Clear Log</button>
      </div>
    </div>
    <div class="card animate-fade-in-up stagger-1" style="padding: 0; overflow: hidden;">
      <div id="events-feed" class="event-log" style="height: 600px; padding: var(--space-md);"></div>
    </div>
  `;const i=document.getElementById("events-feed"),l=document.getElementById("btn-pause-events"),p=document.getElementById("btn-clear-events"),v=document.getElementById("filter-event-type");a=[...n.events],h(),l.onclick=()=>{o=!o,l.textContent=o?"Resume Stream":"Pause Stream",l.className=o?"btn btn-primary":"btn btn-secondary"},p.onclick=()=>{a=[],F("events",[]),i.innerHTML=`
      <div id="events-empty-tip" style="padding: var(--space-2xl); text-align: center; color: var(--text-muted); font-size: 14px;">
        Cleared. Active WebSocket events will print here as they occur.
      </div>
    `},v.onchange=()=>{s=v.value,h()};function h(){i.innerHTML="";const d=C();if(d.length===0){i.innerHTML=`
        <div id="events-empty-tip" style="padding: var(--space-2xl); text-align: center; color: var(--text-muted); font-size: 14px;">
          No events recorded yet. Connect agents to trigger locks, memory stores, and receipts.
        </div>
      `;return}d.forEach(k=>c(k)),m()}function C(){return s==="all"?a:a.filter(d=>d.type.includes(s))}function c(d){const k=document.getElementById("events-empty-tip");k&&k.remove();const w=e("div",{className:"event-item"},e("span",{className:"event-time",textContent:W(d.timestamp||new Date)}),e("span",{className:"event-type"},Fe(d.type)),e("span",{className:"event-detail mono",textContent:JSON.stringify(d.payload||d)}));i.appendChild(w)}function m(){i.scrollTop=i.scrollHeight}const r=Oe(d=>{o||(a.push(d),F("events",[...n.events,d]),(s==="all"||d.type.includes(s))&&(c(d),m()))}),g=()=>{document.getElementById("events-feed")||(r(),window.removeEventListener("hashchange",g))};window.addEventListener("hashchange",g)}G("events",nt);async function at(){const t=document.getElementById("content"),n=K();t.innerHTML=`
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Agent Messaging Bus</h1>
        <p class="page-subtitle">Real-time direct messaging, topic pub/sub, and visual communication logs</p>
      </div>
    </div>
    
    <div class="grid grid-2 animate-fade-in-up stagger-1" style="grid-template-columns: 1fr 1.5fr; gap: var(--space-lg);">
      <!-- Left side: Forms & Inbox -->
      <div style="display: flex; flex-direction: column; gap: var(--space-lg);">
        <!-- Send Message Card -->
        <div class="card" style="padding: var(--space-lg);">
          <h2 style="font-size: 16px; font-weight: 600; margin-bottom: var(--space-md); color: var(--text-primary);">Send Bus Message</h2>
          <div style="display: flex; flex-direction: column; gap: var(--space-md);">
            <div class="input-group">
              <label class="input-label" for="msg-sender">Sender Agent</label>
              <select id="msg-sender" class="input"></select>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
              <input type="checkbox" id="msg-is-topic" style="accent-color: var(--accent);">
              <label for="msg-is-topic" style="font-size: 13px; color: var(--text-secondary); cursor: pointer; user-select: none;">Publish to Topic instead of Agent</label>
            </div>

            <div class="input-group" id="recipient-group">
              <label class="input-label" for="msg-recipient">Recipient Agent</label>
              <select id="msg-recipient" class="input"></select>
            </div>

            <div class="input-group" id="topic-group" style="display: none;">
              <label class="input-label" for="msg-topic">Topic Name</label>
              <input id="msg-topic" class="input" placeholder="e.g. notifications.alerts">
            </div>

            <div class="input-group">
              <label class="input-label" for="msg-payload-text">Message Text</label>
              <textarea id="msg-payload-text" class="input" style="height: 80px; resize: none;" placeholder="Type your message text here..."></textarea>
            </div>

            <button class="btn btn-primary" id="btn-send-msg" style="width: 100%;">
              Send Message
            </button>
          </div>
        </div>

        <!-- Inbox Logs Card -->
        <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; height: 380px;">
          <div style="padding: var(--space-md); border-bottom: 1px solid var(--border-muted); display: flex; justify-content: space-between; align-items: center;">
            <h2 style="font-size: 15px; font-weight: 600; color: var(--text-primary);">Inbox Messages</h2>
            <button class="btn btn-secondary btn-sm" id="btn-refresh-inbox">Refresh</button>
          </div>
          <div id="messages-inbox-list" style="overflow-y: auto; flex: 1;">
            <div style="padding: var(--space-xl); text-align: center; color: var(--text-muted); font-size: 13px;">Loading messages...</div>
          </div>
        </div>
      </div>

      <!-- Right side: Visualizer Graph -->
      <div class="card" style="padding: var(--space-md); display: flex; flex-direction: column; overflow: hidden; position: relative;">
        <div style="margin-bottom: var(--space-sm); display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 16px; font-weight: 600; color: var(--text-primary);">Bus Communication Graph</h2>
          <span style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block; animation: pulse 2s infinite;"></span>
            Live Event Listeners Active
          </span>
        </div>
        <div style="flex: 1; border: 1px solid var(--border-muted); border-radius: var(--radius-md); background: #0b0f19; overflow: hidden; height: 580px;">
          <canvas id="graph-canvas" style="display: block; width: 100%; height: 100%;"></canvas>
        </div>
      </div>
    </div>
  `;const o=document.getElementById("msg-sender"),a=document.getElementById("msg-recipient"),s=document.getElementById("msg-is-topic"),i=document.getElementById("recipient-group"),l=document.getElementById("topic-group"),p=document.getElementById("msg-topic"),v=document.getElementById("msg-payload-text"),h=document.getElementById("btn-send-msg"),C=document.getElementById("btn-refresh-inbox"),c=document.getElementById("messages-inbox-list"),m=document.getElementById("graph-canvas"),r=m.getContext("2d");let g=[],d=[],k=null;s.onchange=()=>{s.checked?(i.style.display="none",l.style.display="block"):(i.style.display="block",l.style.display="none")};function w(){const x=window.devicePixelRatio||1,y=m.parentElement.getBoundingClientRect();m.width=y.width*x,m.height=y.height*x,r.scale(x,x)}w(),window.addEventListener("resize",w);async function T(){if(n.serverOnline)try{g=(await ce.list()).agents||[],o.innerHTML="",a.innerHTML="",g.forEach(y=>{o.appendChild(e("option",{value:y.id,textContent:`${y.name} (${D(y.id)})`})),a.appendChild(e("option",{value:y.id,textContent:`${y.name} (${D(y.id)})`}))});try{k=await ce.me(),k&&k.id&&(o.value=k.id)}catch{}g.forEach(y=>{S(y.id,y.name)}),_()}catch{b("Failed to load agents list","error")}}async function A(){if(n.serverOnline)try{d=(await Ie.inbox(null,40)).messages||[],O(),d.forEach(y=>{y.sender_id&&y.recipient_id&&(S(y.sender_id),S(y.recipient_id),z.find(u=>u.source===y.sender_id&&u.target===y.recipient_id||u.source===y.recipient_id&&u.target===y.sender_id)||z.push({source:y.sender_id,target:y.recipient_id,activity:0}))})}catch(x){c.innerHTML=`<div style="padding: var(--space-xl); text-align: center; color: var(--text-danger); font-size: 13px;">Error loading inbox: ${x.message}</div>`}}function O(){if(c.innerHTML="",d.length===0){c.innerHTML='<div style="padding: var(--space-xl); text-align: center; color: var(--text-muted); font-size: 13px;">No messages received in inbox.</div>';return}d.forEach(x=>{var f,E,P;const y=x.status==="sent",N=((f=g.find(B=>B.id===x.sender_id))==null?void 0:f.name)||D(x.sender_id),u=x.recipient_id?((E=g.find(B=>B.id===x.recipient_id))==null?void 0:E.name)||D(x.recipient_id):null,I=e("div",{className:"inbox-item animate-fade-in",style:`padding: var(--space-md); border-bottom: 1px solid var(--border-muted); position: relative; ${y?"background: rgba(99, 102, 241, 0.05);":""}`},e("div",{style:"display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;"},e("span",{style:"font-size: 12px; font-weight: 600; color: var(--text-primary);"},u?`${N} ➔ ${u}`:`${N} ➔ Broadcast`),e("span",{style:"font-size: 10px; color: var(--text-muted);"},W(x.created_at))),x.topic?e("span",{className:"badge badge-purple",style:"font-size: 9px; padding: 1px 4px; margin-bottom: 4px; display: inline-block;",textContent:`#${x.topic}`}):null,e("p",{style:"font-size: 12px; color: var(--text-secondary); margin-bottom: var(--space-xs); font-family: var(--font-mono); word-break: break-all;",textContent:((P=x.payload)==null?void 0:P.text)||JSON.stringify(x.payload)}),y?e("button",{className:"btn btn-secondary btn-sm",style:"position: absolute; right: var(--space-md); bottom: var(--space-md); font-size: 10px; padding: 2px 8px;",textContent:"Ack",onclick:async B=>{B.stopPropagation();try{const Y=localStorage.getItem("axon_api_key");await Ie.ack(x.id),x.status="acknowledged",b("Message acknowledged!","success"),O()}catch(Y){b(`Ack failed: ${Y.message}`,"error")}}}):e("span",{style:"font-size: 10px; color: var(--text-muted); position: absolute; right: var(--space-md); bottom: var(--space-md);",textContent:"✓ Read"}));c.appendChild(I)})}h.onclick=async()=>{o.value;const x=s.checked,y=x?null:a.value,N=x?p.value.trim():null,u=v.value.trim();if(x&&!N){b("Topic Name is required!","error");return}if(!x&&!y){b("Recipient Agent is required!","error");return}if(!u){b("Message text is required!","error");return}h.disabled=!0,h.textContent="Sending...";try{await Ie.send(y,N,{text:u}),b("Message sent to bus!","success"),v.value="",await A()}catch(I){b(`Send failed: ${I.message}`,"error")}finally{h.disabled=!1,h.textContent="Send Message"}},C.onclick=A;const j=[],z=[];let $=[];function S(x,y=null){var u;let N=j.find(I=>I.id===x);if(!N){const I=m.getBoundingClientRect();N={id:x,name:y||((u=g.find(f=>f.id===x))==null?void 0:u.name)||x.slice(0,8),x:I.width/2+(Math.random()-.5)*120,y:I.height/2+(Math.random()-.5)*120,vx:0,vy:0,pulse:0},j.push(N)}return N}function _(){const x=m.getBoundingClientRect(),y=x.width||600,N=x.height||500,u=y/2,I=N/2,f=Math.min(y,N)*.35;j.forEach((E,P)=>{const B=P/j.length*2*Math.PI;E.x=u+Math.cos(B)*f,E.y=I+Math.sin(B)*f,E.vx=0,E.vy=0})}function R(){const x=m.getBoundingClientRect(),y=x.width||600,N=x.height||500,u=y/2,I=N/2;for(let f=0;f<j.length;f++){const E=j[f];for(let P=f+1;P<j.length;P++){const B=j[P],Y=B.x-E.x,ee=B.y-E.y,pe=Math.sqrt(Y*Y+ee*ee)||1,ge=140;if(pe<ge){const ue=(ge-pe)*.08,me=Y/pe*ue,Be=ee/pe*ue;E.vx-=me,E.vy-=Be,B.vx+=me,B.vy+=Be}}}z.forEach(f=>{const E=j.find(B=>B.id===f.source),P=j.find(B=>B.id===f.target);if(E&&P){const B=P.x-E.x,Y=P.y-E.y,ee=Math.sqrt(B*B+Y*Y)||1,ge=(ee-200)*.008,ue=B/ee*ge,me=Y/ee*ge;E.vx+=ue,E.vy+=me,P.vx-=ue,P.vy-=me}}),j.forEach(f=>{f.vx+=(u-f.x)*.015,f.vy+=(I-f.y)*.015,f.vx*=.75,f.vy*=.75,f.x+=f.vx,f.y+=f.vy,f.x=Math.max(30,Math.min(y-30,f.x)),f.y=Math.max(30,Math.min(N-30,f.y)),f.pulse>0&&(f.pulse-=.03)}),$=$.filter(f=>(f.progress+=.025,f.progress<1)),z.forEach(f=>{f.activity>0&&(f.activity-=.008)})}function V(){const x=m.getBoundingClientRect(),y=x.width||600,N=x.height||500;r.clearRect(0,0,y,N),z.forEach(u=>{const I=j.find(E=>E.id===u.source),f=j.find(E=>E.id===u.target);I&&f&&(r.beginPath(),r.moveTo(I.x,I.y),r.lineTo(f.x,f.y),u.activity>0?(r.strokeStyle=`rgba(129, 140, 248, ${.15+u.activity*.7})`,r.lineWidth=1.5+u.activity*2):(r.strokeStyle="rgba(51, 65, 85, 0.4)",r.lineWidth=1),r.stroke())}),j.forEach(u=>{u.pulse>0&&(r.beginPath(),r.arc(u.x,u.y,20+u.pulse*20,0,2*Math.PI),r.fillStyle=`rgba(129, 140, 248, ${u.pulse*.25})`,r.fill()),r.beginPath(),r.arc(u.x,u.y,14,0,2*Math.PI),r.fillStyle="#6366f1",r.strokeStyle="#818cf8",r.lineWidth=2.5,r.fill(),r.stroke(),r.font="bold 12px sans-serif",r.fillStyle="#f8fafc",r.textAlign="center",r.fillText(u.name,u.x,u.y-20),r.font="9px monospace",r.fillStyle="#64748b",r.fillText(D(u.id),u.x,u.y+24)}),$.forEach(u=>{const I=u.fromX+(u.toX-u.fromX)*u.progress,f=u.fromY+(u.toY-u.fromY)*u.progress;r.beginPath(),r.arc(I,f,5,0,2*Math.PI),r.fillStyle="#10b981",r.fill(),u.text&&(r.font="9px sans-serif",r.fillStyle="#34d399",r.fillText(u.text.length>15?u.text.slice(0,12)+"...":u.text,I,f-8))})}let H=null;function U(){R(),V(),H=requestAnimationFrame(U)}U();const ae=Oe(x=>{var y;if(x.type==="agent.message"){const N=x.payload;if(!N)return;const u=N.sender_id,I=N.recipient_id,f=S(u);if(f.pulse=1,I){const E=S(I);E.pulse=1;let P=z.find(B=>B.source===u&&B.target===I||B.source===I&&B.target===u);P||(P={source:u,target:I,activity:0},z.push(P)),P.activity=1,$.push({fromX:f.x,fromY:f.y,toX:E.x,toY:E.y,progress:0,text:((y=N.payload)==null?void 0:y.text)||N.topic||"Message"})}else N.topic&&j.forEach(E=>{E.id!==u&&($.push({fromX:f.x,fromY:f.y,toX:E.x,toY:E.y,progress:0,text:`#${N.topic}`}),E.pulse=.5)});d.unshift(N),O()}});await T(),await A();const de=()=>{document.getElementById("graph-canvas")||(ae(),cancelAnimationFrame(H),window.removeEventListener("resize",w),window.removeEventListener("hashchange",de))};window.addEventListener("hashchange",de)}G("messages",at);let te=null,Z=null;const ot=`
.landing-page-wrapper {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background-color: #030303;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0 24px;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-x: hidden;
  z-index: 1;
}

.landing-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  z-index: 10;
}

.landing-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.landing-logo-icon-box {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(236, 72, 153, 0.4);
}

.landing-logo-text {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
}

.landing-nav-right {
  display: flex;
  align-items: center;
}

.landing-login-toggle-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e4e4e7;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.landing-login-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.landing-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 800px;
  margin-top: 80px;
  margin-bottom: 40px;
  z-index: 2;
  text-align: center;
}

.pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 14px;
  border-radius: 20px;
  margin-bottom: 32px;
  backdrop-filter: blur(10px);
}

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #ec4899;
  box-shadow: 0 0 8px #ec4899;
  animation: landing-pulse 2s infinite;
}

@keyframes landing-pulse {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}

.pill-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: #a1a1aa;
}

.landing-title {
  font-size: 56px;
  line-height: 1.15;
  font-weight: 300;
  letter-spacing: -0.02em;
  color: #f4f4f5;
  margin-bottom: 20px;
}

.bold-title {
  font-weight: 800;
  color: #ffffff;
  background: linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.landing-subtitle {
  font-size: 15px;
  line-height: 1.6;
  color: #a1a1aa;
  max-width: 600px;
  margin: 0 auto 48px auto;
  font-weight: 400;
}

/* Countdown */
.countdown-container {
  display: flex;
  gap: 16px;
  margin-bottom: 48px;
  justify-content: center;
  width: 100%;
}

.countdown-card {
  background: rgba(15, 15, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px 0;
  width: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.countdown-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.1);
}

.countdown-num {
  font-size: 42px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  margin-bottom: 6px;
  font-family: 'JetBrains Mono', monospace;
}

.countdown-label {
  font-size: 10px;
  font-weight: 600;
  color: #71717a;
  letter-spacing: 0.1em;
}

/* Email Container */
.email-signup-container {
  display: flex;
  align-items: center;
  background: rgba(15, 15, 20, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 100px;
  padding: 6px 6px 6px 18px;
  width: 100%;
  max-width: 480px;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  position: relative;
  transition: border-color 0.3s ease;
}

.email-signup-container:focus-within {
  border-color: rgba(255, 255, 255, 0.20);
}

.email-icon-svg {
  color: #71717a;
  margin-right: 12px;
  flex-shrink: 0;
}

.email-input-field {
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 14px;
  flex: 1;
  padding: 8px 0;
  width: 100%;
}

.email-input-field::placeholder {
  color: #71717a;
}

.request-access-btn {
  background: #ffffff;
  color: #030303;
  border: none;
  border-radius: 100px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
}

.request-access-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

/* Auth Section styling */
.landing-auth-card {
  width: 100%;
  max-width: 420px;
  background: rgba(15, 15, 20, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 32px;
  box-sizing: border-box;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  animation: landing-fade-in 0.4s ease forwards;
  text-align: left;
}

.auth-title {
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 8px;
}

.auth-subtitle {
  font-size: 13px;
  color: #71717a;
  margin-bottom: 24px;
  line-height: 1.4;
}

.auth-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.auth-form-label {
  font-size: 12px;
  font-weight: 600;
  color: #a1a1aa;
}

.auth-form-input {
  background: rgba(15, 15, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 14px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.auth-form-input:focus {
  border-color: #ec4899;
}

.auth-submit-btn {
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
  width: 100%;
  margin-top: 8px;
  text-align: center;
}

.auth-submit-btn:hover {
  opacity: 0.95;
}

.auth-toggle-link {
  display: block;
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #ec4899;
  text-decoration: none;
  cursor: pointer;
}

.auth-back-link {
  display: block;
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: #71717a;
  text-decoration: none;
  cursor: pointer;
}

@keyframes landing-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.hidden {
  display: none !important;
}
`;function st(){let t=document.getElementById("landing-theme-styles");t||(t=document.createElement("style"),t.id="landing-theme-styles",t.textContent=ot,document.head.appendChild(t))}function it(t){const n=t.getContext("2d");let o,a=[],s=t.width=window.innerWidth,i=t.height=window.innerHeight;const l=Math.min(100,Math.floor(s*i/12e3)),p={x:null,y:null,radius:150};function v(){s=t.width=window.innerWidth,i=t.height=window.innerHeight}function h(r){p.x=r.clientX,p.y=r.clientY}function C(){p.x=null,p.y=null}window.addEventListener("resize",v),window.addEventListener("mousemove",h),window.addEventListener("mouseout",C);class c{constructor(){this.x=Math.random()*s,this.y=Math.random()*i,this.vx=(Math.random()-.5)*.4,this.vy=(Math.random()-.5)*.4,this.radius=Math.random()*1.5+.5}update(){this.x+=this.vx,this.y+=this.vy,(this.x<0||this.x>s)&&(this.vx=-this.vx),(this.y<0||this.y>i)&&(this.vy=-this.vy)}draw(){n.beginPath(),n.arc(this.x,this.y,this.radius,0,Math.PI*2),n.fillStyle="rgba(255, 255, 255, 0.4)",n.fill()}}for(let r=0;r<l;r++)a.push(new c);function m(){n.clearRect(0,0,s,i);const r=n.createRadialGradient(s/2,i/2,10,s/2,i/2,Math.max(s,i));r.addColorStop(0,"rgba(10, 10, 15, 0.3)"),r.addColorStop(1,"#030303"),n.fillStyle=r,n.fillRect(0,0,s,i),a.forEach(g=>{g.update(),g.draw()});for(let g=0;g<a.length;g++){const d=a[g];if(p.x!==null&&p.y!==null){const k=d.x-p.x,w=d.y-p.y,T=Math.sqrt(k*k+w*w);if(T<p.radius){const A=(1-T/p.radius)*.15;n.strokeStyle=`rgba(236, 72, 153, ${A})`,n.lineWidth=.5,n.beginPath(),n.moveTo(d.x,d.y),n.lineTo(p.x,p.y),n.stroke()}}for(let k=g+1;k<a.length;k++){const w=a[k],T=d.x-w.x,A=d.y-w.y,O=Math.sqrt(T*T+A*A);if(O<120){const j=(1-O/120)*.08;n.strokeStyle=`rgba(255, 255, 255, ${j})`,n.lineWidth=.5,n.beginPath(),n.moveTo(d.x,d.y),n.lineTo(w.x,w.y),n.stroke()}}}o=requestAnimationFrame(m)}return m(),()=>{cancelAnimationFrame(o),window.removeEventListener("resize",v),window.removeEventListener("mousemove",h),window.removeEventListener("mouseout",C)}}function rt(){const t=document.getElementById("content");te&&(te(),te=null),Z&&(clearInterval(Z),Z=null);const n=document.getElementById("sidebar"),o=document.querySelector("header");n&&(n.style.display="none"),o&&(o.style.display="none");const a=document.querySelector("main");a&&(a.style.marginLeft="0",a.style.padding="0",a.style.display="block",a.style.minHeight="100vh",a.style.background="#030303"),st();let s=!1;t.innerHTML="";const i=e("canvas",{id:"particle-canvas",style:"position: fixed; inset: 0; pointer-events: none; z-index: 0;"}),l=`
  <div class="landing-logo-icon-box">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  </div>
  `,p=`
  <svg class="email-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
  `,v=`
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
  `,h=e("div",{className:"landing-logo"});h.innerHTML=l+'<span class="landing-logo-text">DEPLOYAAI</span>';const C=e("button",{className:"landing-login-toggle-btn",textContent:"Developer Console"}),c=e("header",{className:"landing-header"},h,e("div",{className:"landing-nav-right"},C)),m=e("div",{className:"landing-hero-section"},e("div",{className:"pill-badge"},e("span",{className:"pill-dot"}),e("span",{className:"pill-text",textContent:"SYSTEM LAUNCH SEQUENCE ACTIVE"})),e("h1",{className:"landing-title"},"The Next Frontier of ",e("br"),e("span",{className:"bold-title",textContent:"Autonomous Workflows"})),e("p",{className:"landing-subtitle",textContent:"A high-performance execution layer. Deploy, coordinate, and orchestrate self-optimizing system tasks in under a minute. Zero maintenance. Zero latency."}),e("div",{className:"countdown-container"},e("div",{className:"countdown-card"},e("span",{className:"countdown-num",id:"countdown-days",textContent:"29"}),e("span",{className:"countdown-label",textContent:"DAYS"})),e("div",{className:"countdown-card"},e("span",{className:"countdown-num",id:"countdown-hours",textContent:"12"}),e("span",{className:"countdown-label",textContent:"HOURS"})),e("div",{className:"countdown-card"},e("span",{className:"countdown-num",id:"countdown-minutes",textContent:"53"}),e("span",{className:"countdown-label",textContent:"MINUTES"})),e("div",{className:"countdown-card"},e("span",{className:"countdown-num",id:"countdown-seconds",textContent:"14"}),e("span",{className:"countdown-label",textContent:"SECONDS"})))),r=e("input",{type:"email",className:"email-input-field",placeholder:"Enter your email for early access...",required:!0}),g=e("button",{type:"submit",className:"request-access-btn"});g.innerHTML="Request Access "+v;const d=e("div",{className:"email-signup-container"});d.innerHTML=p,d.appendChild(r),d.appendChild(g);const k=e("form",{className:"early-access-form"},d);k.addEventListener("submit",z=>{z.preventDefault();const $=r.value.trim();$&&(b(`Access requested for ${$}! We'll contact you soon.`,"success"),r.value="")}),m.appendChild(k);const w=e("div",{className:"landing-login-section hidden"});function T(){w.innerHTML="";const z=s?"Create account":"Welcome back",$=s?"Get started with your multi-tenant developer console":"Log in to manage your multi-agent infrastructure",S=s?"Sign Up":"Log In",_=s?"Already have an account? Log in":"Don't have an account? Sign up",R=e("input",{type:"email",className:"auth-form-input",placeholder:"name@company.com",required:!0}),V=e("input",{type:"password",className:"auth-form-input",placeholder:"••••••••",required:!0}),H=e("button",{type:"submit",className:"auth-submit-btn",textContent:S}),U=e("a",{className:"auth-toggle-link",textContent:_});U.addEventListener("click",y=>{y.preventDefault(),s=!s,T()});const ae=e("a",{className:"auth-back-link",textContent:"← Back to launch sequence"});ae.addEventListener("click",y=>{y.preventDefault(),w.classList.add("hidden"),m.classList.remove("hidden"),C.style.display="block"});const de=e("form",{style:"display: flex; flex-direction: column; gap: 16px;"},e("div",{className:"auth-form-group"},e("label",{className:"auth-form-label",textContent:"Email Address"}),R),e("div",{className:"auth-form-group"},e("label",{className:"auth-form-label",textContent:"Password"}),V),H,U,ae);de.addEventListener("submit",async y=>{y.preventDefault();const N=R.value.trim(),u=V.value;if(!N||!u){b("Please fill in all fields!","error");return}H.disabled=!0,H.textContent=s?"Creating account...":"Logging in...";try{let I;s?(I=await Se.signup(N,u),b("Account created successfully!","success")):(I=await Se.login(N,u),b("Welcome back!","success")),re(null,null,I.token),F("credentials",{apiKey:null,projectId:null,userToken:I.token}),j(),le("projects")}catch(I){b(I.message||"Authentication failed","error"),H.disabled=!1,H.textContent=S}});const x=e("div",{className:"landing-auth-card"},e("h2",{className:"auth-title",textContent:z}),e("p",{className:"auth-subtitle",textContent:$}),de);w.appendChild(x)}C.addEventListener("click",()=>{m.classList.add("hidden"),w.classList.remove("hidden"),C.style.display="none",T()});const A=e("div",{className:"landing-main-content"},m,w),O=e("div",{className:"landing-page-wrapper"},i,c,A);M(t,O),te=it(i),ct();function j(){te&&(te(),te=null),Z&&(clearInterval(Z),Z=null),n&&(n.style.display="block"),o&&(o.style.display="flex"),a&&(a.style.marginLeft="",a.style.padding="",a.style.display="",a.style.minHeight="",a.style.background="")}}function ct(){let t=localStorage.getItem("axon_launch_target");t||(t=Date.now()+720*60*60*1e3,localStorage.setItem("axon_launch_target",t)),t=parseInt(t,10);function n(){const o=Date.now(),a=t-o;if(a<=0){clearInterval(Z);const m=document.getElementById("countdown-days"),r=document.getElementById("countdown-hours"),g=document.getElementById("countdown-minutes"),d=document.getElementById("countdown-seconds");m&&(m.textContent="00"),r&&(r.textContent="00"),g&&(g.textContent="00"),d&&(d.textContent="00");return}const s=Math.floor(a/(1e3*60*60*24)),i=Math.floor(a%(1e3*60*60*24)/(1e3*60*60)),l=Math.floor(a%(1e3*60*60)/(1e3*60)),p=Math.floor(a%(1e3*60)/1e3),v=document.getElementById("countdown-days"),h=document.getElementById("countdown-hours"),C=document.getElementById("countdown-minutes"),c=document.getElementById("countdown-seconds");v&&(v.textContent=String(s).padStart(2,"0")),h&&(h.textContent=String(i).padStart(2,"0")),C&&(C.textContent=String(l).padStart(2,"0")),c&&(c.textContent=String(p).padStart(2,"0"))}n(),Z=setInterval(n,1e3)}G("login",rt);async function we(){const t=document.getElementById("content"),n=document.getElementById("sidebar"),o=document.querySelector("header");n&&(n.style.display="block"),o&&(o.style.display="flex");const a=document.querySelector("main");a&&a.style.marginLeft==="0px"&&(a.style.marginLeft="",a.style.padding="",a.style.display="",a.style.justifyContent="",a.style.alignItems="",a.style.minHeight="",a.style.background=""),t.innerHTML=`
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Projects</h1>
        <p class="page-subtitle">Manage your isolated multi-tenant project spaces and API credentials</p>
      </div>
      <button id="btn-create-project" class="btn btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M5 12h14M12 5v14"/></svg>
        <span>New Project</span>
      </button>
    </div>
    <div id="projects-grid" class="grid-3 animate-fade-in-up stagger-1">
      <div class="card skeleton skeleton-card"></div>
      <div class="card skeleton skeleton-card"></div>
      <div class="card skeleton skeleton-card"></div>
    </div>
  `;let s=[];try{s=await xe.list()}catch(c){b(c.message||"Failed to fetch projects","error")}const i=document.getElementById("projects-grid");if(i.innerHTML="",s.length===0)i.className="",M(i,e("div",{className:"empty-state animate-fade-in-up"},e("div",{className:"empty-state-icon",textContent:"📁"}),e("h3",{className:"empty-state-title",textContent:"No Projects Found"}),e("p",{className:"empty-state-text",textContent:"Create a new project to start registering agents, storing memories, and tracking receipts."}),e("button",{className:"btn btn-primary section-gap",textContent:"Create First Project"}).addEventListener("click",p)));else{i.className="grid-3 animate-fade-in-up stagger-1";const c=localStorage.getItem("axon_project_id");s.sort((m,r)=>m.id===c?-1:r.id===c?1:0),s.forEach(m=>{const r=m.id===c,g=e("button",{className:`btn ${r?"btn-secondary":"btn-primary"} btn-sm`,textContent:r?"Active Space":"Select Project"});r?g.disabled=!0:g.addEventListener("click",()=>C(m));const d=e("button",{className:"btn btn-secondary btn-sm",textContent:"Rotate Key"});d.addEventListener("click",()=>h(m));const k=e("div",{className:`card ${r?"active-project-card":""}`,style:r?"border-color: var(--accent-primary); background: rgba(99, 102, 241, 0.05);":""},e("div",{className:"card-header"},e("span",{className:"card-title",style:"font-size: 16px; font-weight: 700; color: var(--text-primary);",textContent:m.name}),r?e("span",{className:"badge badge-success",textContent:"Active"}):null),e("div",{style:"display: flex; flex-direction: column; gap: var(--space-sm); margin-bottom: var(--space-lg); font-size: 13px;"},e("div",{style:"display: flex; justify-content: space-between;"},e("span",{className:"mono",textContent:"ID:"}),e("span",{className:"mono",textContent:m.id})),e("div",{style:"display: flex; justify-content: space-between;"},e("span",{className:"mono",textContent:"Created:"}),e("span",{textContent:W(m.created_at)}))),e("div",{style:"display: flex; gap: var(--space-sm); justify-content: flex-end;"},d,g));M(i,k)})}const l=document.getElementById("btn-create-project");l&&l.addEventListener("click",p);function p(){const c=e("input",{className:"input",placeholder:"My Awesome Workspace...",required:!0}),m=e("div",{style:"display: flex; flex-direction: column; gap: var(--space-md); text-align: left;"},e("label",{className:"input-label",textContent:"Project Name"}),c);X("Create New Project",m,async()=>{const r=c.value.trim();if(!r)return b("Project name is required!","error"),!1;try{const g=await xe.create(r);return b(`Project "${r}" created successfully!`,"success"),v(g),s.length===0?await C(g):we(),!0}catch(g){return b(g.message||"Failed to create project","error"),!1}},"Create")}function v(c){const m=e("div",{className:"mono",style:"background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: var(--space-md); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-md); font-weight: bold; font-size: 14px; color: var(--text-primary);"},e("span",{textContent:c.api_key}),e("button",{className:"btn btn-secondary btn-sm",textContent:"Copy"}).addEventListener("click",()=>{navigator.clipboard.writeText(c.api_key),b("API Key copied to clipboard!","success")})),r=e("div",{style:"text-align: left;"},e("p",{style:"color: var(--color-warning); font-weight: bold; margin-bottom: var(--space-sm);",textContent:"⚠️ CRITICAL: Copy your Project API Key now!"}),e("p",{style:"font-size: 13px; color: var(--text-secondary); line-height: 1.4;",textContent:"This API key is hashed and stored securely. It will never be displayed again. Register your agents or construct your SDK instances using this key."}),m);X("Project Credentials Created",r,()=>!0,"Done")}async function h(c){const m=e("div",{style:"text-align: left;"},e("p",{style:"color: var(--color-error); font-weight: bold; margin-bottom: var(--space-sm);",textContent:"⚠️ WARNING: Key Rotation is a destructive action!"}),e("p",{style:"font-size: 13px; color: var(--text-secondary); line-height: 1.4;",textContent:"Any active agents using the current API Key will instantly fail to authenticate. You must reinitialize your SDKs and CLI with the new key."}));X("Rotate Project API Key",m,async()=>{try{const r=await xe.rotateKey(c.id);b("API Key rotated successfully!","success"),v(r);const g=localStorage.getItem("axon_project_id");return c.id===g&&re(r.api_key,r.id),we(),!0}catch(r){return b(r.message||"Failed to rotate API Key","error"),!1}},"Rotate Key")}async function C(c){let m=localStorage.getItem("axon_api_key");const r=localStorage.getItem("axon_project_id");if(c.api_key)m=c.api_key;else if(c.id!==r||!m){const g=e("input",{type:"password",className:"input",placeholder:"Enter API Key for this project...",required:!0}),d=e("div",{style:"display: flex; flex-direction: column; gap: var(--space-md); text-align: left;"},e("p",{style:"font-size: 13px; color: var(--text-secondary);",textContent:`Enter your API key for project "${c.name}" to connect.`}),g);if(!await new Promise(w=>{X("Select Active Project",d,()=>{const T=g.value.trim();return T?(m=T,w(!0),!0):(b("API key is required to connect!","error"),!1)},"Connect")}))return}re(m,c.id),F("credentials",{apiKey:m,projectId:c.id,userToken:localStorage.getItem("axon_user_token")}),he(c.id),b(`Workspace switched to project: "${c.name}"`,"success"),we()}}G("projects",we);async function lt(){var z,$;const t=document.getElementById("content");t.innerHTML=`
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Billing & Quota Control</h1>
        <p class="page-subtitle">Manage your cloud subscription plan and monitor multi-tenant usage metrics</p>
      </div>
    </div>
    <div class="grid-2 section-gap">
      <div class="card skeleton" style="height: 350px;"></div>
      <div class="card skeleton" style="height: 350px;"></div>
    </div>
  `;const n=new URLSearchParams(window.location.search),o=n.get("mock_checkout"),a=n.get("user_id");if(o==="success"&&a)try{await fetch("/v1/billing/webhook",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"subscription.updated",user_id:a})}),window.history.replaceState({},document.title,window.location.pathname+window.location.hash),b("Mock upgrade session completed successfully! You are now Pro.","success")}catch(S){console.error("Failed to trigger mock upgrade webhook:",S)}n.get("mock_portal")==="success"&&(window.history.replaceState({},document.title,window.location.pathname+window.location.hash),b("Mock billing customer portal loaded successfully.","info"));let i="free",l="active",p=0,v=0,h=0;try{const S=await Se.me();p=(await xe.list().catch(()=>[])).length,localStorage.getItem("axon_project_id")&&(v=((z=(await ce.list().catch(()=>({agents:[]}))).agents)==null?void 0:z.length)||0,h=(($=(await ie.list().catch(()=>({memories:[]}))).memories)==null?void 0:$.length)||0);const V=await fetch("/v1/billing/webhook",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"query",user_id:S.user_id})}).then(H=>H.json()).catch(()=>({plan:"free",status:"active"}));i=V.plan||"free",l=V.status||"active"}catch(S){console.error("Failed to resolve billing details:",S)}t.innerHTML="";const C=e("div",{className:"page-header animate-fade-in"},e("div",{},e("h1",{className:"page-title",textContent:"Billing & Quota Control"}),e("p",{className:"page-subtitle",textContent:"Manage your cloud subscription plan and monitor multi-tenant usage metrics"}))),c=i==="free"?1:10,m=i==="free"?3:50,r=i==="free"?1e3:1e5,g=i==="free"?"5 req/min":"300 req/min",d=(S,_,R)=>{const V=Math.min(100,Math.round(_/R*100)),H=30,U=2*Math.PI*H,ae=U-V/100*U;return e("div",{style:"display: flex; flex-direction: column; align-items: center; gap: var(--space-sm); background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(255, 255, 255, 0.03); border-radius: var(--radius-md); padding: var(--space-md) var(--space-lg); min-width: 140px; transition: transform 0.2s ease, border-color 0.2s ease;"},e("div",{style:"position: relative; width: 80px; height: 80px;"},e("div",{innerHTML:`
            <svg width="80" height="80" style="transform: rotate(-90deg); overflow: visible;">
              <defs>
                <linearGradient id="billing-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--accent-primary, #8b5cf6)" />
                  <stop offset="100%" stop-color="var(--accent-secondary, #ec4899)" />
                </linearGradient>
              </defs>
              <circle cx="40" cy="40" r="${H}" stroke="var(--bg-tertiary, #1f2937)" stroke-width="6" fill="transparent" />
              <circle cx="40" cy="40" r="${H}" stroke="url(#billing-ring-grad)" stroke-width="6" fill="transparent"
                stroke-dasharray="${U}" 
                stroke-dashoffset="${ae}"
                style="stroke-linecap: round; transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);" />
            </svg>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: var(--text-primary);">
              ${V}%
            </div>
          `})),e("span",{style:"font-size: 13px; font-weight: 700; color: var(--text-secondary); text-align: center;",textContent:S}),e("span",{style:"font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);",textContent:`${_} / ${R}`}))},k=e("div",{className:"card animate-fade-in-up stagger-1",style:"padding: var(--space-xl); background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05);"},e("div",{className:"card-header",style:"margin-bottom: var(--space-lg);"},e("span",{className:"card-title",style:"font-size: 16px; font-weight: 700;",textContent:"Current Resource Allocations"}),e("span",{className:`badge ${i==="pro"?"badge-purple":"badge-info"}`,textContent:`Active: ${i.toUpperCase()}`})),e("div",{style:"display: flex; flex-wrap: wrap; gap: var(--space-lg); justify-content: space-around; margin-top: var(--space-xl);"},d("Projects Managed",p,c),d("Registered Agents",v,m),d("Semantic Memories",h,r)),e("div",{style:"display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; border-top: 1px solid var(--border-color); padding-top: var(--space-lg); margin-top: var(--space-xl); color: var(--text-secondary);"},e("span",{textContent:"Lock Operations Rate Limit"}),e("span",{className:"badge badge-dark",style:"font-family: var(--font-mono); font-size: 12px;",textContent:g}))),w=async(S,_)=>{_.disabled=!0,_.innerHTML='<span class="spinner" style="margin-right: 8px;"></span>Redirecting securely...';try{let R;S==="pro"?R=await Ae.checkout(window.location.origin):R=await Ae.portal(window.location.origin),document.getElementById("content").style.opacity="0.3",setTimeout(()=>{window.location.href=R.url||R.checkout_url||R.portal_url},300)}catch(R){b(R.message||"Billing session redirect failed","error"),_.disabled=!1,_.innerHTML=S==="pro"?"Upgrade to Cloud Pro":"Manage Subscription"}},T=e("button",{className:"btn btn-secondary",style:"width: 100%; justify-content: center; padding: var(--space-md); font-weight: 700; margin-top: var(--space-xl);",textContent:i==="free"?"Current Active Plan":"Manage Downgrade"});i!=="free"?T.addEventListener("click",S=>w("free",T)):T.disabled=!0;const A=e("button",{className:"btn btn-primary",style:"width: 100%; justify-content: center; padding: var(--space-md); font-weight: 700; margin-top: var(--space-xl); background: var(--accent-gradient); border: none; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);",textContent:i==="pro"?"Manage Subscription":"Upgrade to Cloud Pro"});A.addEventListener("click",S=>w(i==="pro"?"portal":"pro",A));const O=e("div",{className:"grid-2 section-gap",style:"margin-top: var(--space-xl);"},e("div",{className:"card animate-fade-in-up stagger-2",style:`
        display: flex; flex-direction: column; justify-content: space-between; 
        background: rgba(255, 255, 255, 0.02); 
        backdrop-filter: blur(12px); 
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        position: relative;
        overflow: hidden;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
      `},e("div",{},e("div",{style:"display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);"},e("h3",{style:"font-size: 18px; font-weight: 700; color: var(--text-primary);",textContent:"Free Tier"}),i==="free"?e("span",{className:"badge badge-success",textContent:"Active"}):null),e("div",{style:"margin-bottom: var(--space-lg);"},e("span",{style:"font-size: 32px; font-weight: 800; color: var(--text-primary);",textContent:"$0"}),e("span",{style:"font-size: 13px; color: var(--text-muted); margin-left: 4px;",textContent:"/ forever"})),e("p",{style:"font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: var(--space-xl);",textContent:"Perfect for prototyping, testing agent coordination, and single-project evaluation."}),e("ul",{style:"display: flex; flex-direction: column; gap: var(--space-md); font-size: 13px; color: var(--text-secondary); list-style: none; padding: 0; margin: 0;"},e("li",{textContent:"✔ 1 Active Database Project"}),e("li",{textContent:"✔ Max 3 Registered Agents"}),e("li",{textContent:"✔ 1,000 vector memory entries"}),e("li",{textContent:"✔ 5 lock operations/min rate limit"}),e("li",{textContent:"✔ reasoning logs chain integrity verification"}))),T),e("div",{className:"card animate-fade-in-up stagger-3",style:`
        display: flex; flex-direction: column; justify-content: space-between; 
        background: rgba(139, 92, 246, 0.04); 
        backdrop-filter: blur(12px); 
        border: 1px solid rgba(139, 92, 246, 0.2);
        box-shadow: 0 8px 32px 0 rgba(139, 92, 246, 0.08);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        position: relative;
        overflow: hidden;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
      `},e("div",{},e("div",{style:"position: absolute; top: -50px; right: -50px; width: 120px; height: 120px; border-radius: var(--radius-full); background: radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(236,72,153,0.1) 100%); filter: blur(20px); pointer-events: none;"}),e("div",{style:"display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);"},e("h3",{style:"font-size: 18px; font-weight: 700; color: var(--text-primary);",textContent:"Cloud Pro Tier"}),i==="pro"?e("span",{className:"badge badge-purple",textContent:"Active"}):e("span",{className:"badge badge-purple",textContent:"Popular"})),e("div",{style:"margin-bottom: var(--space-lg);"},e("span",{style:"font-size: 32px; font-weight: 800; color: var(--text-primary);",textContent:"$29"}),e("span",{style:"font-size: 13px; color: var(--text-muted); margin-left: 4px;",textContent:"/ month"})),e("p",{style:"font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: var(--space-xl);",textContent:"Designed for production workloads with large persistent memories and high lock density."}),e("ul",{style:"display: flex; flex-direction: column; gap: var(--space-md); font-size: 13px; color: var(--text-secondary); list-style: none; padding: 0; margin: 0;"},e("li",{textContent:"✔ Up to 10 Active Scoped Projects"}),e("li",{textContent:"✔ Up to 50 Concurrent Agents"}),e("li",{textContent:"✔ 100,000 vector memory entries"}),e("li",{textContent:"✔ 300 lock operations/min rate limit"}),e("li",{textContent:"✔ Priority WebSocket event propagation"}),e("li",{textContent:"✔ Custom vector embedding dimensions"}))),A)),j=e("div",{className:"section-gap"},k,O);M(t,C,j)}G("billing",lt);async function dt(){console.log("[Axon App] Initializing..."),await _e();const t=localStorage.getItem("axon_api_key"),n=localStorage.getItem("axon_project_id"),o=localStorage.getItem("axon_user_token");o?(re(t||null,n||null,o),F("credentials",{apiKey:t||null,projectId:n||null,userToken:o}),n&&he(n)):le("login"),De(),Ne(),setInterval(_e,5e3),Ge("dashboard")}async function _e(){try{if(await Re.ping(),!K().serverOnline){F("serverOnline",!0);const t=K().credentials;t.apiKey&&t.projectId&&he(t.projectId)}}catch{K().serverOnline&&(F("serverOnline",!1),$e())}}function pt(){const t=e("div",{style:"display: flex; flex-direction: column; gap: var(--space-md); text-align: left;"},e("p",{style:"font-size: 13px; color: var(--text-secondary); line-height: 1.4;",textContent:"Axon Dashboard needs credentials to query resources. Register a new agent or connect using existing SDK credentials."}),e("div",{className:"input-group"},e("label",{className:"input-label",textContent:"API Key (Token)"}),e("input",{id:"setup-key",className:"input mono",placeholder:"Enter API Key..."})),e("div",{className:"input-group"},e("label",{className:"input-label",textContent:"Project ID"}),e("input",{id:"setup-project",className:"input mono",placeholder:"Enter Project ID..."})),e("p",{style:"font-size: 11px; color: var(--text-muted);",textContent:`Don't have credentials? Cancel and go to the "Agents" tab to register one.`}));X("Connect to Axon Project",t,async()=>{const n=document.getElementById("setup-key").value.trim(),o=document.getElementById("setup-project").value.trim();if(!n||!o)return b("Both API Key and Project ID are required!","error"),!1;localStorage.setItem("axon_api_key",n),localStorage.setItem("axon_project_id",o),re(n,o),F("credentials",{apiKey:n,projectId:o}),he(o),b("Credentials loaded successfully!","success");const a=Te();return le(a),!0},"Connect")}document.addEventListener("click",t=>{const n=t.target.closest(".header-right");n&&n.textContent.includes("PROJECT:")&&pt()});dt().catch(t=>{console.error("[Axon App] Failed to initialize:",t)});

"use strict";(function(){const _=["يناير","فبراير","مارس","أبريل","ماي","يونيو","يوليوز","غشت","شتنبر","أكتوبر","نونبر","دجنبر"],h=t=>String(t??"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i]),S=t=>{if(!t)return"";const i=/^(\d{4})-(\d{2})-(\d{2})/.exec(t);return i?`${i[3]}/${i[2]}/${i[1]}`:t},L=t=>{const i=/^(\d{4})-(\d{2})-(\d{2})/.exec(t||"");return i?new Date(Date.UTC(+i[1],i[2]-1,+i[3])):null},at=t=>t.toISOString().slice(0,10),st=(t,i)=>{const e=L(t),s=L(i);return!e||!s||s<e?0:Math.round((s-e)/864e5)+1},rt=t=>(t=+t||0,t<=0?"":t===1?"يوم واحد":t===2?"يومان":t<=10?`${t} أيام`:`${t} يوما`),T=t=>t?`${t.firstAr||""} ${t.lastAr||""}`.trim():"",nt=()=>{const t=new Date;return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`},r=(t,i="")=>{const e=String(t??"").trim();return e?`<span class="v ${i}">${h(e)}</span>`:`<span class="v empty ${i}"></span>`},p=(t,i)=>r(S(t),i),a=t=>`<span class="lb">${t}</span>`,F=t=>`<span class="cb">${t?"✕":""}</span>`,N=t=>`<span dir="ltr" class="ltr">${t}</span>`,w={kingdom:"ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ",ministry:"ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⴼⴰ",academy:"ⵜⴰⴽⴰⴷⵉⵎⵉⵜ ⵜⴰⵏⴳⵎⴰⵢⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⴰⵢⵏ",directorate:"ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ"},J=(t,i,e)=>{const s=Math.max(6,String(t||"").length)*(e?.53:i?.36:.47);return`<div class="${i?"k":""}" style="font-size:min(var(${i?"--fsk":"--fs"}), calc(100cqw / ${s.toFixed(2)}))">${h(t||"")}</div>`},P={ا:"ⴰ",أ:"ⴰ",إ:"ⵉ",آ:"ⴰ",ب:"ⴱ",ت:"ⵜ",ث:"ⵜ",ج:"ⵊ",ح:"ⵃ",خ:"ⵅ",د:"ⴷ",ذ:"ⴷ",ر:"ⵔ",ز:"ⵣ",س:"ⵙ",ش:"ⵛ",ص:"ⵚ",ض:"ⴹ",ط:"ⵟ",ظ:"ⴹ",ع:"ⵄ",غ:"ⵖ",ف:"ⴼ",ق:"ⵇ",ك:"ⴽ",ڭ:"ⴳ",گ:"ⴳ",ل:"ⵍ",م:"ⵎ",ن:"ⵏ",ه:"ⵀ",ة:"ⴰ",و:"ⵓ",ي:"ⵉ",ى:"ⴰ",ئ:"ⵉ",ؤ:"ⵓ",ء:""},E={"سوس ماسة":"ⵙⵓⵙ ⵎⴰⵙⵙⴰ","اكادير اداوتنان":"ⴰⴳⴰⴷⵉⵔ ⵉⴷⴰⵡⵜⴰⵏⴰⵏ","انزكان ايت ملول":"ⵉⵏⵣⴳⴳⴰⵏ ⴰⵢⵜ ⵎⵍⵍⵓⵍ","اشتوكة ايت باها":"ⵛⵜⵓⴽⴰ ⴰⵢⵜ ⴱⴰⵀⴰ","شتوكة ايت باها":"ⵛⵜⵓⴽⴰ ⴰⵢⵜ ⴱⴰⵀⴰ",تارودانت:"ⵜⴰⵔⵓⴷⴰⵏⵜ",تيزنيت:"ⵜⵉⵣⵏⵉⵜ",طاطا:"ⵟⴰⵟⴰ","مراكش اسفي":"ⵎⵕⵕⴰⴽⵛ ⴰⵙⴼⵉ","كلميم واد نون":"ⴳⵍⵎⵉⵎ ⵡⴰⴷ ⵏⵓⵏ","درعة تافيلالت":"ⴷⵔⵄⴰ ⵜⴰⴼⵉⵍⴰⵍⵜ","الرباط سلا القنيطرة":"ⵕⵕⴱⴰⵟ ⵙⵍⴰ ⵇⵏⵉⵟⵕⴰ","الدار البيضاء سطات":"ⴰⵏⴼⴰ ⵙⵟⵟⴰⵜ","فاس مكناس":"ⴼⴰⵙ ⵎⴽⵏⴰⵙ","بني ملال خنيفرة":"ⴰⵢⵜ ⵎⵍⵍⴰⵍ ⵅⵏⵉⴼⵕⴰ",الشرق:"ⴰⴳⵎⵎⵓⴹ","طنجة تطوان الحسيمة":"ⵟⴰⵏⵊⴰ ⵜⵉⵟⵟⴰⵡⵉⵏ ⵍⵃⵓⵙⵉⵎⴰ","العيون الساقية الحمراء":"ⵍⵄⵢⵓⵏ ⵙⴰⴳⵉⵢⵜ ⵍⵃⴰⵎⵔⴰ","الداخلة وادي الذهب":"ⴷⴷⴰⵅⵍⴰ ⵡⴰⴷ ⴷⴷⴰⵀⴰⴱ",ورزازات:"ⵡⴰⵔⵣⴰⵣⴰⵜ",زاكورة:"ⵣⴰⴳⵓⵔⴰ",تنغير:"ⵜⵉⵏⵖⵉⵔ",الرشيدية:"ⵔⵔⴰⵛⵉⴷⵉⵢⴰ",ميدلت:"ⵎⵉⴷⵍⵜ",كلميم:"ⴳⵍⵎⵉⵎ","سيدي افني":"ⵙⵉⴷⵉ ⵉⴼⵏⵉ",طانطان:"ⵟⴰⵏⵟⴰⵏ",الحوز:"ⵍⵃⴰⵡⵣ"},ot=t=>String(t||"").replace(/[ًٌٍَُِّْـ]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/\s+/g," ").trim(),q=t=>{const i=ot(t).replace(/^(جهة|لجهة|بجهة|اقليم|عمالة|مديرية)\s+/,"");if(!i)return"";if(E[i])return E[i];const e=Object.keys(E).find(s=>s.replace(/\s/g,"")===i.replace(/\s/g,"").replace(/^ال/,"")||s.replace(/\s/g,"")===i.replace(/\s/g,""));return e?E[e]:i.split(" ").map(s=>Array.from(s.replace(/^ال(?=..)/,"")).map(n=>P[n]!=null?P[n]:n).join("")).join(" ")},O=t=>{t=String(t||"").trim();const i=/^(.*?(?:والتكوين|و التكوين))\s*[-–:،,]?\s*(?:ل?جهة\s*:?\s*|ل)?(.*)$/.exec(t);return i?[i[1].trim(),i[2].trim()]:[t,""]},dt=t=>O(t)[1],lt=t=>(t=String(t||"").trim(),t?t.startsWith("ال")?"لل"+t.slice(2):"ل"+t:"");function W(t,i,e,s){s=s||{};const n=String(t.academy||"").trim(),d=R(t.directorate),o=[`${s.noTo?"":"إلى "}السيد المدير الإقليمي ${n?lt(n):"للأكاديمية الجهوية للتربية والتكوين .........."}`.trim(),`بالمديرية الإقليمية ${d||".........."}`],l=String(i||"").trim(),c=String(e||"").trim();return l&&o.push(/^(مصلحة|قسم|المركز|مركز|خلية|الكتابة|وحدة)/.test(l)?l:"مصلحة "+l),c&&o.push(/^(مكتب|وحدة)/.test(c)?c:"مكتب "+c),o}const R=t=>String(t||"").replace(/^\s*(?:ال)?مديرية\s+(?:ال)?إ?ا?قليمية\s*(?:ل|ب|-|–|:)?\s*/,"").replace(/^(?:عمالة|إقليم|اقليم)\s+/,"").trim(),ct=t=>{if(t=String(t||"").trim(),t.length<=26)return[t];const i=[],e=/\sو(?=\S)/g;let s;for(;s=e.exec(t);)i.push(s.index);if(!i.length)return[t];const n=t.length/2,d=i.reduce((o,l)=>Math.abs(l-n)<Math.abs(o-n)?l:o,i[0]);return[t.slice(0,d).trim(),t.slice(d).trim()]},D=t=>String(t||"").split(/\s*(?:\n|\/|\|)\s*/).map(i=>i.trim()).filter(Boolean);function U(t){const i=(g,$)=>t[g]==null||String(t[g]).trim()===""?$:t[g],[e,s]=O(t.academy),n=["المملكة المغربية"].concat(ct(t.ministry),[e],s?["جهة "+s.replace(/^جهة\s+/,"")]:[],[String(t.directorate||"").trim()]).filter(Boolean),d=i("tifMinistry",w.ministry),o=[i("tifKingdom",w.kingdom)];o.push(...d===w.ministry?["ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ","ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⴼⴰ"]:D(d)),o.push(...D(i("tifAcademy",w.academy)));const l=String(t.tifRegion||"").trim();l?o.push(...D(l)):s&&o.push("ⵜⴰⵎⵏⴰⴹⵜ "+q(s));const c=i("tifDirectorate",w.directorate),m=R(t.directorate);return o.push(...c===w.directorate&&m?[c+" "+q(m)]:D(c)),{ar:n,tf:o.filter(Boolean)}}const I=(t,i,e,s)=>{const n=Math.max(8,...t.map(d=>String(d).length))*i;return`<div class="hdr-txt ${e}"${s||""} style="--fit:calc(100cqw / ${n.toFixed(2)})">${t.map(d=>`<div>${h(d)}</div>`).join("")}</div>`},mt='<svg class="hdr-wave" viewBox="0 0 1000 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 29H120C142 29 146 11 168 11H866C888 11 892 30 914 30H990" fill="none" stroke="#183c8c" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>',ht=[["ruqaa","الشكل الجديد: موجة زرقاء وخط بني (مثل الرأسية الرسمية)"],["classic","الشكل الكلاسيكي (خط أميري، 4 أسطر)"]],C=t=>String(t||"").replace(/["'<>;{}\\\n]/g,"").trim().slice(0,60),K=t=>{const i=C(t&&t.hdrFont);return(i?"'"+i+"',":"")+"'MAJT','Amiri',serif"},V=t=>C(t&&(t.hdrFontT!==void 0?t.hdrFontT:t.hdrFont)),Y=t=>{const i=V(t);return(i?"'"+i+"',":"")+"'Tif',sans-serif"};function pt(t,i,e){const s=U(t),n=!!C(t.hdrFont);return`<div class="hdr hv2" style="--hf:${K(t).replace(/"/g,"&quot;")};--hft:${Y(t).replace(/"/g,"&quot;")}">${mt}
      <div class="hdr-g">
        ${I(s.ar,n?.5:.36,"hdr-ar")}
        <div class="hdr-emb"><img src="assets/emblem.png"></div>
        ${I(s.tf,.56,"hdr-tif",' lang="zgh" dir="ltr"')}
      </div>
      ${t.school&&!e?`<div class="hdr-sch2">${h(t.school)}</div>`:""}
      ${i?`<div class="srv">${h(i)}</div>`:""}
    </div>`}function z(t,i,e){const s=!!(e&&e.dirOnly);if(!s&&t.headerMode==="image"&&t.letterhead){const m=i?`<div class="srv-l">${h(i)}</div>`:"";if(t.letterheadP&&t.lhNorm!==!1){const $=!!(e&&e.transparent&&t.letterheadT),b=$?t.letterheadT:t.letterheadP,v=$?t.letterheadLT||"":t.letterheadL,f=v?`<img class="lh-l" src="${h(v)}" width="${+t.llW}" height="${+t.llH}">`:"";return`<div class="hdr-img lhn${f?"":" one"}${$?" tr":""}"><img class="lh-p" src="${h(b)}" width="${+t.lpW}" height="${+t.lpH}">${f}</div>${m}`}const g=t.letterheadW&&t.letterheadH?` width="${+t.letterheadW}" height="${+t.letterheadH}"`:"";return`<div class="hdr-img"><img src="${h(t.letterhead)}"${g}></div>${m}`}if((t.headerStyle||"ruqaa")!=="classic")return pt(t,i,s);const n=(m,g)=>t[m]==null||String(t[m]).trim()===""?g:t[m],d=["المملكة المغربية",t.ministry,t.academy,t.directorate],o=[n("tifKingdom",w.kingdom),n("tifMinistry",w.ministry),n("tifAcademy",w.academy),n("tifDirectorate",w.directorate)],l=!!C(t.hdrFont),c=!!V(t);return`<div class="hdr${l?" cfa":""}${c?" cft":""}"${l||c?` style="--hf:${K(t).replace(/"/g,"&quot;")};--hft:${Y(t).replace(/"/g,"&quot;")}"`:""}>
      <div class="hdr-g">
        <div class="hdr-txt">${d.map((m,g)=>J(m,g===0,!1)).join("")}</div>
        <div class="hdr-emb"><img src="assets/emblem.png"></div>
        <div class="hdr-txt hdr-tif" lang="zgh">${o.map((m,g)=>J(m,g===0,!0)).join("")}</div>
      </div>
      ${t.school&&!s?`<div class="hdr-sch2">${h(t.school)}</div>`:""}
      ${i?`<div class="srv">${h(i)}</div>`:""}
    </div>`}const k={};k.inquiry=({s:t,e:i,f:e})=>`
    ${z(t)}
    <div class="row2 mt2">
      <div>${a("المؤسسة :")} ${r(t.school,"b")}</div>
      <div class="to">
        <div>${a("إلى :")}</div>
        <div>${a("السيد (ة) :")} ${r(T(i),"b")}</div>
        <div>${a("رقم التأجير :")} ${r(i.ppr)}</div>
      </div>
    </div>
    <p class="mt">${a("<u>الموضوع</u> :")} <b>استفسار.</b></p>
    <p>${a("<u>المرجع</u> :")} المرسوم رقم 2.99.1216 الصادر في 6 صفر 1421 (2000/05/10).</p>
    <p class="c b mt">سلام تام بوجود مولانا الإمام المؤيد بالله،</p>
    <p class="j">وبعد، لقد بلغ إلى علمي أنك(م) تغيبت(م) عن عملك(م) خلال الفترة المتراوحة ما بين: ${a("من")} ${p(e.from,"b")} ${a("إلى")} ${p(e.to,"b")}
      بدون إشعار أو إذن سابق، الشيء الذي يتنافى والقوانين الجاري بها العمل.</p>
    <p class="j">لذا، وقبل اتخاذ قرار الخصم من مرتبك(م) طبقا لمقتضيات المرسوم المشار إليه في المرجع أعلاه ولاسيما المادة 4 منه،
      يشرفني أن أطلب منك(م) موافاتي بالبيانات المفصلة في الموضوع مصحوبة بالوثائق المبررة وذلك في أجل لا يتعدى
      <b>${h(e.deadline||15)}</b> يوما ابتداء من تاريخ توصلك(م) بهذا الاستفسار.</p>
    <p class="l b">والسلام.</p>
    <div class="row2">
      <div>${a("التاريخ :")} ${p(e.date)}</div>
      <div class="c b">توقيع الرئيس المباشر :</div>
    </div>
    <div class="spacer"></div>
    <div class="cut"><span>✂</span></div>
    <div class="subtitle">إشعار باستلام استفسار</div>
    <p>${a("يشهد السيد (ة) :")} ${r(T(i),"b")} &nbsp; ${a("رقم التأجير :")} ${r(i.ppr)}</p>
    <p>أنه توصل(ت) باستفسار عن التغيب خلال الفترة المتراوحة ${a("من :")} ${p(e.from)} ${a("إلى :")} ${p(e.to)}</p>
    <div class="row2 mt">
      <div>${a("التاريخ :")} ${p(e.receiptDate)}</div>
      <div class="c b">التوقيع :</div>
    </div>`,k.leave=({s:t,e:i,f:e,history:s})=>{const n=["مرضية","أغراض شخصية","استثنائية","ولادة"],d=(s||[]).slice(0,4);for(;d.length<4;)d.push(null);return`
    ${z(t,"مصلحة الموارد البشرية ـ مكتب الرخص الإدارية والتغيبات")}
    <div class="title-box">طلب رخصة</div>
    <div class="grid2">
      <div>${a("الاسم الكامل :")} ${r(T(i),"b")}</div><div>${a("ر.ت :")} ${r(i.ppr)}</div>
      <div>${a("الإطار :")} ${r(i.cadre)}</div><div>${a("تاريخ الازدياد :")} ${p(i.birth)}</div>
    </div>
    <div class="types">${a("نوع الرخصة :")} ${n.map(o=>`<span class="opt">${F(e.leaveType===o)} ${o}</span>`).join("")}</div>
    <p>${a("مدتها :")} ${r(e.duration,"b")} &nbsp; ${a("من :")} ${p(e.from,"b")} &nbsp; ${a("إلى :")} ${p(e.to,"b")}</p>
    <p>${a("العنوان الشخصي للموظف :")} ${r(e.address)}</p>
    <div class="row2 mt">
      <div class="b">توقيع الموظف :</div>
      <div>${a("حرر ب :")} ${r(e.city)} ${a("في :")} ${p(e.date)}</div>
    </div>
    <div class="spacer-s"></div>
    <p class="mt">${a("رأي السيد المدير :")} ${r(e.opinion)}</p>
    <p>${a("تاريخ توقيف الموظف عن العمل :")} ${p(e.stopDate)}</p>
    <div class="tcap">جدول الرخص والتغيبات التي استفاد منها الموظف خلال 12 شهرا الأخيرة</div>
    <table class="tbl">
      <thead><tr><th style="width:22%">المدة</th><th style="width:20%">من</th><th style="width:20%">إلى</th><th>السبب</th></tr></thead>
      <tbody>${d.map(o=>`<tr><td>${o?h(o.duration):""}</td><td>${o?S(o.from):""}</td><td>${o?S(o.to):""}</td><td>${o?h(o.reason):""}</td></tr>`).join("")}</tbody>
    </table>
    <div class="row2 mt">
      <div>${a("حرر ب :")} ${r(e.city)} ${a("في :")} ${p(e.date2)}</div>
      <div class="c"><div class="b">توقيع رئيس المؤسسة :</div><div class="sigbox"></div></div>
    </div>`},k.certificate=({s:t,e:i,f:e})=>{const s=/الفرنسية/.test(e.certType||""),n=(d,o,l,c)=>`<tr><td class="lbc">${d}</td><td class="vc">${o}</td>${l!==void 0?`<td class="frc">${s?N(`${l} : <b>${h(c||"")}</b>`):""}</td>`:"<td></td>"}</tr>`;return`
    <div class="row2 top">
      <div class="b">الحمد لله وحده</div>
      <div>${r(e.city)} ${a("في :")} ${p(e.date)}</div>
    </div>
    <table class="kv mt">
      ${n("الاسم العائلي :",r(i.lastAr,"b"),"Nom",i.lastFr)}
      ${n("الاسم الشخصي :",r(i.firstAr,"b"),"Prénom",i.firstFr)}
      ${n("الرقم المالي :",r(i.ppr))}
      ${n("تاريخ الازدياد :",p(i.birth))}
      ${n("رقم ب.ت.و :",r(i.cin,"ltr"))}
      ${n("تاريخ التوظيف :",p(i.hire))}
      ${n("الإطار :",r(i.cadre))}
      ${n("المهمة :",r(i.task))}
      ${n("مقر العمل الأصلي :",r(i.origin))}
      ${n("مؤسسة التكليف <sup>(1)</sup> :",r(i.assigned))}
    </table>
    <div class="addr">
      <div class="c b">إلــى</div>
      ${W(t,"مصلحة الموارد البشرية","مكتب تتبع الحياة الإدارية للموظفين",{noTo:!0}).map(d=>`<div class="c">${h(d)}</div>`).join("")}
      <div class="c">تحت إشراف السيد مدير : <b>${h(t.school)}</b></div>
    </div>
    <p class="mt">${a("الموضوع <sup>(2)</sup> :")} <b>طلب ${h(e.certType||"")}</b></p>
    <p class="c b">سلام تام بوجود مولانا الإمام المؤيد بالله،</p>
    <p>وبعد،</p>
    <p class="j">يشرفني أن أطلب من سيادتكم موافاتي بالشهادة المذكورة في الموضوع أعلاه قصد الإدلاء بها ${h(e.purpose||"لأغراض إدارية")}.</p>
    <div class="row2 mt">
      <div class="c b">إمضاء الموظف :</div>
      <div class="c b">توقيع وطابع رئيس المؤسسة :</div>
    </div>
    <div class="spacer"></div>
    <div class="row2 small">
      <div></div>
      <div><div>${a("أرسل بتاريخ :")} ${p(e.sentDate)}</div><div>${a("تحت عدد :")} ${r(e.sentNo)}</div></div>
    </div>
    <div class="notes">
      <div>(1): ضرورة الإشارة إلى مؤسسة التكليف إذا كان المعني مكلفا خارج مقر عمله الأصلي.</div>
      <div>(2): في حالة طلب وثيقة باللغة الفرنسية ينبغي الإشارة إلى ذلك في الموضوع مع كتابة الاسم الكامل بالحروف اللاتينية.</div>
      <div>* يعتمد هذا المطبوع لطلب شهادة إدارية واحدة.</div>
    </div>`};const Z=["استئناف العمل بعد الاستيداع","استئناف العمل بعد الإلحاق","استئناف العمل بعد رخصة الأبوة","استئناف العمل بعد رخصة الولادة","استئناف العمل بعد رخصة استثنائية","استئناف العمل بعد رخصة مرض قصيرة الأمد","استئناف العمل بعد رخصة مرض متوسطة الأمد","استئناف العمل بعد رخصة مرض طويلة الأمد","استئناف العمل بعد انهاء تكليف بمهمة","استئناف العمل بعد تغيب أو انقطاع عن العمل"],X=["رخصة أغراض شخصية","غياب غير مبرر","إذن بالتغيب","رخصة سنوية","رخصة الحج","رخصة الدراسة","رخصة التكوين أو التداريب","المشاركة في امتحان أو مباراة","التوقيف عن العمل","الإضراب عن العمل"],gt=["رخصة استثنائية للزواج","رخصة استثنائية لوفاة قريب","رخصة استثنائية لزواج أحد الأبناء","رخصة استثنائية لختان الابن","رخصة التبني","حادثة شغل","حادثة مصلحة"],G=t=>"استئناف العمل بعد "+t,Q=(t,i)=>{const e=t.concat(X.map(G));return i&&i.case&&!e.includes(i.case)&&e.push(i.case),e},j=t=>Q(Z,t);k.resume=({s:t,e:i,f:e})=>`
    ${z(t)}
    <div class="title-box">محضر استئناف العمل</div>
    <div class="airy${j(e).length>16?" tt":""}">
    <p>${a("أنا الموقع أسفله :")} ${r(t.director,"b")}</p>
    <p>${a("أشهد أن السيد (ة) :")}</p>
    <div class="grid2 ind">
      <div>${a("الاسم الشخصي :")} ${r(i.firstAr,"b")}</div><div>${N(`Prénom : <b>${h(i.firstFr||"")}</b>`)}</div>
      <div>${a("الاسم العائلي :")} ${r(i.lastAr,"b")}</div><div>${N(`Nom : <b>${h(i.lastFr||"")}</b>`)}</div>
      <div>${a("الإطار :")} ${r(i.cadre)}</div><div>${a("الدرجة :")} ${r(i.grade)}</div>
      <div>${a("رقم التأجير :")} ${r(i.ppr)}</div><div>${a("بطاقة التعريف الوطنية :")} ${r(i.cin,"ltr")}</div>
    </div>
    <p class="mt">${a("قد استأنف(ت) عمله(ها) بتاريخ :")} ${p(e.resumeDate,"b")} &nbsp; ${a("بعد :")} ${r(e.afterType,"b")}</p>
    ${e.sundayNote?`<p class="mt"><b>${h(e.sundayNote)}</b></p>`:""}
    <p>${a("لمدة :")} ${r(e.duration)} &nbsp; ${a("من :")} ${p(e.from)} &nbsp; ${a("إلى :")} ${p(e.to)}</p>
    <p>${a("المهام الإدارية أو التربوية :")} ${r(i.task)}</p>
    <p>${a("العنوان الشخصي :")} ${r(i.address)}</p>
    <p>${a("الهاتف :")} ${r(i.phone,"ltr")}</p>
    <p class="l">${a("حرر في :")} ${r(e.city)} &nbsp; ${a("بتاريخ :")} ${p(e.date)}</p>
    </div>
    <div class="boxes grow${j(e).length>16?" sm":""}">
      <div class="box"><div class="b">توقيع المعني (ة) بالأمر :</div></div>
      <div class="box"><div class="b">توقيع وملاحظة الرئيس المباشر :</div></div>
    </div>
    <div class="b mt small">مختلف الحالات :</div>
    <div class="cases${j(e).length>16?" c3":""}">${j(e).map(s=>`<div>${F(e.case===s)} ${s}</div>`).join("")}</div>`,k.medical=({s:t,e:i,f:e})=>`
    ${z(t)}
    <div class="title-box">وصل استلام شهادة(ات) طبية</div>
    <div class="airy2">
    <p>${a("أنا الممضي أسفله :")} ${r(t.director,"b")}</p>
    <p>${a("مدير مؤسسة :")} ${r(t.school,"b")}</p>
    <p>${a("أشهد أني تسلمت بتاريخ :")} ${p(e.receivedDate,"b")} &nbsp; ${a("من طرف السيد (ة) :")} ${r(e.deliveredBy)}</p>
    <p>${a("شهادة طبية مسلمة من الطبيب السيد (ة) :")} ${r(e.doctor)}</p>
    <p>${a("مدتها :")} ${r(e.duration,"b")} &nbsp; ${a("ابتداء من :")} ${p(e.from,"b")} &nbsp; ${a("إلى :")} ${p(e.to,"b")}</p>
    <div class="grid2">
      <div>${a("تتعلق بالسيد (ة) :")} ${r(T(i),"b")}</div><div>${a("الرقم المالي :")} ${r(i.ppr)}</div>
      <div>${a("الإطار :")} ${r(i.cadre)}</div><div>${a("مادة التدريس :")} ${r(i.subject)}</div>
    </div>
    <p>${a("العنوان الشخصي أثناء فترة المرض :")} ${r(e.sickAddress)}</p>
    <p class="mt">${a("ملاحظات :")} ${r(e.notes)}</p>
    <p class="l">${a("حرر بتاريخ :")} ${p(e.date)}</p>
    </div>
    <div class="boxes tall">
      <div class="box"><div class="b">توقيع وخاتم الرئيس المباشر :</div></div>
      <div class="box"><div class="b">توقيع المدلي بالشهادة (ات) الطبية :</div>
        <div class="foot">${a("رقم بطاقة تعريفه الوطنية :")} ${r(e.delivererCin,"ltr")}</div></div>
    </div>`,k.monthly=({s:t,f:i,rows:e})=>{const s=(e||[]).slice(),n=Math.max(20,s.length);let d="";for(let l=0;l<n;l++){const c=s[l];d+=`<tr><td>${l+1}</td><td>${c?h(c.ppr):""}</td><td class="nm">${c?h(c.name):""}</td><td class="cd">${c?h(c.cadre):""}</td>
        <td>${c?S(c.from):""}</td><td>${c?S(c.to):""}</td><td>${c?h(c.days):""}</td><td class="rs">${c?h(c.reason):""}</td></tr>`}const o=+(i.month||1)-1;return`
    ${z(t,"مصلحة الموارد البشرية")}
    <div class="title-box wide">لائحة التتبع الشهري للغياب خلال شهر : ${_[o]||""} ${h(i.year||"")}</div>
    <p>${a("المؤسسة :")} ${r(t.school,"b")}</p>
    <table class="tbl mtab">
      <thead>
        <tr><th rowspan="2" style="width:6%">ر.ت</th><th rowspan="2" style="width:11%">رقم التأجير</th><th rowspan="2">الاسم الكامل</th><th rowspan="2" style="width:17%">الإطار</th>
          <th colspan="2">فترة الغياب</th><th rowspan="2" style="width:7%">المدة بالأيام</th><th rowspan="2" style="width:17%">سبب التغيب</th></tr>
        <tr><th style="width:10%">من</th><th style="width:10%">إلى</th></tr>
      </thead>
      <tbody>${d}</tbody>
    </table>
    ${s.length===0?'<p class="c b mt">لا شيء يذكر</p>':""}
    <div class="row2 mt2">
      <div class="small">
        <div>* ملحوظة : ترسل هذه اللائحة إلى المديرية في اليوم الرابع من الشهر الموالي${t.email?`، وعبر البريد الإلكتروني : <span dir="ltr">${h(t.email)}</span> في اليوم الأخير من كل شهر`:""}.</div>
      </div>
      <div class="c">
        <div>${a("وحرر في :")} ${r(i.city)} ${a("بتاريخ :")} ${p(i.date)}</div>
        <div class="b mt">توقيع وطابع السيد مدير المؤسسة :</div>
      </div>
    </div>`};const M={leave:{title:"طلب رخصة",icon:"📝",desc:"رخصة مرضية، أغراض شخصية، استثنائية أو ولادة",absence:!0,cat:"leave",quick:!0},medical:{title:"وصل استلام شهادة طبية",icon:"🩺",desc:"تسلم الشهادة الطبية من الموظف",absence:"رخصة مرضية",cat:"leave",quick:!0},monthly:{title:"لائحة التتبع الشهري للغياب",icon:"📅",desc:"تُحتسب تلقائيا من سجل الغياب",page:"a4",cat:"leave",quick:!0},inquiry:{title:"استفسار",icon:"❓",desc:"استفسار عن التغيب بدون إشعار",absence:"غياب غير مبرر",cat:"work",quick:!0},resume:{title:"محضر استئناف العمل",icon:"✅",desc:"بعد انتهاء رخصة أو تغيب",cat:"work",quick:!0},certificate:{title:"طلب شهادة",icon:"📄",desc:"شهادة العمل أو بيان الالتزام",cat:"cert",quick:!0}},tt=`
  @font-face{font-family:'NSA';src:url('fonts/NotoSansArabic-Regular.ttf');font-weight:400}
  @font-face{font-family:'NSA';src:url('fonts/NotoSansArabic-Medium.ttf');font-weight:500}
  @font-face{font-family:'NSA';src:url('fonts/NotoSansArabic-SemiBold.ttf');font-weight:600}
  @font-face{font-family:'NSA';src:url('fonts/NotoSansArabic-Bold.ttf');font-weight:700}
  @font-face{font-family:'Amiri';src:url('fonts/Amiri-Regular.ttf');font-weight:400}
  @font-face{font-family:'Amiri';src:url('fonts/Amiri-Bold.ttf');font-weight:700}
  @font-face{font-family:'Tif';src:url('fonts/NotoSansTifinagh-Regular.ttf');font-weight:400}
  /* 1.9.2: «Sakkal Majalla» (font of Windows) everywhere; Noto Sans Arabic / Amiri when it is missing */
  @font-face{font-family:'MAJ';src:local('Sakkal Majalla'),local('SakkalMajalla');font-weight:400 500;size-adjust:128%}
  @font-face{font-family:'MAJ';src:local('Sakkal Majalla Bold'),local('SakkalMajalla-Bold');font-weight:600 800;size-adjust:128%}
  @font-face{font-family:'MAJT';src:local('Sakkal Majalla Bold'),local('SakkalMajalla-Bold');font-weight:600 800;size-adjust:120%}
  @font-face{font-family:'MAJT';src:local('Sakkal Majalla'),local('SakkalMajalla');font-weight:400 500;size-adjust:120%}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#fff}
  body{font-family:'MAJ','NSA','Segoe UI',Tahoma,Arial,sans-serif;color:#000;direction:rtl;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sheet{width:297mm;height:209.5mm;display:flex;flex-direction:row;overflow:hidden;page-break-after:always;break-after:page}
  .sheet:last-child{page-break-after:auto;break-after:auto}
  .copy{width:148.5mm;height:209.5mm;padding:7mm 8mm 6mm;font-size:9.6pt;line-height:1.62;display:flex;flex-direction:column;overflow:hidden}
  .sheet .copy+.copy{border-right:1px dashed #999}
  .sheet.single{width:210mm;height:296.5mm}
  .sheet.single .copy{zoom:1.4141}
  .sheet.two-a4{width:297mm;height:209.5mm}
  .copy-a4{flex:none;width:148.5mm;height:209.5mm;overflow:hidden;position:relative}
  .sheet.two-a4 .copy-a4+.copy-a4{border-right:1px dashed #999}
  .copy-a4 .page-a4{position:absolute;top:0;right:0;zoom:.7066}
  .page-a4{width:210mm;height:296.5mm;padding:10mm 12mm;font-size:10.5pt;line-height:1.6;display:flex;flex-direction:column;overflow:hidden}
  p{margin:0 0 1.2mm}
  .hdr{border-bottom:1.4px solid #000;padding-bottom:1.2mm;margin-bottom:2mm}
  .hdr-g{display:grid;grid-template-columns:1fr 17mm 1fr;align-items:start;column-gap:1.5mm}
  .hdr-txt{text-align:center;font-weight:600;container-type:inline-size;--fs:7pt;--fsk:9pt;--lh:3.55mm;--lhk:4.6mm}
  .hdr-txt>div{white-space:nowrap;overflow:hidden;height:var(--lh);line-height:var(--lh)}
  .hdr-txt>div.k{font-family:'MAJT','Amiri',serif;font-weight:700;height:var(--lhk);line-height:var(--lhk)}
  .hdr-tif{font-family:'Tif','MAJ','NSA',sans-serif;font-weight:400;--fs:6.8pt;--fsk:8.4pt}.hdr-tif>div.k{font-family:'Tif',sans-serif;font-weight:400}
  .hdr-emb{text-align:center}.hdr-emb img{width:17mm;height:auto}
  .hdr-sch2{text-align:center;font-family:'MAJT','Amiri',serif;font-weight:700;font-size:10pt;line-height:1.3;margin-top:.6mm}
  .hdr .srv{text-align:center;font-weight:500;font-size:7pt;margin-top:.3mm}
  .page-a4 .hdr-g{grid-template-columns:1fr 24mm 1fr}.page-a4 .hdr-emb img{width:24mm}.page-a4 .hdr-txt{--fs:9pt;--fsk:11pt;--lh:4.5mm;--lhk:5.8mm}.page-a4 .hdr-tif{--fs:8.6pt;--fsk:10pt}.page-a4 .hdr-sch2{font-size:12pt}.page-a4 .hdr .srv{font-size:8.5pt}
  .hdr-img{margin:-7mm -8mm 2mm}.srv-l{text-align:center;font-weight:600;font-size:8pt;margin:-1mm 0 1.5mm;border-bottom:1px solid #000;padding-bottom:1mm}.hdr-img img{width:100%;height:auto;display:block}
  /* 1.9: the letterhead image always spans the whole width of the page (right to left), whatever the page type */
  .page-a4 .hdr-img{margin:-10mm -12mm 2mm}.page-a4 .hdr-img img{width:100%;height:auto;max-height:80mm;object-fit:contain}
  /* 1.9.2 header (wave + brown line); 1.9.3: font chosen in the settings */
  .hdr-img.lhn .lh-l{display:none!important}.page-a4l .hdr-img.lhn:not(.one) .lh-p{display:none!important}.page-a4l .hdr-img.lhn .lh-l{display:block!important}
  .hdr-img.lhn img.lh-p,.hdr-img.lhn img.lh-l{object-fit:contain!important;margin:0 auto}
  .hv2{border-bottom:.55mm solid #a3461a;padding-bottom:1mm;margin-bottom:2.2mm;position:relative}
  .hdr-wave{display:block;width:calc(100% + 16mm);height:3.2mm;margin:-4.6mm -8mm .6mm}
  .page-a4 .hdr-wave{width:calc(100% + 24mm);height:4.6mm;margin:-7.6mm -12mm .6mm}.page-a4l .hdr-wave{width:calc(100% + 22mm);height:4mm;margin:-6mm -11mm .5mm}
  .vis-a4 .hdr-wave{width:calc(100% + 20mm);margin:-6mm -10mm .5mm}.half .hdr-wave{width:calc(100% + 24mm);margin:0 -12mm .6mm}
  .hv2 .hdr-g{grid-template-columns:1fr 18mm 1fr;align-items:center;column-gap:2mm}
  .hv2 .hdr-txt{font-weight:700;color:#2c4c76;--lh:3.06mm;--fs:9.2pt}
  .hv2 .hdr-txt>div{white-space:nowrap;overflow:hidden;height:var(--lh);line-height:var(--lh);font-size:min(var(--fs),var(--fit))}
  .hdr.cfa .hdr-txt:not(.hdr-tif)>div,.hdr.cfa .hdr-txt:not(.hdr-tif)>div.k{font-family:var(--hf)!important}.hdr.cft .hdr-tif,.hdr.cft .hdr-tif>div,.hdr.cft .hdr-tif>div.k{font-family:var(--hft)!important}
  .hv2 .hdr-ar{font-family:var(--hf,'MAJT','Amiri',serif)}
  .hv2 .hdr-tif{font-family:var(--hft,'Tif',sans-serif);font-weight:700;--fs:7.2pt;direction:ltr;-webkit-text-stroke:.012em currentColor}
  .hv2 .hdr-sch2{font-family:var(--hf,'MAJT','Amiri',serif);color:#1d3f86;font-weight:700;font-size:10.5pt;margin-top:.4mm}
  .hv2 .srv{color:#1d3f86}
  .page-a4 .hv2 .hdr-g{grid-template-columns:1fr 31mm 1fr}.page-a4 .hv2 .hdr-emb img{width:31mm}.page-a4 .hv2 .hdr-txt{--lh:5.25mm;--fs:15.5pt}.page-a4 .hv2 .hdr-tif{--fs:11.6pt}.page-a4 .hv2 .hdr-sch2{font-size:14pt}
  .page-a4l .hv2 .hdr-g{grid-template-columns:1fr 25mm 1fr;max-width:205mm;margin:0 auto}.page-a4l .hv2 .hdr-emb img{width:25mm}.page-a4l .hv2 .hdr-txt{--lh:4.25mm;--fs:12.6pt}.page-a4l .hv2 .hdr-tif{--fs:9.6pt}.page-a4l .hv2 .hdr-sch2{font-size:12.5pt}
  .hv2 .hdr-emb img{width:18mm}
  .title-box{align-self:center;font-family:'MAJT','Amiri',serif;font-weight:700;font-size:15pt;border:1.6px solid #000;border-radius:3mm;padding:0 7mm;margin:1mm 0 3mm;line-height:1.5}
  .title-box.wide{font-size:13pt}
  .subtitle{text-align:center;font-weight:700;text-decoration:underline;margin-bottom:1.5mm}
  .lb{font-weight:600}
  .v{font-weight:400;padding:0 1mm}
  .v.b{font-weight:700}
  .v.ltr{direction:ltr;unicode-bidi:isolate;display:inline-block}
  .v.empty{display:inline-block;min-width:24mm;border-bottom:1px dotted #555;height:1em;vertical-align:baseline}
  .b{font-weight:700}.c{text-align:center}.l{text-align:left}.j{text-align:justify}
  .mt{margin-top:2mm}.mt2{margin-top:3.5mm}.ind{padding-right:4mm}
  .small{font-size:8pt;line-height:1.5}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:3mm;align-items:start;margin-bottom:1.2mm}
  .row2.top{margin-bottom:2mm}
  .to{padding-right:6mm}
  .grid2{display:grid;grid-template-columns:1.25fr 1fr;column-gap:3mm;row-gap:.3mm;margin-bottom:1.2mm}
  .types{margin:1mm 0 1.6mm}.opt{margin-inline-start:3mm;white-space:nowrap}
  .cb{display:inline-block;width:3.6mm;height:3.6mm;border:1.2px solid #000;text-align:center;line-height:3.3mm;font-size:8pt;font-weight:700;vertical-align:middle;margin-left:.6mm}
  .spacer{flex:1 1 auto;min-height:3mm}.spacer-s{flex:.5 1 auto;min-height:1mm}
  .cut{border-top:1.2px dashed #000;margin:2mm 0 2mm;position:relative}.cut span{position:absolute;top:-2.6mm;left:2mm;background:#fff;font-size:9pt;padding:0 1mm}
  .tcap{text-align:center;font-weight:700;font-size:8.6pt;margin:1.5mm 0 1mm}
  .tbl{width:100%;border-collapse:collapse;font-size:8.6pt;line-height:1.3}
  .tbl th,.tbl td{border:1px solid #000;padding:.9mm 1mm;text-align:center;height:5.6mm}
  .tbl th{background:#ececec;font-weight:700}
  .mtab{font-size:9pt}.mtab td{height:7.2mm}.mtab td.nm{text-align:right}.mtab td.cd,.mtab td.rs{font-size:8pt}
  .sigbox{height:13mm}
  .kv{width:100%;border-collapse:collapse}.kv td{padding:.15mm 0;vertical-align:baseline}
  .kv .lbc{font-weight:600;width:33%;white-space:nowrap}.kv .frc{text-align:left;width:30%;font-size:8.8pt}
  .ltr{unicode-bidi:isolate}
  .addr{margin:3mm 0 1mm;line-height:1.55}
  .notes{border-top:1px solid #000;padding-top:1mm;font-size:7.4pt;line-height:1.5;margin-top:1.5mm}
  .boxes{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-top:1.5mm}
  .box{border:1px solid #000;min-height:17mm;padding:1mm 2mm;font-size:8.8pt;display:flex;flex-direction:column}
  .airy{line-height:1.7}.airy p{margin-bottom:1.1mm}.airy2{line-height:2.05}.airy2 p{margin-bottom:2.6mm}
  .boxes.grow .box{min-height:24mm}
  .airy.tt{line-height:1.5}.airy.tt p{margin-bottom:.5mm}.boxes.grow.sm .box{min-height:21mm}
  .boxes.tall .box{min-height:42mm}.box .foot{margin-top:auto;font-size:8.4pt}
  .cases{display:grid;grid-template-columns:1fr 1fr;column-gap:3mm;font-size:7.8pt;line-height:1.75}
  .cases .cb{width:3.2mm;height:3.2mm;line-height:2.9mm;font-size:7pt}
  .cases.c3{grid-template-columns:1fr 1fr 1fr;column-gap:2mm;font-size:6.9pt;line-height:1.5}.cases.c3 .cb{width:2.8mm;height:2.8mm;line-height:2.5mm;font-size:6pt}
  sup{font-size:65%}
  @page{size:A4 landscape;margin:0}
  `;function ft(t,i,e){e=e||{};const s=e.base||"",n=k[t],d=M[t].page==="a4";let o,l;if(d&&e.mode==="two"){const c=m=>`<div class="copy-a4"><div class="page-a4 ${M[t].pageClass||""}">${n(Object.assign({},i,{copy:m}))}</div></div>`;o=`<div class="sheet two-a4">${c(0)}${c(1)}</div>`,l="@page{size:A4 landscape;margin:0}"}else d?(o=`<div class="page-a4 ${M[t].pageClass||""}">${n(i)}</div>`,l="@page{size:A4 portrait;margin:0}"):e.mode==="single"?(o=`<div class="sheet single"><div class="copy">${n(Object.assign({},i,{copy:0}))}</div></div>`,l="@page{size:A4 portrait;margin:0}"):(o=`<div class="sheet"><div class="copy">${n(Object.assign({},i,{copy:0}))}</div><div class="copy">${n(Object.assign({},i,{copy:1}))}</div></div>`,l="@page{size:A4 landscape;margin:0}");return`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${s?`<base href="${s}">`:""}
      <title>${h(M[t].title)}</title><style>${tt}${window.Docs.fontCss||""}${window.Docs.extraCss||""}${l}</style></head><body>${o}</body></html>`}const vt=(t,i)=>M[t].page==="a4"?!!(i&&i.mode==="two"):!(i&&i.mode==="single"),H="(?:[A-Za-z]{0,4}\\d+(?:[.,/-]\\d+)*[A-Za-z]?)",$t=new RegExp(`(?<![\\w\\u0600-\\u06FF])(?:[+\\u2212-]?\\(?${H}\\)?(?:[ \\u00A0]\\(?${H}\\)?)+|[+\\u2212-]${H})(?!\\w)`,"g"),bt=/(<!--[\s\S]*?-->|<(style|script|title|textarea)\b[\s\S]*?<\/\2>)|<(\/?)([a-zA-Z][\w:-]*)[^>]*>|(&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)|([^<&]+)|[<&]/gi,ut='<span style="direction:ltr;unicode-bidi:isolate">',wt=/(^|[\s(\/،:-])(الاسم|الإسم|اسم|الأسماء|أسماء|النسب|ونسب|nom|prénom|prenom|noms)(?=$|[\s)\/،:-])/i,yt=/(المؤسسة|الوحدة|المادة|النادي|الجمعية|الشريك|الممون|القسم|المستوى|المركز|المجموعة|الجماعة|الوثيقة|الملف|المشروع|النشاط|المسلك|الشعبة|الدواء|العتاد|السلعة|الشركة|المقاولة|الحساب|البنك|الوكالة|الدورة|الامتحان|établissement|école|matière|classe)/i,it=t=>{const i=(t.textContent||"").replace(/\s+/g," ").trim();return i.length>0&&i.length<60&&wt.test(i)&&!yt.test(i)};function et(t){if(typeof t!="string"||!/<table/i.test(t)||typeof DOMParser>"u")return t;const i=/^\s*<!doctype/i.test(t);let e;try{e=new DOMParser().parseFromString(t,"text/html")}catch{return t}let s=0;const n=d=>{d&&d.style&&!d.querySelector("table")&&(d.style.textAlign="center",s++)};return e.querySelectorAll("table").forEach(d=>{if(d.classList.contains("no-nc")||d.closest(".no-nc"))return;const o=Array.from(d.rows).filter($=>$.closest("table")===d),l=[],c=new Map,m=[];o.forEach(($,b)=>{const v=Array.from($.cells);m[b]=!!$.closest("thead")||v.length>0&&v.every(u=>u.tagName==="TH"),l[b]=l[b]||[];let f=0;v.forEach(u=>{for(;l[b][f];)f++;const y=Math.max(1,u.colSpan||1),B=Math.max(1,u.rowSpan||1);c.set(u,[f,y]);for(let x=0;x<B&&b+x<o.length;x++){l[b+x]=l[b+x]||[];for(let A=0;A<y;A++)l[b+x][f+A]=1}f+=y})});const g=new Set;o.forEach(($,b)=>{m[b]&&Array.from($.cells).forEach(v=>{if(it(v)){const[f,u]=c.get(v);for(let y=0;y<u;y++)g.add(f+y)}})}),o.forEach(($,b)=>{if(m[b])return;const v=Array.from($.cells);v.forEach((f,u)=>{const[y,B]=c.get(f);if(g.size){let x=!0;for(let A=0;A<B;A++)g.has(y+A)||(x=!1);if(x){n(f);return}}(f.tagName==="TH"||f.classList.contains("k"))&&it(f)&&v[u+1]&&v[u+1].tagName==="TD"&&!v[u+1].classList.contains("k")&&n(v[u+1])})})}),s?i?"<!doctype html>"+e.documentElement.outerHTML:e.body.innerHTML:t}function xt(t){if(t=et(t),typeof t!="string"||!/\d/.test(t))return t;let i=0;return t.replace(bt,(e,s,n,d,o,l,c)=>s||l?e:o?(o.toLowerCase()==="svg"&&(d?i=Math.max(0,i-1):/\/>$/.test(e)||i++),e):c===void 0||i?e:c.replace($t,m=>ut+m+"</span>"))}function kt(t){const i=t.page||"a4",e=t.cls||"",s=t.pages&&t.pages.length?t.pages:[""],n=(m,g)=>typeof m=="function"?m(g):m,d=m=>{const g=typeof m=="string"&&/^<!--cls:([\w -]+)-->/.exec(m);return g?" "+g[1]:""};let o,l;return i==="a4"||i==="a4l"?(o=s.map(m=>`<div class="${i==="a4"?"page-a4":"page-a4l"} ${e}${d(m)}">${n(m,0)}</div>`).join(""),l=`@page{size:A4 ${i==="a4"?"portrait":"landscape"};margin:0}`):i==="single"?(o=s.map(m=>`<div class="sheet single"><div class="copy ${e}">${n(m,0)}</div></div>`).join(""),l="@page{size:A4 portrait;margin:0}"):(o=s.map(m=>`<div class="sheet"><div class="copy ${e}">${n(m,0)}</div><div class="copy ${e}">${n(m,1)}</div></div>`).join(""),l="@page{size:A4 landscape;margin:0}"),`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${t.base?`<base href="${t.base}">`:""}
      <title>${h(t.title||"")}</title><style>${tt}${window.Docs.fontCss||""}${window.Docs.extraCss||""}${window.Docs.modCss||""}${l}</style></head><body>${o}</body></html>`}const At=t=>t==="a4l"||t==="two";window.Docs={MONTHS:_,TYPES:M,RESUME_CASES:Z,RESUME_EXTRA_REASONS:X,RESUME_MORE_REASONS:gt,extraCase:G,casesWith:Q,resumeCases:j,buildDocHtml:ft,isLandscape:vt,bidi:xt,centerNames:et,fmtDate:S,toDate:L,isoOf:at,daysBetween:st,durationText:rt,fullName:T,todayIso:nt,esc:h,T:k,V:r,D:p,L:a,CB:F,LTR:N,header:z,buildRaw:kt,rawLandscape:At,headerLines:U,tifName:q,splitAcademy:O,regionOf:dt,placeOfDir:R,dirTo:W,HDR_STYLES:ht,TIF:w}})();

"use strict";(function(){const N=["يناير","فبراير","مارس","أبريل","ماي","يونيو","يوليوز","غشت","شتنبر","أكتوبر","نونبر","دجنبر"],m=t=>String(t??"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i]),$=t=>{if(!t)return"";const i=/^(\d{4})-(\d{2})-(\d{2})/.exec(t);return i?`${i[3]}/${i[2]}/${i[1]}`:t},S=t=>{const i=/^(\d{4})-(\d{2})-(\d{2})/.exec(t||"");return i?new Date(Date.UTC(+i[1],i[2]-1,+i[3])):null},_=t=>t.toISOString().slice(0,10),U=(t,i)=>{const e=S(t),d=S(i);return!e||!d||d<e?0:Math.round((d-e)/864e5)+1},W=t=>(t=+t||0,t<=0?"":t===1?"يوم واحد":t===2?"يومان":t<=10?`${t} أيام`:`${t} يوما`),w=t=>t?`${t.firstAr||""} ${t.lastAr||""}`.trim():"",P=()=>{const t=new Date;return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`},s=(t,i="")=>{const e=String(t??"").trim();return e?`<span class="v ${i}">${m(e)}</span>`:`<span class="v empty ${i}"></span>`},h=(t,i)=>s($(t),i),a=t=>`<span class="lb">${t}</span>`,z=t=>`<span class="cb">${t?"✕":""}</span>`,x=t=>`<span dir="ltr" class="ltr">${t}</span>`,g={kingdom:"ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ",ministry:"ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⴼⴰ",academy:"ⵜⴰⴽⴰⴷⵉⵎⵉⵜ ⵜⴰⵏⴳⵎⴰⵢⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⴰⵢⵏ",directorate:"ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ"},D=(t,i,e)=>{const d=Math.max(6,String(t||"").length)*(e?.53:i?.36:.47);return`<div class="${i?"k":""}" style="font-size:min(var(${i?"--fsk":"--fs"}), calc(100cqw / ${d.toFixed(2)}))">${m(t||"")}</div>`},C={ا:"ⴰ",أ:"ⴰ",إ:"ⵉ",آ:"ⴰ",ب:"ⴱ",ت:"ⵜ",ث:"ⵜ",ج:"ⵊ",ح:"ⵃ",خ:"ⵅ",د:"ⴷ",ذ:"ⴷ",ر:"ⵔ",ز:"ⵣ",س:"ⵙ",ش:"ⵛ",ص:"ⵚ",ض:"ⴹ",ط:"ⵟ",ظ:"ⴹ",ع:"ⵄ",غ:"ⵖ",ف:"ⴼ",ق:"ⵇ",ك:"ⴽ",ڭ:"ⴳ",گ:"ⴳ",ل:"ⵍ",م:"ⵎ",ن:"ⵏ",ه:"ⵀ",ة:"ⴰ",و:"ⵓ",ي:"ⵉ",ى:"ⴰ",ئ:"ⵉ",ؤ:"ⵓ",ء:""},k={"سوس ماسة":"ⵙⵓⵙ ⵎⴰⵙⵙⴰ","اكادير اداوتنان":"ⴰⴳⴰⴷⵉⵔ ⵉⴷⴰⵡⵜⴰⵏⴰⵏ","انزكان ايت ملول":"ⵉⵏⵣⴳⴳⴰⵏ ⴰⵢⵜ ⵎⵍⵍⵓⵍ","اشتوكة ايت باها":"ⵛⵜⵓⴽⴰ ⴰⵢⵜ ⴱⴰⵀⴰ","شتوكة ايت باها":"ⵛⵜⵓⴽⴰ ⴰⵢⵜ ⴱⴰⵀⴰ",تارودانت:"ⵜⴰⵔⵓⴷⴰⵏⵜ",تيزنيت:"ⵜⵉⵣⵏⵉⵜ",طاطا:"ⵟⴰⵟⴰ","مراكش اسفي":"ⵎⵕⵕⴰⴽⵛ ⴰⵙⴼⵉ","كلميم واد نون":"ⴳⵍⵎⵉⵎ ⵡⴰⴷ ⵏⵓⵏ","درعة تافيلالت":"ⴷⵔⵄⴰ ⵜⴰⴼⵉⵍⴰⵍⵜ","الرباط سلا القنيطرة":"ⵕⵕⴱⴰⵟ ⵙⵍⴰ ⵇⵏⵉⵟⵕⴰ","الدار البيضاء سطات":"ⴰⵏⴼⴰ ⵙⵟⵟⴰⵜ","فاس مكناس":"ⴼⴰⵙ ⵎⴽⵏⴰⵙ","بني ملال خنيفرة":"ⴰⵢⵜ ⵎⵍⵍⴰⵍ ⵅⵏⵉⴼⵕⴰ",الشرق:"ⴰⴳⵎⵎⵓⴹ","طنجة تطوان الحسيمة":"ⵟⴰⵏⵊⴰ ⵜⵉⵟⵟⴰⵡⵉⵏ ⵍⵃⵓⵙⵉⵎⴰ","العيون الساقية الحمراء":"ⵍⵄⵢⵓⵏ ⵙⴰⴳⵉⵢⵜ ⵍⵃⴰⵎⵔⴰ","الداخلة وادي الذهب":"ⴷⴷⴰⵅⵍⴰ ⵡⴰⴷ ⴷⴷⴰⵀⴰⴱ",ورزازات:"ⵡⴰⵔⵣⴰⵣⴰⵜ",زاكورة:"ⵣⴰⴳⵓⵔⴰ",تنغير:"ⵜⵉⵏⵖⵉⵔ",الرشيدية:"ⵔⵔⴰⵛⵉⴷⵉⵢⴰ",ميدلت:"ⵎⵉⴷⵍⵜ",كلميم:"ⴳⵍⵎⵉⵎ","سيدي افني":"ⵙⵉⴷⵉ ⵉⴼⵏⵉ",طانطان:"ⵟⴰⵏⵟⴰⵏ",الحوز:"ⵍⵃⴰⵡⵣ"},I=t=>String(t||"").replace(/[ًٌٍَُِّْـ]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/\s+/g," ").trim(),M=t=>{const i=I(t).replace(/^(جهة|لجهة|بجهة|اقليم|عمالة|مديرية)\s+/,"");if(!i)return"";if(k[i])return k[i];const e=Object.keys(k).find(d=>d.replace(/\s/g,"")===i.replace(/\s/g,"").replace(/^ال/,"")||d.replace(/\s/g,"")===i.replace(/\s/g,""));return e?k[e]:i.split(" ").map(d=>Array.from(d.replace(/^ال(?=..)/,"")).map(r=>C[r]!=null?C[r]:r).join("")).join(" ")},j=t=>{t=String(t||"").trim();const i=/^(.*?(?:والتكوين|و التكوين))\s*[-–:،,]?\s*(?:ل?جهة\s*:?\s*|ل)?(.*)$/.exec(t);return i?[i[1].trim(),i[2].trim()]:[t,""]},K=t=>j(t)[1],R=t=>String(t||"").replace(/^\s*(?:ال)?مديرية\s+(?:ال)?إ?ا?قليمية\s*(?:ل|ب|-|–|:)?\s*/,"").replace(/^(?:عمالة|إقليم|اقليم)\s+/,"").trim(),V=t=>{if(t=String(t||"").trim(),t.length<=26)return[t];const i=[],e=/\sو(?=\S)/g;let d;for(;d=e.exec(t);)i.push(d.index);if(!i.length)return[t];const r=t.length/2,c=i.reduce((n,l)=>Math.abs(l-r)<Math.abs(n-r)?l:n,i[0]);return[t.slice(0,c).trim(),t.slice(c).trim()]},A=t=>String(t||"").split(/\s*(?:\n|\/|\|)\s*/).map(i=>i.trim()).filter(Boolean);function E(t){const i=(f,lt)=>t[f]==null||String(t[f]).trim()===""?lt:t[f],[e,d]=j(t.academy),r=["المملكة المغربية"].concat(V(t.ministry),[e],d?["جهة "+d.replace(/^جهة\s+/,"")]:[],[String(t.directorate||"").trim()]).filter(Boolean),c=i("tifMinistry",g.ministry),n=[i("tifKingdom",g.kingdom)];n.push(...c===g.ministry?["ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ","ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⴼⴰ"]:A(c)),n.push(...A(i("tifAcademy",g.academy)));const l=String(t.tifRegion||"").trim();l?n.push(...A(l)):d&&n.push("ⵜⴰⵎⵏⴰⴹⵜ "+M(d));const o=i("tifDirectorate",g.directorate),p=R(t.directorate);return n.push(...o===g.directorate&&p?[o+" "+M(p)]:A(o)),{ar:r,tf:n.filter(Boolean)}}const O=(t,i,e,d)=>{const r=Math.max(8,...t.map(c=>String(c).length))*i;return`<div class="hdr-txt ${e}"${d||""} style="--fit:calc(100cqw / ${r.toFixed(2)})">${t.map(c=>`<div>${m(c)}</div>`).join("")}</div>`},Y='<svg class="hdr-wave" viewBox="0 0 1000 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 29H120C142 29 146 11 168 11H866C888 11 892 30 914 30H990" fill="none" stroke="#183c8c" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>',Z=[["ruqaa","الشكل الجديد: موجة زرقاء وخط بني (مثل الرأسية الرسمية)"],["classic","الشكل الكلاسيكي (خط أميري، 4 أسطر)"]],F=t=>String(t||"").replace(/["'<>;{}\\\n]/g,"").trim().slice(0,60),G=t=>{const i=F(t&&t.hdrFont);return(i?"'"+i+"',":"")+"'MAJT','Amiri',serif"};function X(t,i,e){const d=E(t),r=!!F(t.hdrFont);return`<div class="hdr hv2" style="--hf:${G(t).replace(/"/g,"&quot;")}">${Y}
      <div class="hdr-g">
        ${O(d.ar,r?.5:.36,"hdr-ar")}
        <div class="hdr-emb"><img src="assets/emblem.png"></div>
        ${O(d.tf,.56,"hdr-tif",' lang="zgh" dir="ltr"')}
      </div>
      ${t.school&&!e?`<div class="hdr-sch2">${m(t.school)}</div>`:""}
      ${i?`<div class="srv">${m(i)}</div>`:""}
    </div>`}function b(t,i,e){const d=!!(e&&e.dirOnly);if(!d&&t.headerMode==="image"&&t.letterhead){const l=i?`<div class="srv-l">${m(i)}</div>`:"";if(t.letterheadP&&t.lhNorm!==!1){const p=t.letterheadL?`<img class="lh-l" src="${m(t.letterheadL)}" width="${+t.llW}" height="${+t.llH}">`:"";return`<div class="hdr-img lhn${p?"":" one"}"><img class="lh-p" src="${m(t.letterheadP)}" width="${+t.lpW}" height="${+t.lpH}">${p}</div>${l}`}const o=t.letterheadW&&t.letterheadH?` width="${+t.letterheadW}" height="${+t.letterheadH}"`:"";return`<div class="hdr-img"><img src="${m(t.letterhead)}"${o}></div>${l}`}if((t.headerStyle||"ruqaa")!=="classic")return X(t,i,d);const r=(l,o)=>t[l]==null||String(t[l]).trim()===""?o:t[l],c=["المملكة المغربية",t.ministry,t.academy,t.directorate],n=[r("tifKingdom",g.kingdom),r("tifMinistry",g.ministry),r("tifAcademy",g.academy),r("tifDirectorate",g.directorate)];return`<div class="hdr">
      <div class="hdr-g">
        <div class="hdr-txt">${c.map((l,o)=>D(l,o===0,!1)).join("")}</div>
        <div class="hdr-emb"><img src="assets/emblem.png"></div>
        <div class="hdr-txt hdr-tif" lang="zgh">${n.map((l,o)=>D(l,o===0,!0)).join("")}</div>
      </div>
      ${t.school&&!d?`<div class="hdr-sch2">${m(t.school)}</div>`:""}
      ${i?`<div class="srv">${m(i)}</div>`:""}
    </div>`}const v={};v.inquiry=({s:t,e:i,f:e})=>`
    ${b(t)}
    <div class="row2 mt2">
      <div>${a("المؤسسة :")} ${s(t.school,"b")}</div>
      <div class="to">
        <div>${a("إلى :")}</div>
        <div>${a("السيد (ة) :")} ${s(w(i),"b")}</div>
        <div>${a("رقم التأجير :")} ${s(i.ppr)}</div>
      </div>
    </div>
    <p class="mt">${a("<u>الموضوع</u> :")} <b>استفسار.</b></p>
    <p>${a("<u>المرجع</u> :")} المرسوم رقم 2.99.1216 الصادر في 6 صفر 1421 (2000/05/10).</p>
    <p class="c b mt">سلام تام بوجود مولانا الإمام المؤيد بالله،</p>
    <p class="j">وبعد، لقد بلغ إلى علمي أنك(م) تغيبت(م) عن عملك(م) خلال الفترة المتراوحة ما بين: ${a("من")} ${h(e.from,"b")} ${a("إلى")} ${h(e.to,"b")}
      بدون إشعار أو إذن سابق، الشيء الذي يتنافى والقوانين الجاري بها العمل.</p>
    <p class="j">لذا، وقبل اتخاذ قرار الخصم من مرتبك(م) طبقا لمقتضيات المرسوم المشار إليه في المرجع أعلاه ولاسيما المادة 4 منه،
      يشرفني أن أطلب منك(م) موافاتي بالبيانات المفصلة في الموضوع مصحوبة بالوثائق المبررة وذلك في أجل لا يتعدى
      <b>${m(e.deadline||15)}</b> يوما ابتداء من تاريخ توصلك(م) بهذا الاستفسار.</p>
    <p class="l b">والسلام.</p>
    <div class="row2">
      <div>${a("التاريخ :")} ${h(e.date)}</div>
      <div class="c b">توقيع الرئيس المباشر :</div>
    </div>
    <div class="spacer"></div>
    <div class="cut"><span>✂</span></div>
    <div class="subtitle">إشعار باستلام استفسار</div>
    <p>${a("يشهد السيد (ة) :")} ${s(w(i),"b")} &nbsp; ${a("رقم التأجير :")} ${s(i.ppr)}</p>
    <p>أنه توصل(ت) باستفسار عن التغيب خلال الفترة المتراوحة ${a("من :")} ${h(e.from)} ${a("إلى :")} ${h(e.to)}</p>
    <div class="row2 mt">
      <div>${a("التاريخ :")} ${h(e.receiptDate)}</div>
      <div class="c b">التوقيع :</div>
    </div>`,v.leave=({s:t,e:i,f:e,history:d})=>{const r=["مرضية","أغراض شخصية","استثنائية","ولادة"],c=(d||[]).slice(0,4);for(;c.length<4;)c.push(null);return`
    ${b(t,"مصلحة الموارد البشرية ـ مكتب الرخص الإدارية والتغيبات")}
    <div class="title-box">طلب رخصة</div>
    <div class="grid2">
      <div>${a("الاسم الكامل :")} ${s(w(i),"b")}</div><div>${a("ر.ت :")} ${s(i.ppr)}</div>
      <div>${a("الإطار :")} ${s(i.cadre)}</div><div>${a("تاريخ الازدياد :")} ${h(i.birth)}</div>
    </div>
    <div class="types">${a("نوع الرخصة :")} ${r.map(n=>`<span class="opt">${z(e.leaveType===n)} ${n}</span>`).join("")}</div>
    <p>${a("مدتها :")} ${s(e.duration,"b")} &nbsp; ${a("من :")} ${h(e.from,"b")} &nbsp; ${a("إلى :")} ${h(e.to,"b")}</p>
    <p>${a("العنوان الشخصي للموظف :")} ${s(e.address)}</p>
    <div class="row2 mt">
      <div class="b">توقيع الموظف :</div>
      <div>${a("حرر ب :")} ${s(e.city)} ${a("في :")} ${h(e.date)}</div>
    </div>
    <div class="spacer-s"></div>
    <p class="mt">${a("رأي السيد المدير :")} ${s(e.opinion)}</p>
    <p>${a("تاريخ توقيف الموظف عن العمل :")} ${h(e.stopDate)}</p>
    <div class="tcap">جدول الرخص والتغيبات التي استفاد منها الموظف خلال 12 شهرا الأخيرة</div>
    <table class="tbl">
      <thead><tr><th style="width:22%">المدة</th><th style="width:20%">من</th><th style="width:20%">إلى</th><th>السبب</th></tr></thead>
      <tbody>${c.map(n=>`<tr><td>${n?m(n.duration):""}</td><td>${n?$(n.from):""}</td><td>${n?$(n.to):""}</td><td>${n?m(n.reason):""}</td></tr>`).join("")}</tbody>
    </table>
    <div class="row2 mt">
      <div>${a("حرر ب :")} ${s(e.city)} ${a("في :")} ${h(e.date2)}</div>
      <div class="c"><div class="b">توقيع رئيس المؤسسة :</div><div class="sigbox"></div></div>
    </div>`},v.certificate=({s:t,e:i,f:e})=>{const d=/الفرنسية/.test(e.certType||""),r=(c,n,l,o)=>`<tr><td class="lbc">${c}</td><td class="vc">${n}</td>${l!==void 0?`<td class="frc">${d?x(`${l} : <b>${m(o||"")}</b>`):""}</td>`:"<td></td>"}</tr>`;return`
    <div class="row2 top">
      <div class="b">الحمد لله وحده</div>
      <div>${s(e.city)} ${a("في :")} ${h(e.date)}</div>
    </div>
    <table class="kv mt">
      ${r("الاسم العائلي :",s(i.lastAr,"b"),"Nom",i.lastFr)}
      ${r("الاسم الشخصي :",s(i.firstAr,"b"),"Prénom",i.firstFr)}
      ${r("الرقم المالي :",s(i.ppr))}
      ${r("تاريخ الازدياد :",h(i.birth))}
      ${r("رقم ب.ت.و :",s(i.cin,"ltr"))}
      ${r("تاريخ التوظيف :",h(i.hire))}
      ${r("الإطار :",s(i.cadre))}
      ${r("المهمة :",s(i.task))}
      ${r("مقر العمل الأصلي :",s(i.origin))}
      ${r("مؤسسة التكليف <sup>(1)</sup> :",s(i.assigned))}
    </table>
    <div class="addr">
      <div class="c b">إلــى</div>
      <div class="c">السيد المدير الإقليمي ل${m(t.ministry)}</div>
      <div class="c">مصلحة الموارد البشرية</div>
      <div class="c">مكتب تتبع الحياة الإدارية للموظفين</div>
      <div class="c">${m(t.directorate)}</div>
      <div class="c">تحت إشراف السيد مدير : <b>${m(t.school)}</b></div>
    </div>
    <p class="mt">${a("الموضوع <sup>(2)</sup> :")} <b>طلب ${m(e.certType||"")}</b></p>
    <p class="c b">سلام تام بوجود مولانا الإمام المؤيد بالله،</p>
    <p>وبعد،</p>
    <p class="j">يشرفني أن أطلب من سيادتكم موافاتي بالشهادة المذكورة في الموضوع أعلاه قصد الإدلاء بها ${m(e.purpose||"لأغراض إدارية")}.</p>
    <div class="row2 mt">
      <div class="c b">إمضاء الموظف :</div>
      <div class="c b">توقيع وطابع رئيس المؤسسة :</div>
    </div>
    <div class="spacer"></div>
    <div class="row2 small">
      <div></div>
      <div><div>${a("أرسل بتاريخ :")} ${h(e.sentDate)}</div><div>${a("تحت عدد :")} ${s(e.sentNo)}</div></div>
    </div>
    <div class="notes">
      <div>(1): ضرورة الإشارة إلى مؤسسة التكليف إذا كان المعني مكلفا خارج مقر عمله الأصلي.</div>
      <div>(2): في حالة طلب وثيقة باللغة الفرنسية ينبغي الإشارة إلى ذلك في الموضوع مع كتابة الاسم الكامل بالحروف اللاتينية.</div>
      <div>* يعتمد هذا المطبوع لطلب شهادة إدارية واحدة.</div>
    </div>`};const q=["استئناف العمل بعد الاستيداع","استئناف العمل بعد الإلحاق","استئناف العمل بعد رخصة الأبوة","استئناف العمل بعد رخصة الولادة","استئناف العمل بعد رخصة استثنائية","استئناف العمل بعد رخصة مرض قصيرة الأمد","استئناف العمل بعد رخصة مرض متوسطة الأمد","استئناف العمل بعد رخصة مرض طويلة الأمد","استئناف العمل بعد انهاء تكليف بمهمة","استئناف العمل بعد تغيب أو انقطاع عن العمل"],B=["رخصة أغراض شخصية","غياب غير مبرر","إذن بالتغيب","رخصة سنوية","رخصة الحج","رخصة الدراسة","رخصة التكوين أو التداريب","المشاركة في امتحان أو مباراة","التوقيف عن العمل","الإضراب عن العمل"],Q=["رخصة استثنائية للزواج","رخصة استثنائية لوفاة قريب","رخصة استثنائية لزواج أحد الأبناء","رخصة استثنائية لختان الابن","رخصة التبني","حادثة شغل","حادثة مصلحة"],L=t=>"استئناف العمل بعد "+t,J=(t,i)=>{const e=t.concat(B.map(L));return i&&i.case&&!e.includes(i.case)&&e.push(i.case),e},y=t=>J(q,t);v.resume=({s:t,e:i,f:e})=>`
    ${b(t)}
    <div class="title-box">محضر استئناف العمل</div>
    <div class="airy${y(e).length>16?" tt":""}">
    <p>${a("أنا الموقع أسفله :")} ${s(t.director,"b")}</p>
    <p>${a("أشهد أن السيد (ة) :")}</p>
    <div class="grid2 ind">
      <div>${a("الاسم الشخصي :")} ${s(i.firstAr,"b")}</div><div>${x(`Prénom : <b>${m(i.firstFr||"")}</b>`)}</div>
      <div>${a("الاسم العائلي :")} ${s(i.lastAr,"b")}</div><div>${x(`Nom : <b>${m(i.lastFr||"")}</b>`)}</div>
      <div>${a("الإطار :")} ${s(i.cadre)}</div><div>${a("الدرجة :")} ${s(i.grade)}</div>
      <div>${a("رقم التأجير :")} ${s(i.ppr)}</div><div>${a("بطاقة التعريف الوطنية :")} ${s(i.cin,"ltr")}</div>
    </div>
    <p class="mt">${a("قد استأنف(ت) عمله(ها) بتاريخ :")} ${h(e.resumeDate,"b")} &nbsp; ${a("بعد :")} ${s(e.afterType,"b")}</p>
    ${e.sundayNote?`<p class="mt"><b>${m(e.sundayNote)}</b></p>`:""}
    <p>${a("لمدة :")} ${s(e.duration)} &nbsp; ${a("من :")} ${h(e.from)} &nbsp; ${a("إلى :")} ${h(e.to)}</p>
    <p>${a("المهام الإدارية أو التربوية :")} ${s(i.task)}</p>
    <p>${a("العنوان الشخصي :")} ${s(i.address)}</p>
    <p>${a("الهاتف :")} ${s(i.phone,"ltr")}</p>
    <p class="l">${a("حرر في :")} ${s(e.city)} &nbsp; ${a("بتاريخ :")} ${h(e.date)}</p>
    </div>
    <div class="boxes grow${y(e).length>16?" sm":""}">
      <div class="box"><div class="b">توقيع المعني (ة) بالأمر :</div></div>
      <div class="box"><div class="b">توقيع وملاحظة الرئيس المباشر :</div></div>
    </div>
    <div class="b mt small">مختلف الحالات :</div>
    <div class="cases${y(e).length>16?" c3":""}">${y(e).map(d=>`<div>${z(e.case===d)} ${d}</div>`).join("")}</div>`,v.medical=({s:t,e:i,f:e})=>`
    ${b(t)}
    <div class="title-box">وصل استلام شهادة(ات) طبية</div>
    <div class="airy2">
    <p>${a("أنا الممضي أسفله :")} ${s(t.director,"b")}</p>
    <p>${a("مدير مؤسسة :")} ${s(t.school,"b")}</p>
    <p>${a("أشهد أني تسلمت بتاريخ :")} ${h(e.receivedDate,"b")} &nbsp; ${a("من طرف السيد (ة) :")} ${s(e.deliveredBy)}</p>
    <p>${a("شهادة طبية مسلمة من الطبيب السيد (ة) :")} ${s(e.doctor)}</p>
    <p>${a("مدتها :")} ${s(e.duration,"b")} &nbsp; ${a("ابتداء من :")} ${h(e.from,"b")} &nbsp; ${a("إلى :")} ${h(e.to,"b")}</p>
    <div class="grid2">
      <div>${a("تتعلق بالسيد (ة) :")} ${s(w(i),"b")}</div><div>${a("الرقم المالي :")} ${s(i.ppr)}</div>
      <div>${a("الإطار :")} ${s(i.cadre)}</div><div>${a("مادة التدريس :")} ${s(i.subject)}</div>
    </div>
    <p>${a("العنوان الشخصي أثناء فترة المرض :")} ${s(e.sickAddress)}</p>
    <p class="mt">${a("ملاحظات :")} ${s(e.notes)}</p>
    <p class="l">${a("حرر بتاريخ :")} ${h(e.date)}</p>
    </div>
    <div class="boxes tall">
      <div class="box"><div class="b">توقيع وخاتم الرئيس المباشر :</div></div>
      <div class="box"><div class="b">توقيع المدلي بالشهادة (ات) الطبية :</div>
        <div class="foot">${a("رقم بطاقة تعريفه الوطنية :")} ${s(e.delivererCin,"ltr")}</div></div>
    </div>`,v.monthly=({s:t,f:i,rows:e})=>{const d=(e||[]).slice(),r=Math.max(20,d.length);let c="";for(let l=0;l<r;l++){const o=d[l];c+=`<tr><td>${l+1}</td><td>${o?m(o.ppr):""}</td><td class="nm">${o?m(o.name):""}</td><td class="cd">${o?m(o.cadre):""}</td>
        <td>${o?$(o.from):""}</td><td>${o?$(o.to):""}</td><td>${o?m(o.days):""}</td><td class="rs">${o?m(o.reason):""}</td></tr>`}const n=+(i.month||1)-1;return`
    ${b(t,"مصلحة الموارد البشرية")}
    <div class="title-box wide">لائحة التتبع الشهري للغياب خلال شهر : ${N[n]||""} ${m(i.year||"")}</div>
    <p>${a("المؤسسة :")} ${s(t.school,"b")}</p>
    <table class="tbl mtab">
      <thead>
        <tr><th rowspan="2" style="width:6%">ر.ت</th><th rowspan="2" style="width:11%">رقم التأجير</th><th rowspan="2">الاسم الكامل</th><th rowspan="2" style="width:17%">الإطار</th>
          <th colspan="2">فترة الغياب</th><th rowspan="2" style="width:7%">المدة بالأيام</th><th rowspan="2" style="width:17%">سبب التغيب</th></tr>
        <tr><th style="width:10%">من</th><th style="width:10%">إلى</th></tr>
      </thead>
      <tbody>${c}</tbody>
    </table>
    ${d.length===0?'<p class="c b mt">لا شيء يذكر</p>':""}
    <div class="row2 mt2">
      <div class="small">
        <div>* ملحوظة : ترسل هذه اللائحة إلى المديرية في اليوم الرابع من الشهر الموالي${t.email?`، وعبر البريد الإلكتروني : <span dir="ltr">${m(t.email)}</span> في اليوم الأخير من كل شهر`:""}.</div>
      </div>
      <div class="c">
        <div>${a("وحرر في :")} ${s(i.city)} ${a("بتاريخ :")} ${h(i.date)}</div>
        <div class="b mt">توقيع وطابع السيد مدير المؤسسة :</div>
      </div>
    </div>`};const u={leave:{title:"طلب رخصة",icon:"📝",desc:"رخصة مرضية، أغراض شخصية، استثنائية أو ولادة",absence:!0,cat:"leave",quick:!0},medical:{title:"وصل استلام شهادة طبية",icon:"🩺",desc:"تسلم الشهادة الطبية من الموظف",absence:"رخصة مرضية",cat:"leave",quick:!0},monthly:{title:"لائحة التتبع الشهري للغياب",icon:"📅",desc:"تُحتسب تلقائيا من سجل الغياب",page:"a4",cat:"leave",quick:!0},inquiry:{title:"استفسار",icon:"❓",desc:"استفسار عن التغيب بدون إشعار",absence:"غياب غير مبرر",cat:"work",quick:!0},resume:{title:"محضر استئناف العمل",icon:"✅",desc:"بعد انتهاء رخصة أو تغيب",cat:"work",quick:!0},certificate:{title:"طلب شهادة",icon:"📄",desc:"شهادة العمل أو بيان الالتزام",cat:"cert",quick:!0}},H=`
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
  .page-a4 .hdr-img{margin:-10mm -12mm 2mm}.page-a4 .hdr-img img{width:100%;height:auto;max-height:80mm;object-fit:fill}
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
  .hv2 .hdr-ar{font-family:var(--hf,'MAJT','Amiri',serif)}
  .hv2 .hdr-tif{font-family:'Tif',sans-serif;font-weight:700;--fs:7.2pt;direction:ltr;-webkit-text-stroke:.012em currentColor}
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
  `;function tt(t,i,e){e=e||{};const d=e.base||"",r=v[t],c=u[t].page==="a4";let n,l;if(c&&e.mode==="two"){const o=p=>`<div class="copy-a4"><div class="page-a4 ${u[t].pageClass||""}">${r(Object.assign({},i,{copy:p}))}</div></div>`;n=`<div class="sheet two-a4">${o(0)}${o(1)}</div>`,l="@page{size:A4 landscape;margin:0}"}else c?(n=`<div class="page-a4 ${u[t].pageClass||""}">${r(i)}</div>`,l="@page{size:A4 portrait;margin:0}"):e.mode==="single"?(n=`<div class="sheet single"><div class="copy">${r(Object.assign({},i,{copy:0}))}</div></div>`,l="@page{size:A4 portrait;margin:0}"):(n=`<div class="sheet"><div class="copy">${r(Object.assign({},i,{copy:0}))}</div><div class="copy">${r(Object.assign({},i,{copy:1}))}</div></div>`,l="@page{size:A4 landscape;margin:0}");return`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${d?`<base href="${d}">`:""}
      <title>${m(u[t].title)}</title><style>${H}${window.Docs.fontCss||""}${window.Docs.extraCss||""}${l}</style></head><body>${n}</body></html>`}const it=(t,i)=>u[t].page==="a4"?!!(i&&i.mode==="two"):!(i&&i.mode==="single"),T="(?:[A-Za-z]{0,4}\\d+(?:[.,/-]\\d+)*[A-Za-z]?)",et=new RegExp(`(?<![\\w\\u0600-\\u06FF])(?:[+\\u2212-]?\\(?${T}\\)?(?:[ \\u00A0]\\(?${T}\\)?)+|[+\\u2212-]${T})(?!\\w)`,"g"),at=/(<!--[\s\S]*?-->|<(style|script|title|textarea)\b[\s\S]*?<\/\2>)|<(\/?)([a-zA-Z][\w:-]*)[^>]*>|(&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)|([^<&]+)|[<&]/gi,st='<span style="direction:ltr;unicode-bidi:isolate">';function dt(t){if(typeof t!="string"||!/\d/.test(t))return t;let i=0;return t.replace(at,(e,d,r,c,n,l,o)=>d||l?e:n?(n.toLowerCase()==="svg"&&(c?i=Math.max(0,i-1):/\/>$/.test(e)||i++),e):o===void 0||i?e:o.replace(et,p=>st+p+"</span>"))}function rt(t){const i=t.page||"a4",e=t.cls||"",d=t.pages&&t.pages.length?t.pages:[""],r=(p,f)=>typeof p=="function"?p(f):p,c=p=>{const f=typeof p=="string"&&/^<!--cls:([\w -]+)-->/.exec(p);return f?" "+f[1]:""};let n,l;return i==="a4"||i==="a4l"?(n=d.map(p=>`<div class="${i==="a4"?"page-a4":"page-a4l"} ${e}${c(p)}">${r(p,0)}</div>`).join(""),l=`@page{size:A4 ${i==="a4"?"portrait":"landscape"};margin:0}`):i==="single"?(n=d.map(p=>`<div class="sheet single"><div class="copy ${e}">${r(p,0)}</div></div>`).join(""),l="@page{size:A4 portrait;margin:0}"):(n=d.map(p=>`<div class="sheet"><div class="copy ${e}">${r(p,0)}</div><div class="copy ${e}">${r(p,1)}</div></div>`).join(""),l="@page{size:A4 landscape;margin:0}"),`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${t.base?`<base href="${t.base}">`:""}
      <title>${m(t.title||"")}</title><style>${H}${window.Docs.fontCss||""}${window.Docs.extraCss||""}${window.Docs.modCss||""}${l}</style></head><body>${n}</body></html>`}const nt=t=>t==="a4l"||t==="two";window.Docs={MONTHS:N,TYPES:u,RESUME_CASES:q,RESUME_EXTRA_REASONS:B,RESUME_MORE_REASONS:Q,extraCase:L,casesWith:J,resumeCases:y,buildDocHtml:tt,isLandscape:it,bidi:dt,fmtDate:$,toDate:S,isoOf:_,daysBetween:U,durationText:W,fullName:w,todayIso:P,esc:m,T:v,V:s,D:h,L:a,CB:z,LTR:x,header:b,buildRaw:rt,rawLandscape:nt,headerLines:E,tifName:M,splitAcademy:j,regionOf:K,placeOfDir:R,HDR_STYLES:Z,TIF:g}})();

"use strict";(function(){const{T:v,TYPES:N,V:a,D:n,L:tt,CB:x,LTR:A,header:c,esc:e,fmtDate:P,fullName:b,MONTHS:z}=window.Docs,S=s=>{const i=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||"");return i?`${i[3]} ${z[+i[2]-1]} ${i[1]}`:""},m=(s,i)=>a(S(s),i),G=s=>{const i=String(s.directorate||"").replace(/^المديرية الإقليمية\s*/,"").trim();return i?i.startsWith("ب")?i:"ب"+i:""},u=s=>(s=String(s||"").trim(),s?s.startsWith("ال")?"لل"+s.slice(2):"ل"+s:""),R=s=>(s=String(s||"").trim(),s?"ب"+s:""),J=(s,i)=>i.assigned||s.school||"",j=(s,i="")=>Array.from({length:s},()=>`<div class="dl ${i}"></div>`).join(""),B=(s,i)=>{const t=String(s||"").split(`
`).map(p=>p.trim()).filter(Boolean);let r=t.map(p=>`<div class="dl filled">${e(p)}</div>`).join("");for(let p=t.length;p<i;p++)r+='<div class="dl"></div>';return r},V=(s,i,t)=>{const r=String(s||"").split(`
`).map(p=>p.trim()).filter(Boolean).map(p=>p.split(/\s*[|;]\s*/));for(;r.length<t;)r.push([]);return r.map(p=>`<tr>${Array.from({length:i},(o,l)=>`<td>${e(p[l]||"")}</td>`).join("")}</tr>`).join("")},U=s=>s.childGender==="ذكر"?{my:"ابني المولود",of:"الابن",att:"المولود"}:{my:"ابنتي المولودة",of:"الابنة",att:"المولودة"};function L({s,e:i,f:t},r,p,o){return`
    <div class="l b mt">${e(t.city||s.city)} في: ${m(t.date,"b")}</div>
    <ul class="info b">
      <li>الاسم الكامل: ${a(b(i))}</li>
      <li>الإطار: ${a(i.cadre)}</li>
      <li>رقم التأجير: ${a(i.ppr,"b")}</li>
      <li>المؤسسة الأصلية: ${a(i.origin)}</li>
      <li>مؤسسة التكليف: ${a(J(s,i))}</li>
      <li>المهمة: ${a(i.task)}</li>
    </ul>
    <div class="addr-l b">
      <div>إلى السيد المدير الإقليمي ${e(u(s.academy))}</div>
      <div>${e(R(s.directorate))}</div>
      <div>مصلحة تدبير الموارد البشرية</div>
      <div>وحدة التدبير المندمج</div>
      <div>مكتب التدبير المندمج سلك ${e(s.cycle||"التعليم الابتدائي")}</div>
      <div>على يد السيد مدير ${e(s.school)}</div>
    </div>
    <p class="b subj">الموضوع: ${r}</p>
    <p class="c b">سلام تام بوجود مولانا الإمام دام له النصر والتأييد</p>
    <p class="j b body">${p}</p>
    <p class="c b mt2">وفي انتظار قبول طلبي، تقبلوا مني فائق التقدير والاحترام</p>
    <div class="l b mt2 sig">توقيع: ............................</div>
    <div class="spacer"></div>
    <div class="b small2">المرفقات: ${e(o)}</div>`}v.marriage=s=>L(s,"طلب الاستفادة من رخصة استثنائية للزواج",`وبعد، بمناسبة زواجي، يشرفني أن أتقدم لسيادتكم بهذا الطلب قصد الاستفادة من رخصة استثنائية للزواج، وذلك ابتداءً من تاريخ ${m(s.f.from)}، وتجدون رفقته نسخة من عقد الزواج.`,"عقد الزواج"),v.assignReq=({s,e:i,f:t})=>{const r=t.variant==="swap",p=String(t.items||"").split(`
`).map(d=>d.trim()).filter(Boolean).map(d=>d.split(/\s*\|\s*/));for(;p.length<Math.max(3,+t.minRows||7);)p.push([]);const o=`<table class="grid ar-t"><thead><tr><th style="width:8%">ر.ت</th><th>المؤسسة</th><th style="width:22%">نوعها</th><th style="width:26%">الجماعة</th></tr></thead><tbody>${p.map((d,f)=>`<tr><td class="c">${f+1}</td><td>${e(d[0]||"")}</td><td class="c">${e(d[1]||"")}</td><td class="c">${e(d[2]||"")}</td></tr>`).join("")}</tbody></table>`,l=r?(()=>{const d=/ة$/.test(String(t.pTitle||"").trim());return`وبعد، علاقة بالموضوع المشار اليه أعلاه، يشرفني أن أطلب منكم تكليفي بالتبادل خلال الموسم الدراسي <b><bdi>${e(t.sy||"")}</bdi></b> مع ${e(t.pTitle||"الأستاذ")} <b>${e(t.pName||"..........................")}</b> ${d?"الحاملة":"الحامل"} للبطاقة الوطنية رقم <b><bdi dir="ltr">${e(t.pCin||"..........")}</bdi></b> ورقم التأجير <b><bdi dir="ltr">${e(t.pPpr||"..........")}</bdi></b> ${d?"والتي تعمل":"والذي يعمل"} ب${e(t.pSchool||"..........................")}.`})():`وبعد، علاقة بالموضوع المشار اليه أعلاه، يشرفني أن أطلب منكم تكليفي بمهمة مؤقتة بإحدى المؤسسات المشار اليها في الجدول أسفله${t.sy?" خلال الموسم الدراسي <b>"+e(t.sy)+"</b>":""}:`;return`
    <div class="l b mt">${e(t.city||s.city)} في: ${m(t.date,"b")}</div>
    <ul class="info b">
      <li>الاسم الكامل: ${a(b(i))}</li>
      <li>الإطار: ${a(i.cadre)}</li>
      <li>رقم التأجير: ${a(i.ppr,"b")}</li>
      <li>المؤسسة الأصلية: ${a(i.origin||s.school)}</li>
      ${!r&&i.assigned?`<li>مؤسسة التكليف: ${a(i.assigned)}</li>`:""}
      <li>المهمة: ${a(i.task||"التدريس")}</li>
    </ul>
    <div class="addr-l b">
      <div>إلى السيد المدير الإقليمي ${e(u(s.academy))}</div>
      <div>${e(s.directorate?"لل"+String(s.directorate).replace(/^ال/,""):"")}</div>
      <div>مصلحة تدبير الموارد البشرية</div>
      <div>على يد السيد مدير ${e(s.school)}</div>
    </div>
    <p class="b subj">الموضوع: ${r?"طلب تكليف مؤقت بالتبادل":"طلب تكليف مؤقت"}</p>
    <p class="c b">سلام تام بوجود مولانا الإمام دام له النصر والتأييد</p>
    <p class="j b body">${l}</p>
    ${t.reason?`<p class="j b body">${e(t.reason)}</p>`:""}
    ${r?"":o}
    <p class="c b mt2">${r?"وفي انتظار قبول طلبي":"وفي انتظار جوابكم"}، تقبلوا مني فائق التقدير والاحترام</p>
    <div class="l b mt2 sig">توقيع: ${e(b(i))}</div>
    <div class="spacer"></div>
    ${t.att?`<div class="b small2">المرفقات: ${e(t.att)}</div>`:""}`},v.paternity=s=>L(s,"طلب الاستفادة من رخصة الأبوة","وبعد، علاقة بالموضوع المشار اليه أعلاه، يشرفني أن أتقدم لسيادتكم بهذا الطلب قصد الاستفادة من رخصة الأبوة وتجدون رفقته شهادة الوضع.","شهادة الوضع"),v.breastfeeding=({s,e:i,f:t})=>{if(t.variant==="short")return`
      ${c(s)}
      <div class="row2 mt">
        <div>
          <p>الإسم الكامل: ${a(b(i))}</p>
          <p>رقم التأجير: ${a(i.ppr)}</p>
          <p>الإطار: ${a(i.cadre)}</p>
          <p>مقر العمل: ${a(i.origin||s.school)}</p>
        </div>
        <div class="c">
          <p>${e(t.city||s.city)} في ${n(t.date)}</p>
          <p>إلى السيد المدير الإقليمي</p>
          <p>${e(u(s.ministry))}</p>
          <p>${e(G(s))}</p>
          <p>مصلحة الموارد البشرية</p>
          <p>على يد السيد مدير ${e(s.school)}</p>
        </div>
      </div>
      <p class="mt2">الموضوع: طلب الاستفادة من رخصة الرضاعة.</p>
      <p class="c">سلام تام بوجود مولانا الإمام</p>
      <p class="mt">وبعد،</p>
      <p class="j ind2">علاقة بالموضوع أعلاه، يشرفني السيد المدير أن أتقدم اليكم بطلب الاستفادة من رخصة الرضاعة تماشيا مع النصوص التشريعية الجاري بها العمل، والقاضية بتمتيع الأستاذة المرضع من نصف ساعة في حالة العمل أكثر من 3 ساعات متوالية، وذلك لضمان حق الرضيع من برنامج التغذية الذي قد يؤدي كل اضطراب فيه إلى الإصابة بمضاعفات صحية وخيمة.</p>
      <p class="ind2">وفي انتظار ردكم، سيدي المدير، تقبلوا مني أسمى عبارات الاحترام والتقدير.</p>
      <p class="c">والسلام.</p>
      <p class="c mt2">التوقيع:</p>`;const r=U(t);return`
    <div class="c b">الحمد لله وحده</div>
    <div class="l b">${e(t.city||s.city)} بتاريخ: ${m(t.date)}</div>
    <div class="info2 b mt">
      <p>الاسم الشخصي: ${a(i.firstAr)}</p>
      <p>الاسم العائلي: ${a(i.lastAr)}</p>
      <p>رقم التأجير: ${a(i.ppr)}</p>
      <p>الإطار: ${a(i.cadre)}</p>
      <p>المهمة: ${a(i.task)}</p>
      <p>مقر العمل الأصلي: ${a(i.origin||s.school)}</p>
    </div>
    <div class="addr-l b">
      <div>إلى السيد</div>
      <div>المدير الاقليمي ${e(u(s.academy))}</div>
      <div>${e(R(s.directorate))}</div>
      <div>مصلحة تدبير الموارد البشرية</div>
      <div>على يد مدير ${e(s.school)}</div>
    </div>
    <p class="b subj">الموضوع: طلب الاستفادة من رخصة الرضاعة</p>
    <p class="c b">سلام تام بوجود مولانا الإمام،</p>
    <p class="j body">وبعد، علاقة بالموضوع المشار إليه أعلاه، يشرفني أن أتقدم إلى سيادتكم بطلبي هذا قصد تمكيني من الاستفادة من رخصة الرضاعة، وذلك ابتداء من تاريخ استئنافي للعمل بعد رخصة الولادة بتاريخ ${m(t.resumeDate,"b")}، لفائدة ${r.my} بتاريخ ${n(t.childBirth,"b")}.</p>
    <p class="j body">وحرصاً على انتظام سير الدراسة وصون مصلحة المتعلمين، أقترح اعتماد الصيغة التالية في توزيع ساعة الرضاعة: ${a(t.slot,"b")}، بما ينسجم مع جدول الحصص المعتمد في المؤسسة.</p>
    <p class="j body">تجدون رفقة هذا الطلب نسختين من عقد ازدياد ${r.of}.</p>
    <p class="c">وفي انتظار موافقتكم، تقبلوا فائق عبارات التقدير والاحترام</p>
    <p class="c">و السلام.</p>
    <div class="l b mt sig">توقيع الموظف:</div>
    <div class="spacer"></div>
    <div class="b small2">المرفقات: نسختين من عقد ازدياد ${r.att}</div>`},v.certificate2=({s,e:i,f:t})=>{const r=(p,o,l)=>`<tr><td class="lbc">${p}</td><td>${o}</td><td class="frc">${l||""}</td></tr>`;return`
    <div class="c b">الحمد لله وحده</div>
    <div class="l b mt">${e(t.city||s.city)} بتاريخ: ${n(t.date)}</div>
    <table class="kv kv2 mt2">
      ${r("الاسم الشخصي :",a(i.firstAr,"b"),A(`<b>Nom :</b> ${e(i.lastFr||"")}`))}
      ${r("الاسم العائلي :",a(i.lastAr,"b"),A(`<b>Prénom :</b> ${e(i.firstFr||"")}`))}
      ${r("رقم التأجير :",a(i.ppr))}
      ${r("تاريخ الازدياد :",n(i.birth))}
      ${r("رقم البطاقة الوطنية :",a(i.cin,"ltr"))}
      ${r("تاريخ التوظيف :",n(i.hire))}
      ${r("الإطار :",a(i.cadre))}
      ${r("المهمة :",a(i.task))}
      ${r("مقر العمل الأصلي :",a(i.origin||s.school))}
    </table>
    <div class="addr-l b mt2">
      <div>إلى السيد</div>
      <div>المدير الاقليمي ${e(u(s.academy))}</div>
      <div>${e(R(s.directorate))}</div>
      <div>مصلحة تدبير الموارد البشرية</div>
    </div>
    <p class="subj mt2">الموضوع : طلب شهادة ${a(t.certType,"b")}</p>
    <p class="c">سلام تام بوجود مولانا الإمام،</p>
    <p class="j body">وبعد، يشرفني أن أطلب من سيادتكم موافاتي بشهادة ${a(t.certType,"b")} قصد الإدلاء بها ${e(t.purpose||"لأغراض إدارية")}.</p>
    <p class="c mt2">و السلام.</p>
    <div class="b mt2">إمضاء الموظف:</div>`};const k=(s,i)=>i&&i.sex||s&&s.sex||"";v.workAttAr=({s,e:i,f:t})=>{const r=k(i,t),p=r==="F",o=r==="M",l=(w,h,g)=>p?h:o?w:g,d=(w,h)=>`<tr><td class="lbc">${w}</td><td class="sepc">:</td><td>${h}</td></tr>`,f=[i.cadre,t.withGrade!==!1&&i.grade?/درجة|خارج/.test(i.grade)?i.grade:"الدرجة "+i.grade:""].filter(Boolean).join(" ");return`
    ${c(s)}
    ${t.ref?`<div class="mt">الرقم : ${a(t.ref)}</div>`:""}
    <div class="wa-title">شهادة العمل</div>
    <p class="wa-intro">${e(t.signer||"")} ${l("بأن السيد","بأن السيدة","بأن السيد(ة)")} :</p>
    <table class="kv wa-kv">
      ${d("الإسم والنسب",a(b(i),"b"))}
      ${d("ر.ب.و",a(i.cin,"ltr"))}
      ${d("رقم التأجير",a(i.ppr))}
      ${d("الإطار",a(f))}
      ${d(t.taskLabel||"المهمة",a(t.task))}
      ${d("تاريخ التوظيف",n(i.hire))}
      ${t.withAff&&i.affDate?d("تاريخ التعيين بالمؤسسة",n(i.affDate)):""}
      ${d("مقر العمل",`${a(t.place||s.school)}${s.directorate?`<div>${e(s.directorate)}</div>`:""}`)}
    </table>
    ${t.still?`<p class="wa-p">${l("يعمل بالمؤسسة المذكورة ولا يزال يزاول مهامه بها","تعمل بالمؤسسة المذكورة ولا تزال تزاول مهامها بها","يعمل(تعمل) بالمؤسسة المذكورة ولا يزال(تزال) يزاول(تزاول) مهامه(ا) بها")} إلى حدود تاريخ تسليم هذه الشهادة.</p>`:""}
    <p class="wa-p">${l("سلمت هذه الشهادة للمعني بالأمر بناء على طلبه للإدلاء بها عند الاقتضاء.","سلمت هذه الشهادة للمعنية بالأمر بناء على طلبها للإدلاء بها عند الاقتضاء.","سلمت هذه الشهادة للمعني(ة) بالأمر بناء على طلبه(ا) للإدلاء بها عند الاقتضاء.")}</p>
    <div class="wa-sign">
      <div>حرر ب${e(t.city||s.city||"")} في : ${n(t.date)}</div>
      <div class="b mt2">${e(t.signTitle||"توقيع وخاتم المدير(ة)")}</div>
      ${s.director?`<div class="mt">${e(s.director)}</div>`:""}
    </div>`},v.workAttFr=({s,e:i,f:t})=>{const r=k(i,t),p=r==="F",o=r==="M",l=(h,g,H)=>p?g:o?h:H,d=(h,g)=>`<tr><td class="lbc">${h}</td><td class="sepc">:</td><td class="vv">${g}</td></tr>`,f=`${i.lastFr||""} ${i.firstFr||""}`.trim(),w=[t.cadreFr,t.gradeFr].filter(Boolean).join(" ");return`
    ${c(s)}
    <div class="wa-fr" dir="ltr">
      ${t.ref?`<div class="mt">N° : ${a(t.ref)}</div>`:""}
      <div class="wa-title fr">ATTESTATION DE TRAVAIL</div>
      <p class="wa-intro">${e(t.signerFr||"")} ${l("que Monsieur","que Madame","que M. / Mme")} :</p>
      <table class="kv wa-kv">
        ${d("NOM ET PRÉNOM",a(f,"b"))}
        ${d("C.I.N",a(i.cin))}
        ${d("MATRICULE (PPR)",a(i.ppr))}
        ${d("GRADE",a(w))}
        ${d(t.fonctionLabel||"FONCTION",a(t.fonctionFr))}
        ${d("DATE DE RECRUTEMENT",n(i.hire))}
        ${t.withAff&&i.affDate?d("DATE D'AFFECTATION",n(i.affDate)):""}
        ${d("AFFECTATION",`${a(t.placeFr||s.schoolFr)}${t.dirFr?`<div>${e(t.dirFr)}</div>`:""}`)}
      </table>
      ${t.still?`<p class="wa-p">${l("L'intéressé exerce toujours ses fonctions","L'intéressée exerce toujours ses fonctions","L'intéressé(e) exerce toujours ses fonctions")} au sein de l'établissement à la date de délivrance de la présente attestation.</p>`:""}
      <p class="wa-p">${l("Cette attestation est délivrée à l'intéressé","Cette attestation est délivrée à l'intéressée","Cette attestation est délivrée à l'intéressé(e)")} pour servir et valoir ce que de droit.</p>
      <div class="wa-sign">
        <div>Fait à ${e(t.cityFr||s.cityFr||"")}, le ${n(t.date)}</div>
        <div class="b mt2">${e(t.signTitleFr||"Le Directeur (cachet et signature)")}</div>
      </div>
    </div>`},v.counterExam=({s,e:i,f:t,prevCerts:r})=>{const p=(r||[]).slice(0,4),o=p.map(l=>`<tr><td>${P(l.from)}</td><td>${e(l.duration)}</td><td>${e(l.doctor||"")}</td><td>${e(l.notes||"")}</td></tr>`).join("")+Array.from({length:Math.max(0,3-p.length)},()=>"<tr><td></td><td></td><td></td><td></td></tr>").join("");return`
    ${c(s)}
    <div class="row2"><div>الرقم : ${a(t.ref)}</div><div class="l">${e(s.city)} في : ${n(t.date)}</div></div>
    <div class="addr-l b mt">
      <div class="big">إلى</div>
      <div>السيد(ة): مندوب(ة) وزارة الصحة والحماية الاجتماعية</div>
      <div>${e(t.healthCity||s.city)}</div>
    </div>
    <p class="b mt subj">الموضــوع: طلب إجراء فحص طبي مضاد</p>
    <p class="c">ســلام تام بوجــود مولانا الإمـام المــؤيد بالله</p>
    <p class="j">وبعد، فعلاقة بالموضوع المشار إليه أعلاه، يشرفني أن أطلب منكم إجراء فحص طبي مضاد من قبل اللجنة الطبية الإقليمية
      للسيد(ة): ${a(b(i),"b")} رقم التأجير: ${a(i.ppr,"b")} الإطار: ${a(i.cadre,"b")}
      العامل(ة) بمؤسسة: ${a(i.assigned||s.school)} نتيجة إدلائه(ا) بشهادة طبية مدتها: ${a(t.duration,"b")}
      بمفعول: ${n(t.from,"b")} مسلمة من طرف الطبيب(ة): ${a(t.doctor,"b")} مع موافاتي بنتيجة الفحص في أقرب الآجال.</p>
    <p class="c">وتقبلوا أزكى التحيات، والسلام.</p>
    ${t.withTable?`<table class="tbl mt">
      <thead><tr><th colspan="4">شواهد طبية سابقة خلال الموسم الدراسي الحالي<br>(يعبأ هذا الجدول وجوبا)</th></tr>
      <tr><th>مفعول الشهادة الطبية</th><th>مدتها</th><th>اسم الطبيب(ة)</th><th>ملاحظات</th></tr></thead><tbody>${o}</tbody></table>`:""}
    <div class="sep"></div>
    <p class="b u">إشعار باستلام:</p>
    <p>(ت) يشهد السيد(ة): ${a("")} (ر.ت/ب.ت.و: ${a("")}) أنه تسلم هذه الوثيقة بتاريخ: ${a("")} التوقيع: ${a("")}</p>
    <div class="sep"></div>
    <p class="b small2">*يلتزم المعني(ة) بالأمر بالحضور إلى المديرية الإقليمية -مصلحة تدبير الموارد البشرية- فور تسلمه(ا) لهذا الطلب قصد استكمال الإجراء.</p>
    <table class="tbl sigt"><tr><th>توقيع وخاتم رئيس المؤسسة</th><th>توقيع وخاتم المدير الإقليمي</th></tr><tr><td></td><td></td></tr></table>
    <div class="cut"><span>✂</span></div>
    <p class="b"><u>إشهاد بالحضور لإجراء الفحص الطبي:</u> خاص بالمندوبية الإقليمية لوزارة الصحة والحماية الاجتماعية</p>
    <div class="frame">
      <p>حضر(ت) السيد(ة): ${a("")} ر.ت: ${a("")} لدى مصالح مندوبية وزارة الصحة والحماية الاجتماعية ب${e(t.healthCity||s.city)}</p>
      <p>قصد إجراء الفحص الطبي بتاريخ: ${a("")}</p>
      <p class="c b">خاتم مندوبية وزارة الصحة والحماية الاجتماعية</p>
    </div>`},v.birthCard=({s,e:i,f:t})=>`
    ${c(s)}
    <div class="ribbon"><div>بطاقة تقديم</div><div>( ازدياد - وفاة )</div></div>
    <div class="form-lines">
      <p>الرقم المالي : ${a(i.ppr,"b")}</p>
      <p class="row2x"><span>الاسم العائلي : ${a(i.lastAr,"b")}</span>${A(`Nom : <b>${e(i.lastFr||"")}</b>`)}</p>
      <p class="row2x"><span>الاسم الشخصي : ${a(i.firstAr,"b")}</span>${A(`Prénom : <b>${e(i.firstFr||"")}</b>`)}</p>
      <p class="row2x"><span>رقم البطاقة الوطنية : ${a(i.cin,"ltr")}</span><span>السلم : ${a(i.scale)}</span></p>
      <p>الاطار : ${a(i.cadre)}</p>
      <p class="row2x"><span>الرتبة : ${a(i.echelon)}</span><span>الرقم الاستدلالي : ${a(i.index)}</span></p>
      <p class="row2x"><span>تاريخ التوظيف : ${n(i.hire)}</span><span>مقر العمل : ${a(i.origin||s.school)}</span></p>
    </div>
    <div class="c mt2 b">معلومات الابن (ة)${t.event?` — ${e(t.event)}`:""}</div>
    <table class="tbl mt"><thead><tr><th style="width:13%">ترتيب الابن(ة)</th><th style="width:13%">ترتيب الزوج(ة)</th><th>الاسم و النسب</th><th style="width:22%">تاريخ الازدياد${t.event==="وفاة"?" / الوفاة":""}</th></tr></thead>
      <tbody>${V(t.children,4,3)}</tbody></table>
    <div class="spacer"></div>
    <div class="l b mt2">توقيع رئيس المؤسسة :</div>
    <div class="spacer"></div>
    <div class="footbox">مصلحة تدبير الموارد البشرية : مكتب التعويضات العائلية / الهاتف ( الكتابة الخاصة): ${e(t.officePhone||"")}</div>`,v.spouseCard=({s,e:i,f:t})=>`
    ${c(s)}
    <div class="c title-u">بطاقة تقديم</div>
    <div class="form-lines b2">
      <p>الرقم المالي: ${a(i.ppr)}</p>
      <p>الاسم العائلي: ${a(i.lastAr)}</p>
      <p>الاسم الشخصي: ${a(i.firstAr)}</p>
      <p class="row2x"><span>رقم بطاقة التعريف الوطنية: ${a(i.cin,"ltr")}</span><span>السلم: ${a(i.scale)}</span></p>
      <p>الاطار: ${a(i.cadre)}</p>
      <p class="row2x"><span>الدرجة: ${a(i.grade)}</span><span>الرتبة: ${a(i.echelon)}</span></p>
      <p class="row2x"><span>تاريخ التوظيف: ${n(i.hire)}</span><span>مقر العمل: ${a(i.origin||s.school)}</span></p>
      <p>تاريخ الزواج: ${n(t.marriageDate)}</p>
      <p>تاريخ الطلاق: ${n(t.divorceDate)}</p>
      <p>تاريخ الوفاة: ${n(t.deathDate)}</p>
    </div>
    <div class="title-u2">معلومات الزوج (ة)</div>
    <div class="form-lines b2">
      <p>الاسم العائلي للزوج (ة): ${a(t.spouseLast)}</p>
      <p>الاسم الشخصي للزوج (ة): ${a(t.spouseFirst)}</p>
      <p class="row2x"><span>مهنة الزوج (ة): ${a(t.spouseJob)}</span><span>رقم التأجير: ${a(t.spousePpr)}</span></p>
      <p>رقم بطاقة التعريف الوطنية للزوج (ة): ${a(t.spouseCin,"ltr")}</p>
      <p>ترتيب الزوج (ة): ${a(t.spouseRank)}</p>
    </div>
    <p class="b small2 mt2">تنبيه: بطاقة تقديم خاصة بحركية الزوج (ة): تصريح بالزواج، الطلاق، مهنة الزوج (ة)، وفاة، الرجعة.</p>
    <p class="b small2">سترجع كل ورقة ناقصة او تحتوي على معلومات غير صحيحة الى صاحبها مرفقة بالملف وذلك قصد تصحيحها.</p>
    <div class="row2 mt2 b"><div>توقيع السيد المدير:</div><div class="c">توقيع المدير الإقليمي:</div></div>`,v.missionArrival=({s,e:i,f:t})=>`
    ${c(s)}
    <div class="c b big">إخبار بالوصول إلى مقر المأمورية</div>
    <div class="c">(حالة تكليف)</div>
    <div class="vsec mt">
      <div class="vlab"><span>المؤسسة الأصلية</span></div>
      <div class="vbody">
        <p>الاسم الشخصي والعائلي: ${a(b(i),"b")}</p>
        <p class="row3x"><span>رقم التأجير: ${a(i.ppr)}</span><span>الإطار: ${a(i.cadre)}</span><span>الدرجة: ${a(i.grade)}</span></p>
        <p>المهمة: ${a(i.task)}</p>
        <p class="row2x"><span>المؤسسة: ${a(i.origin)}</span><span>رمزها (GRESA): ${a(t.origGresa,"ltr")}</span></p>
        <p class="row2x"><span>الجماعة: ${a(t.origCommune)}</span><span>المنطقة: ${a(t.origZone)}</span></p>
        <p>تاريخ المغادرة: ${n(t.departDate)}</p>
      </div>
    </div>
    <div class="vsec">
      <div class="vlab"><span>المؤسسة المستقبلة</span></div>
      <div class="vbody">
        <p>تاريخ الالتحاق بالمؤسسة: ${n(t.joinDate,"b")}</p>
        <p class="row2x"><span>المؤسسة: ${a(t.recvSchool)}</span><span>رمزها (GRESA): ${a(t.recvGresa,"ltr")}</span></p>
        <p>المهمة: ${a(t.recvTask)}</p>
        <p class="row2x"><span>الجماعة: ${a(t.recvCommune)}</span><span>المنطقة: ${a(t.recvZone)}</span></p>
        <p>العنوان الشخصي: ${a(t.address)}</p>
      </div>
    </div>
    <p class="mt">حرر ب: ${a(t.city)} &nbsp; بتاريخ: ${n(t.date)}</p>
    <table class="tbl sigt"><tr><th>خاتم وتوقيع رئيس المؤسسة المستقبلة:</th><th style="width:38%">توقيع الموظف:</th></tr><tr><td style="height:36mm"></td><td></td></tr></table>
    <p class="b small2 mt">ملحوظة: يبعث بهذه الوثيقة عبر السلم الإداري في 3 نسخ مباشرة بعد التحاق الموظف.</p>`;const q="data:image/jpeg;base64,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",C=s=>/أكادير/.test(String(s.directorate||""))?`<div class="dir-foot"><img src="${q}" alt=""></div>`:s.directorate?`<div class="dir-foot txt">${e(s.directorate)}${s.phone?" — الهاتف: "+e(s.phone):""}</div>`:"",X=["استئناف العمل بعد الاستيداع","استئناف العمل بعد الالحاق","استئناف العمل بعد تدريب دراسي","استئناف العمل بعد رخصة الولادة","استئناف العمل بعد رخصة استثنائية","استئناف العمل بعد رخصة مرض قصيرة الأمد","استئناف العمل بعد رخصة مرض متوسطة الأمد","استئناف العمل بعد رخصة مرض طويلة الأمد","استئناف العمل بعد انهاء تكليف بمهمة","استئناف العمل بعد تغيب أو انقطاع عن العمل"],$=["انتهاء رخصة مرض","انتهاء رخصة ولادة","انتهاء تكليف بمهمة","استئناف العمل بعد تغيب أو انقطاع عنه","حالات أخرى (ينبغي تحديدها)"],Z={"انتهاء رخصة مرض (قصيرة/متوسطة/طويلة) الأمد":[0,""],"انتهاء رخصة استثنائية":[4,"رخصة استثنائية"]},O=s=>{const i=$.indexOf(s);return i>=0?[i,""]:Z[s]||[-1,""]};v.resume2=({s,e:i,f:t})=>`
    ${c(s)}
    <div class="c b u big">محضر استئناف العمل</div>
    <div class="lh2 mt">
      <p>أنا الموقع(ة) أسفله: ${a(s.director,"b")}</p>
      <p>مدير(ة) المؤسسة: ${a(s.school)}</p>
      <p>أشهد أن السيد(ة):</p>
      <p class="row2x"><span>الاسم الشخصي: ${a(i.firstAr,"b")}</span>${A(`Prénom : <b>${e(i.firstFr||"")}</b>`)}</p>
      <p class="row2x"><span>الاسم العائلي: ${a(i.lastAr,"b")}</span>${A(`Nom : <b>${e(i.lastFr||"")}</b>`)}</p>
      <p class="row2x"><span>الإطار: ${a(i.cadre)}</span><span>الدرجة: ${a(i.grade)}</span></p>
      <p class="row2x"><span>رقم التأجير: ${a(i.ppr)}</span><span>بطاقة التعريف الوطنية: ${a(i.cin,"ltr")}</span></p>
      <p class="row2x"><span>مقر العمل: ${a(i.origin||s.school)}</span><span>بالمديرية الإقليمية: ${a(String(s.directorate||"").replace(/^المديرية الإقليمية\s*ب?/,""))}</span></p>
      <p>قد استأنف (ت) عمله(ها) بتاريخ: ${n(t.resumeDate,"b")}</p>${t.sundayNote?`<p><b>${e(t.sundayNote)}</b></p>`:""}
      <p class="row3x"><span>بعد(1): ${a(t.afterType)}</span><span>من: ${n(t.from)}</span><span>الى: ${n(t.to)}</span></p>
      <p>العنوان الشخصي: ${a(i.address)}</p>
      <p class="row2x mt"><span>حرر في : ${a(t.city)}</span><span>بتاريخ: ${n(t.date)}</span></p>
    </div>
    <div class="boxes r2sig">
      <div class="box"><div class="b">توقيع المعني(ة) بالأمر:</div></div>
      <div class="box"><div class="b">توقيع وخاتم الرئيس(ة) المباشر(ة):</div></div>
    </div>
    <div class="u b mt2">(1) مختلف الحالات:</div>
    <div class="cases1 r2cases${Docs.casesWith(X,t).length>16?" two":""}">${Docs.casesWith(X,t).map(r=>`<div>${x(t.case===r)} ${r}</div>`).join("")}</div>
    <div class="spacer"></div>`,v.resumeDir=({s,e:i,f:t})=>{const r=O(t.case);return`
    ${c(s,"",{dirOnly:!0})}
    <p class="u b mt">المؤسسة : ${a(s.school,"b")}</p>
    <div class="c b u big mt2">محضر استئناف العمل</div>
    <div class="lh2 mt2">
      <p>أنا الموقع(ة) أسفله : ${a(s.director,"b")}</p>
      <p class="ind">مدير المؤسسة</p>
      <p class="u">أشهد أن السيد(ة) :</p>
      <p class="row2x"><span>الاسم الشخصي : ${a(i.firstAr,"b")}</span>${A(`Prénom : <b>${e(i.firstFr||"")}</b>`)}</p>
      <p class="row2x"><span>الاسم العائلي : ${a(i.lastAr,"b")}</span>${A(`Nom : <b>${e(i.lastFr||"")}</b>`)}</p>
      <p class="row3x"><span>الإطار : ${a(i.cadre)}</span><span>الدرجة : ${a(i.grade)}</span><span>رقم التأجير : ${a(i.ppr)}</span></p>
      <p class="row2x"><span>رقم بطاقة التعريف الوطنية : ${a(i.cin,"ltr")}</span><span>تاريخ ومكان الازدياد : ${a([P(i.birth),i.birthPlace].filter(Boolean).join(" ب"))}</span></p>
      <p>قد استأنف (ت) عمله(ا) بتاريخ : ${n(t.resumeDate,"b")}</p>${t.sundayNote?`<p><b>${e(t.sundayNote)}</b></p>`:""}
      <p class="row3x"><span>بعد (1) : ${a(t.afterType)}</span><span>من : ${n(t.from)}</span><span>الى : ${n(t.to)}</span></p>
      <p>حرر في : ${a(t.city)} &nbsp; بتاريخ : ${n(t.date)}</p>
    </div>
    <div class="row2 mt2 b"><div>توقيع وخاتم مدير المؤسسـة:</div><div class="c">توقيع المعني(ة) بالأمر</div></div>
    <div class="spacer"></div>
    <div class="u small2 b">(1) مختلف الحالات:</div>
    <div class="cases1 small2">${$.map((p,o)=>`<div>${x(r[0]===o)} ${p}${o===4?`: ${a(r[0]===4?t.otherCase||r[1]:"")}`:""}</div>`).join("")}</div>
    ${C(s)}`};const F=["التعيين الأول (بعد التخرج من مراكز التكوين)","الانتقال إلى هذه المؤسسة (الحركة الانتقالية)","التعيين بعد الإلحاق أو الإعادة إلى الإطار","العودة من الاستيداع أو التفرغ أو الإلحاق","التكليف بمهمة بهذه المؤسسة","حالات أخرى (ينبغي تحديدها)"];v.joinWork=({s,e:i,f:t})=>`
    ${c(s,"",{dirOnly:!0})}
    <p class="u b mt">المؤسسة : ${a(s.school,"b")}</p>
    <div class="c b u big mt2">محضر الالتحاق بالعمل</div>
    <div class="lh2 mt2">
      <p>أنا الموقع(ة) أسفله : ${a(s.director,"b")}</p>
      <p class="ind">مدير المؤسسة</p>
      <p class="u">أشهد أن السيد(ة) :</p>
      <p class="row2x"><span>الاسم الشخصي : ${a(i.firstAr,"b")}</span>${A(`Prénom : <b>${e(i.firstFr||"")}</b>`)}</p>
      <p class="row2x"><span>الاسم العائلي : ${a(i.lastAr,"b")}</span>${A(`Nom : <b>${e(i.lastFr||"")}</b>`)}</p>
      <p class="row3x"><span>الإطار : ${a(i.cadre)}</span><span>الدرجة : ${a(i.grade)}</span><span>رقم التأجير : ${a(i.ppr)}</span></p>
      <p class="row2x"><span>رقم بطاقة التعريف الوطنية : ${a(i.cin,"ltr")}</span><span>تاريخ ومكان الازدياد : ${a([P(i.birth),i.birthPlace].filter(Boolean).join(" ب"))}</span></p>
      <p>قد التحق (ت) بهذه المؤسسة وباشر(ت) عمله(ا) بها بتاريخ : ${n(t.joinDate,"b")}</p>
      <p class="row2x"><span>بصفته(ا) : ${a(t.task||i.task||i.cadre)}</span><span>قادما(ة) من : ${a(t.fromSchool)}</span></p>
      <p>وذلك بناء على (1) : ${a(t.basis)}</p>
      <p>حرر في : ${a(t.city)} &nbsp; بتاريخ : ${n(t.date)}</p>
    </div>
    <div class="row2 mt2 b"><div>توقيع وخاتم مدير المؤسسـة:</div><div class="c">توقيع المعني(ة) بالأمر</div></div>
    <div class="spacer"></div>
    <div class="u small2 b">(1) مختلف الحالات:</div>
    <div class="cases1 small2">${F.map((r,p)=>`<div>${x(t.case===r)} ${r}${p===F.length-1?`: ${a(t.case===r?t.otherCase:"")}`:""}</div>`).join("")}</div>
    ${C(s)}`,v.medicalDir=({s,e:i,f:t,copy:r})=>`
    ${c(s)}
    <div class="row2"><div></div><div class="l">${e(s.city)} في: ${n(t.date)}</div></div>
    <div class="c spaced">وصل تسلم الشهادة الطبية</div>
    <div class="c small2">${r===1?"يلحق بالشهادة الطبية":"يسلم الى الشخص الذي ادلى بالشهادة الطبية"}</div>
    <div class="tight mt">
      <p>أنا الموقع اسفله: ${a(s.director,"b")}</p>
      <p>مدير (ة) المؤسسة: ${a(s.school)}</p>
      <p>المديرية الاقليمية: ${a(String(s.directorate||"").replace(/^المديرية الإقليمية\s*ب?/,""))}</p>
      <p>أشهد اني تسلمت بتاريخ(1): ${n(t.receivedDate,"b")}</p>
      <p>من طرف السيد(2): ${a(t.deliveredBy)}</p>
      <p>شهادة طبية مسلمة من الطبيب السيد(ة): ${a(t.doctor)}</p>
      <p>مدتها: ${a(t.duration,"b")} &nbsp; من : ${n(t.from,"b")} &nbsp; الى : ${n(t.to,"b")}</p>
      <p class="row2x"><span>تتعلق بالسيد(ة): ${a(b(i),"b")}</span><span>الرقم المالي : ${a(i.ppr)}</span></p>
      <p class="row2x"><span>الاطار: ${a(i.cadre)}</span><span>مادة التدريس: ${a(i.subject)}</span></p>
      <p>العنوان الشخصي: ${a(t.sickAddress)}</p>
      <p>ملاحظات: ${a(t.notes)}</p>
    </div>
    <div class="boxes tall">
      <div class="box"><div class="b">توقيع وخاتم مدير المؤسسة:</div></div>
      <div class="box"><div class="b">توقيع المدلي(ة) بالشهادة الطبية مع رقم بطاقة التعريف الوطنية(2):</div><div class="foot">${a(t.delivererCin,"ltr")}</div></div>
    </div>
    <div class="spacer"></div>
    <div class="fn">(1) يتعين تسلم كل الشواهد الطبية ولو خارج الأجل القانوني المحدد بالمذكرة، على أن تتم الإشارة إلى ذلك في ملاحظات.<br>
      (2) إذا سلمت الشهادة الطبية من قبل شخص غير المعني بالأمر، يتعين الإشارة إلى اسمه ونسبه وكذا رقم بطاقة تعريفه الوطنية.</div>`;const I=["مغادرة مقر العمل بصفة مؤقتة (لأسباب مجهولة).","مغادرة مقر العمل بصفة نهائية.","الاستقالة.","الوفاة.","الإحالة على التقاعد.","الاستيداع."];v.absenceNotice=({s,e:i,f:t})=>`
    ${c(s)}
    <div class="addr-l b c2 mt">
      <div class="big">مدير(ة) المؤسسة</div>
      <div>إلى</div>
      <div class="big">السيد المدير الاقليمي للوزارة</div>
      <div class="small2">مصلحة تدبير الموارد البشرية</div>
      <div class="small2">وحدة التدبير المندمج- السلك ${e(s.cycle||"التعليم الابتدائي")}</div>
      <div class="small2">${e(s.directorate)}</div>
    </div>
    <p class="b big u">الموضوع: إعلان بانقطاع عن العمل</p>
    <p>أتشرف بأن أنهي إلى علمكم أن:</p>
    <div class="tight">
      <p class="row3x"><span>السيد(ة): ${a(b(i),"b")}</span><span>رقم التأجير: ${a(i.ppr)}</span><span>رقم البطاقة الوطنية: ${a(i.cin,"ltr")}</span></p>
      <p class="row3x"><span>الإطار: ${a(i.cadre)}</span><span>الدرجة: ${a(i.grade)}</span><span>الرتبة: ${a(i.echelon)}</span></p>
      <p>تاريخ التوظيف: ${n(i.hire)}</p>
      <p class="row3x"><span>تاريخ الالتحاق بالمؤسسة: ${n(t.joinDate)}</span><span>المهمة: ${a(i.task)}</span><span>المادة: ${a(i.subject)}</span></p>
      <p>انقطع(ت) عن العمل بتاريخ: ${n(t.stopDate,"b")}</p>
    </div>
    <p class="b u">نظرا :</p>
    <div class="reasons b">${I.map((r,p)=>`<div><span class="${t.reason===String(p+1)?"circ":""}">${p+1}- ${r}</span></div>`).join("")}</div>
    <div class="small2 b">* يوضع إطار حول العبارة الملائمة</div>
    <p>الوثائق المصحوبة في الحالات من 3 الى 6: ${a(t.docs)}</p>
    <p>آخر عنوان ادلى به الموظف (إجباري): ${a(t.lastAddress)}</p>
    <table class="tbl frm2"><tr><th>يملأ هذا الإطار من لدن مدير(ة) المؤسسة</th><th>يملأ هذا الإطار من لدن المديرية الإقليمية</th></tr>
      <tr><td class="r">إن مدير(ة) المؤسسة يشهد بصحة البيانات الصادرة في هذا الموضوع.<br>تاريخ الارسال إلى المديرية الاقليمية : ${n(t.sendDate)}<br>تحت رقم: ${a(t.sendNo)}<br><span data-stm>التوقيع و الخاتم :</span><br><br></td>
        <td class="r">توصلت به المديرية الاقليمية بتاريخ : ${a("")}<br>تحت رقم : ${a("")}<br>يشهد السيد المدير الاقليمي بصحة البيانات الواردة في هذا الموضوع.<br>التوقيع و الطابع:<br><br></td></tr></table>
    <p class="b small2 mt u2">ملاحظة : يعبأ المطبوع بدقة بعد انصرام أجل 48 ساعة من تاريخ الانقطاع بالوسط الحضري، و 72 ساعة بالوسط القروي، و تبعث إلى المديرية الإقليمية في ثلاث نظائر أصلية.</p>`,v.exceptional=({s,e:i,f:t,history:r})=>{const p=(r||[]).slice(0,3),o=p.map(d=>`<tr><td>${e(d.duration)}</td><td>${P(d.from)}</td><td>${P(d.to)}</td><td>${e(d.reason)}</td></tr>`).join("")+Array.from({length:3-p.length},()=>"<tr><td></td><td></td><td></td><td></td></tr>").join(""),l=String(t.discipline||"").split(`
`).filter(d=>d.trim()).slice(0,2);for(;l.length<2;)l.push("");return`
    ${c(s)}
    <div class="row2 small2"><div>الرقم : ${e(t.ref||"")}</div><div class="l">حرر ب${e(s.city)} في : ${P(t.date)}</div></div>
    <div class="c b big2">طلـب رخصـة</div>
    <div class="frame row2x b"><span>${x(t.kind==="ولادة")} ولادة</span><span>${x(t.kind==="استثنائية")} رخصة استثنائية(1) : ${a(t.kind==="استثنائية"?t.kindDetail:"")}</span></div>
    <div class="frame tight2">
      <p class="row2x"><span>الاسم و النسب: ${a(b(i),"b")}</span><span>رقم البطاقة الوطنية: ${a(i.cin,"ltr")}</span></p>
      <p class="row2x"><span>الاطار: ${a(i.cadre)}</span><span>رقم التأجير: ${a(i.ppr)}</span></p>
      <p>عنوان الاقامة اثناء رخصة ( اجباري): ${a(t.address)}</p>
      <p>مدة الرخصة: ${a(t.days)} ( يوما) من: ${n(t.from,"b")} الى: ${n(t.to,"b")}</p>
      <p>تاريخ انتهاء العمل بعد الدروس : ${n(t.endWork)}</p>
    </div>
    <div class="c b small2">الرخص الاستثنائية التي تمتع(ت) بها الموظف(ة) خلال 12 شهرا متتالية</div>
    <table class="tbl"><thead><tr><th>مدتها</th><th>من</th><th>الى</th><th>ملاحظات</th></tr></thead>
      <tbody>${o}<tr><th colspan="4">سوابق تأديبية للمعني(ة) بالأمر</th></tr>${l.map(d=>`<tr><td colspan="4">${e(d)}</td></tr>`).join("")}</tbody></table>
    <p class="mt">اقتراح السيد رئيس(ة) المؤسسة : ${a(t.proposal)}</p>
    <div class="row2 b c"><div>توقيع الموظف(ة)</div><div>توقيع مدير(ة) المؤسسة</div></div>
    <div class="spacer"></div>
    <div class="fn b">ملاحظة: تمنح للموظف(ة) عشرة أيام في السنة كحد أقصى مع الإدلاء بما يبررها.<br>
      - (1) يتم تحديد نوع الرخصة الاستثنائية.<br>- يعبأ المطبوع قبل الاستفادة من الرخصة الاستثنائية.<br>
      - ضرورة ادلاء المعني(ة) بالأمر بمبرر لرخصته (ا) الاستثنائية فور تعبئته(ا) لمحضر استئناف العمل.</div>`},v.returnWarn=({s,e:i,f:t})=>{const r=(t.sex||i.sex)==="F"||/ة$|أستاذة|مديرة|ملحقة|متصرفة/.test(i.cadre||""),p=r?{you:"ك",cut:"لانقطاعك",ask:"منك",resume:"استئناف عملك",reach:"توصلك",join:"التحاقك",post:"مقر عملك",inf:"المعنية"}:{you:"ك",cut:"لانقطاعك",ask:"منك",resume:"استئناف عملك",reach:"توصلك",join:"التحاقك",post:"مقر عملك",inf:"المعني"},o=String(t.refs||"").split(/\r?\n/).map(d=>d.trim()).filter(Boolean),l=String(t.copies||"").split(/\r?\n/).map(d=>d.trim()).filter(Boolean);return`
    ${c(s)}
    <div class="row2"><div>الرقم : ${a(t.ref)}</div><div class="l">${e(t.city||s.city)} في : ${m(t.date)}</div></div>
    <div class="addr-l c2 b">
      <div class="big">مدير${r&&/مديرة/.test(t.signer||"")?"ة":""} المؤسسة</div>
      <div>إلى</div>
      <div>${r?"السيدة":"السيد"} : ${a(b(i))} ( رقم التأجير : ${a(i.ppr)} )</div>
      <div>الإطار : ${a(i.cadre)}</div>
      <div>العنوان : ${a(t.address||i.address)}</div>
    </div>
    <p class="b mt"><u>الموضوع</u> : إنذار بوجوب العودة إلى مقر العمل.</p>
    ${o.length?`<div class="mt"><b><u>المرجع</u> :</b><ul style="margin:1mm 0 0;padding-inline-start:7mm">${o.map(d=>`<li>${e(d)}</li>`).join("")}</ul></div>`:""}
    <p class="c b mt">سلام تام بوجود مولانا الإمام</p>
    <p class="j">وبعد، فنظرا ${p.cut} عن العمل بتاريخ ${m(t.stopDate)}، الشيء الذي يتنافى والقوانين الجاري بها العمل ويعد إخلالا بالتزاماتك المهنية، أوجه إليك رسالة الإنذار هذه طالبا ${p.ask} ${p.resume} في أجل أقصاه ${e(t.delay||"سبعة أيام")} ابتداء من تاريخ ${p.reach} بهذه الرسالة.</p>
    <p class="j">كما أثير انتباهك إلى أنه في حالة عدم ${p.join} ب${p.post} داخل الأجل المشار إليه أعلاه، ${e(t.sanction||"فسيتم تطبيق مسطرة ترك الوظيفة في حقك طبقا للنصوص التشريعية والتنظيمية الجاري بها العمل، ولا سيما الفصل 75 مكرر من النظام الأساسي العام للوظيفة العمومية")}.</p>
    <p class="c b mt">والسلام</p>
    <div class="l b mt2 sigw">${e(s.director||"")}<br>توقيع وخاتم مدير(ة) المؤسسة</div>
    ${l.length?`<div class="mt2 small2">${l.map(d=>`<div>- ${e(d)}</div>`).join("")}</div>`:""}
    ${t.receipt==="no"?"":`<div class="sep"></div><p class="b u">إشعار بالتوصل :</p><p>${r?"تشهد السيدة":"يشهد السيد"} ${a(b(i))} ${r?"أنها تسلمت":"أنه تسلم"} هذا الإنذار بتاريخ : ${a("")} &nbsp; التوقيع : ${a("")}</p>`}`},v.absInform=({s,e:i,f:t})=>{const r=`<div class="ab-cp">
      <div class="ab-h">${c(s)}</div>
      <div class="ab-t">إشعار بتغيب</div>
      <p class="ab-r"><span>الاسم والنسب : ${a(b(i))}</span><span>رقم التأجير : ${a(i.ppr)}</span></p>
      <p class="ab-r"><span>الإطار : ${a(i.cadre)}</span><span>الدرجة : ${a(i.grade)}</span><span>الرتبة : ${a(i.echelon)}</span><span>المهمة : ${a(t.task||i.task)}</span></p>
      <p>مقر العمل : ${a(t.post||i.unit||s.school)}</p>
      <p>تاريخ الانقطاع عن العمل : ${m(t.stopDate,"b")}${t.toDate?` &nbsp; إلى غاية : ${m(t.toDate,"b")}`:""}</p>
      <p>سبب التغيب : ${a(t.reason)}</p>
      <p>ملاحظات رئيس المؤسسة : ${a(t.notes)}</p>
      <div class="ab-s"><div>${e(t.city||s.city||"")} في : ${m(t.date)}</div><div class="b">خاتم وتوقيع رئيس المؤسسة</div></div>
    </div>`;return`<div class="ab2">${r}${t.copies==="1"?"":`<div class="ab-cut">✂</div>${r}`}</div>`},v.inquiryDir=({s,e:i,f:t})=>`
    ${c(s)}
    <div class="row2"><div>الرقم : ${a(t.ref)}</div><div class="l">${e(s.city)} في : ${n(t.date)}</div></div>
    <div class="addr-l c2 b">
      <div class="big">مدير المؤسسة</div>
      <div>الى</div>
      <div>السيد(ة) : ${a(b(i))} ( ر.ت: ${a(i.ppr)} )</div>
      <div>الاطار: ${a(i.cadre)}</div>
      <div class="small2">${e(s.directorate)}</div>
    </div>
    <p class="b big">الموضوع : استفسار</p>
    <p class="c b">سلام تام بوجود مولانا الإمام</p>
    <p>وبعد، علاقة بالموضوع المشار إليه أعلاه، يؤسفني ان أستفسرك عن :</p>
    <div class="dls">${B(t.reasons,5)}</div>
    <p class="j mt">لذا، و قبل اتخاذ قرار في حقك، يشرفني أن أطلب منك موافاتي بالبيانات المفصلة في الموضوع مصحوبة بالوثائق المبررة و ذلك في أجل لا يتعدى <b><u>${e(t.deadline||3)} أيام</u></b> من تاريخ توصلك بهذا الكتاب. &nbsp; و السلام</p>
    <div class="sep"></div>
    <p class="b u">اشعار باستلام :</p>
    <p>(ت)يشهد السيد (ة) ${a(b(i))} أنه(ا) تسلم(ت) هذا الاستفسار بتاريخ: ${n(t.receiptDate)} التوقيع: ${a("")}</p>
    <div class="sep"></div>
    <p class="b u">جواب المعني(ة) بالأمر :</p><div class="dls">${j(3)}</div>
    <p class="b u mt">رأي مدير المؤسسة:</p><div class="dls">${j(2)}</div>
    <p class="b u mt">راي المدير الاقليمي:</p><div class="dls">${j(1)}</div>
    <p class="b mt">التوقيع و الخاتم</p>`;const M=["الكتابة الخاصة","مصلحة تدبير الموارد البشرية","مصلحة الشؤون التربوية","مصلحة تأطير المؤسسات والتوجيه","مصلحة التخطيط والخريطة المدرسية","مصلحة الشؤون الإدارية والمالية","مصلحة البناءات والتجهيز والممتلكات","مصلحة الشراكة والشؤون القانونية والتواصل","المركز الإقليمي لمنظومة الإعلام","المركز الإقليمي للامتحانات"];window.Docs.DIR_SERVICES=M,v.transmittal=({s,f:i})=>{const t=String(i.items||"").split(`
`).map(o=>o.trim()).filter(Boolean).map(o=>o.split(/\s*[|;]\s*/)),r=Math.max(t.length,6);let p="";for(let o=0;o<r;o++){const l=t[o]||[];p+=`<tr><td class="r">${l[0]?`${o+1}. ${e(l[0])}`:""}</td><td>${e(l[1]||"")}</td>${o===0?`<td rowspan="${r}" class="r top">${e(i.notes||"").replace(/\n/g,"<br>")}</td>`:""}</tr>`}return`
    ${c(s)}
    <div class="row2"><div>الرقم : ${a(i.ref)}</div><div class="l">${e(s.city)} في : ${n(i.date)}</div></div>
    <div class="c b big mt2">${e(i.sender||"مدير(ة) "+(s.school||""))}</div>
    <div class="c b mt">إلى</div>
    <div class="c b">${e(i.recipient||"")}</div>
    <div class="c">${e(i.recipient2||"")}</div>
    <div class="c b big2 mt2">ورقة الإرسال</div>
    <table class="tbl tr-t mt"><thead><tr><th style="width:45%">الموضوع</th><th style="width:10%">العدد</th><th>ملاحظات</th></tr></thead><tbody>${p}</tbody></table>
    <div class="l b mt2 sigw">${e(s.director||"")}<br>مدير(ة) المؤسسة</div>`};const T={"مصلحة تدبير الموارد البشرية":["مكتب تسيير المؤسسات ابتدائي","مكتب الرخص والغياب","مكتب التعويضات العائلية","مكتب تدبير الموارد البشرية"],"مصلحة التخطيط والخريطة المدرسية":["مكتب الإحصاء والدراسات","مكتب الخريطة المدرسية ابتدائي"],"مصلحة الشؤون التربوية":["مكتب العمل التربوي","مكتب الأنشطة الاجتماعية والثقافية والفنية","مكتب الصحة المدرسية والامن الإنساني","مكتب التربية الدامجة","مكتب الارتقاء بالتعليم الاولي والتعليم الخصوصي","مكتب الارتقاء بالرياضة المدرسية"],"مصلحة تأطير المؤسسات التعليمية والتوجيه":["مكتب تاطير المؤسسات التعليمية - ابتدائي","مكتب حكامة المؤسسات التعليمية","مكتب الارتقاء بالتربية غير النظامية","المركز الإقليمي للتوجيه المدرسي والمهني","المفتشية"],"مصلحة الشؤون الإدارية والمالية والبناءات والتجهيزات والممتلكات":["وحدة الدعم الاجتماعي","مكتب السكنيات والممتلكات والماء والكهرباء","مكتب التسيير والصيانة","مكتب الصفقات - طلبات العروض: التتبع والمعالجة","مكتب التجهيز","مكتب الاقتصاد","مكتب البناءات","مكتب تدبير منح جمعيات دعم مدرسة النجاح","مكتب التعويضات والخوالة","الوكالة المفوضة"],"مصلحة الشؤون القانونية والتواصل والشراكة":["مكتب الاتصال والتواصل","مكتب الشراكة والتعاون","مكتب الشؤون القانونية والمنازعات","مكتب تنسيق التكوينات"],"المركز الإقليمي للامتحانات":["مكتب الامتحانات الاشهادية","مكتب الامتحانات المهنية والكفاءات التربوية","مكتب التقييمات والمباريات"],"وحدة منظومة الاعلام":[]};window.Docs.TX_SERVICES=Object.keys(T),window.Docs.TX_OFFICES=s=>T[String(s||"").trim()]||[].concat(...Object.values(T));const Q="تبعا لمراسلة المديرية عدد: 2070/14، بتاريخ: 03 نونبر 2014: توضع لكل مراسلة ورقة إرسال خاصة بها ولو أنها تحمل نفس الموضوع";window.Docs.TX_FOOT=s=>Q+(s&&s.directorate?`
`+s.directorate:""),v.transmittalDir=({s,f:i})=>{const r=String(i.items||"").split(`
`).map(d=>d.trim()).filter(Boolean).map(d=>d.split(/\s*\|\s*/)).map(d=>`<tr><td class="r">${e(d[0]||"")}</td><td>${e(d[1]||"")}</td><td class="r">${e(d.slice(2).join(" | ")).replace(/\n/g,"<br>")}</td></tr>`).join(""),p=a(i.no,"ltr")+(String(i.no2||"").trim()?" / "+e(i.no2):""),o=String(i.sender||"").trim()||"مدير المؤسسة",l=i.showFooter===!1?"":String(i.footer||"").split(`
`).map(d=>d.trim()).filter(Boolean).map((d,f)=>f<2?`<div class="tx-f1">${e(d)}</div>`:`<div class="tx-f2">${e(d)}</div>`).join("");return`
    ${c(s)}
    <div class="tx">
      <div class="tx-r1"><div class="tx-sch">المؤسسة: <b>${e(s.school||"")}</b></div><div class="tx-no"><div>تاريخ الإرسال : ${n(i.date)}</div><div>رقم الإرســال : ${p}</div></div></div>
      <div class="tx-r2"><div class="tx-reg">إطار خاص بمكتب الضبط</div>
        <div class="tx-to"><div class="b">من ${e(o)}</div><div class="tx-ts">إلى السيد: <b>${e(i.recipient||"")}</b></div>${String(i.service||"").trim()?`<div>${e(i.service)}</div>`:""}${String(i.office||"").trim()?`<div>${e(i.office)}</div>`:""}</div></div>
      <div class="tx-t">ورقة الإرسال</div>
      <div class="tx-main">
        <table class="tx-h"><colgroup><col style="width:60%"><col style="width:12%"><col></colgroup><tr><th>موضوع المراسلة</th><th>العدد</th><th>ملاحظـــــات</th></tr></table>
        <div class="tx-b"><i style="right:60%"></i><i style="right:72%"></i><table class="tx-i"><colgroup><col style="width:60%"><col style="width:12%"><col></colgroup><tbody>${r}</tbody></table></div>
      </div>
    </div>
    ${l?`<div class="tx-ft">${l}</div>`:""}`};const Y=s=>/ة$|أستاذة|مديرة|ملحقة|متصرفة/.test(s&&s.cadre||"");v.permission=({s,e:i,f:t})=>{const r=!t.to||t.to===t.from,p=r?1:Math.round((new Date(t.to)-new Date(t.from))/864e5)+1,o=r?`يوم ${m(t.from,"b")}`:`من ${m(t.from,"b")} إلى ${m(t.to,"b")} (${p} أيام)`,l=t.timeFrom||t.timeTo?` من الساعة ${a(t.timeFrom,"b")} إلى الساعة ${a(t.timeTo,"b")}`:"";return`
    ${c(s)}
    <div class="row2 small2"><div></div><div class="l">${e(t.city||s.city)} في: ${n(t.date)}</div></div>
    <div class="tight mt">
      <p class="row2x"><span>الاسم الكامل: ${a(b(i),"b")}</span><span>رقم التأجير: ${a(i.ppr)}</span></p>
      <p class="row2x"><span>الإطار: ${a(i.cadre)}</span><span>المهمة: ${a(i.task||i.subject)}</span></p>
    </div>
    <div class="addr-l b c2 mt"><div>إلى</div><div>السيد(ة) مدير(ة) ${e(s.school||"المؤسسة")}</div></div>
    <p class="b">الموضوع: طلب الإذن بالتغيب.</p>
    <p class="c b">سلام تام بوجود مولانا الإمام المؤيد بالله،</p>
    <p class="j body">وبعد، يشرفني أن ألتمس من سيادتكم الإذن لي بالتغيب عن العمل ${o}${l}، وذلك ${e(t.reason?u(t.reason):"لظروف خاصة")}.</p>
    ${t.compensate?'<p class="j body">وألتزم بتعويض الحصص التي سأتغيب عنها وفق ما تحدده إدارة المؤسسة، وبإعداد ما يلزم لضمان استمرارية التعلمات.</p>':""}
    <p class="c">وتقبلوا فائق عبارات التقدير والاحترام، والسلام.</p>
    <div class="l b mt sig">توقيع ${Y(i)?"المعنية":"المعني"} بالأمر:</div>
    <div class="spacer-s"></div>
    <div class="sep"></div>
    <p class="b u">قرار رئيس(ة) المؤسسة:</p>
    <p>${x(t.decision==="موافق")} موافق &nbsp;&nbsp; ${x(t.decision==="غير موافق")} غير موافق</p>
    <p>ملاحظات: ${a(t.notes)}</p>
    <div class="l b mt">توقيع وخاتم رئيس(ة) المؤسسة:</div>
    <div class="spacer"></div>`};const E=[["الــمــؤهــلات","مدى استجابة الاستاذ(ة) للتوجيهات",["مسايرته للمستجدات التربوية","تحكمه في الاطارات المنهجية المعتمدة للمكونات","قدرته على التحكم في الكفايات المرصدة لكل مكون","معرفته بالبرنامج الدراسي","تحكمه في الطريقة","قدرته على الابتكار","إسهامه في تذليل الصعوبات"]],["التخطيط","النواحي التي تحتاج إلى تتبع",["الاعداد المادي","الاعداد الذهني","احترام التسلسل التربوي","توفير المعينات التربوية","يحدد استراتيجية الدعم"]],["الــتــنــفــيــذ","الخطة العلاجية المتفق على تنفيذها خلال هذه الزيارة",["يثير اهتمام المتعلمين","يحترم الخطوات المنهجية","يستحضر التعلمات السابقة","يوجه التلاميذ نحو التعلم الذاتي","يدير الزمن المدرسي","يحترم آراء المتعلمين","يلتزم بتنفيذ البرنامج","يشرك الفئة المتعثرة"]],["التقويم والدعم","قابلية الاستاذ(ة) للنمو المهني",["يصحح انجازات المتعلمين","يختار أدوات تقويمية ملائمة لعناصر النشاط","يستثمر نتائج التقويم"]],["التواصل",null,["التواصل","الاشعاع في المحيط","العلاقات المهنية","التعاون"]]],y=["متميز","جيد","مقبول","يحتاج إلى تتبع","يحتاج إلى تتبع أكثر"];v.visit=({s,e:i,f:t})=>{let r=0;const p=[t.n1,t.n2,t.n3,t.n4],o=[7,5,8,7];let l="";E.forEach(([f,w,h],g)=>{h.forEach((H,W)=>{const _=t["ev"+r];r++;let K=`<tr>${W===0?`<td class="grp" rowspan="${h.length}"><span>${f}</span></td>`:""}<td class="ind">${H}</td>${y.map(D=>`<td class="lv">${_===D?"✕":""}</td>`).join("")}`;if(W===0&&g<4&&w){const D=g;K+=`<td class="nt" rowspan="${o[D]}"><div class="b u">${w}</div><div class="ntx">${e(p[D]||"").replace(/\n/g,"<br>")}</div></td>`}l+=K+"</tr>"})});const d=(f,w)=>`<p>${f} : ${a(w)}</p>`;return`
    ${t.withHeader?c(s):""}
    <div class="vis-top"><div class="vis-t">تقرير الزيارة</div><div class="vis-d">مقاطعة التفتيش: ${a(t.district,"b")}</div></div>
    <table class="vis-info"><tr>
      <td>
        <p>قام بها السيد(ة) : ${a(t.visitor,"b")} &nbsp; بصفته : ${a(t.visitorRole,"b")}</p>
        ${d("اسم الأستاذ (ة)",b(i))}${d("رقم التأجير",i.ppr)}${d("الوحدة المدرسية",t.unit)}
        <p>آخر نقطة التفتيش : ${a(t.lastMark)} &nbsp; تاريخها : ${n(t.lastMarkDate)}</p>
        ${d("الشهادات",t.diplomas)}${d("نسبة المواظبة الشهرية",t.attendance)}
      </td>
      <td>
        <p>بتاريخ : ${n(t.date,"b")}</p>${d("المؤسسة",s.school)}${d("المادة",t.subject)}${d("الدرس الملاحظ",t.lesson)}
        <p>الحصة : ${a(t.session)} &nbsp; الوحدة : ${a(t.unitLesson)}</p>${d("القسم",t.klass)}
        <p>عدد التلاميذ : ${a(t.pupils)} &nbsp; ذكور : ${a(t.boys)} &nbsp; إناث : ${a(t.girls)}</p>${d("الحاضرون منهم",t.present)}
      </td></tr></table>
    <table class="tbl vis-g">
      <thead><tr><th rowspan="2" style="width:7%">عناصر التقويم</th><th rowspan="2" style="width:27%">مؤشرات التقويم</th><th colspan="5">مستويات التقويم</th><th rowspan="2">ملاحظات وتوجيهات</th></tr>
        <tr>${y.map(f=>`<th class="lvh">${f}</th>`).join("")}</tr></thead>
      <tbody>${l}</tbody></table>
    <div class="vis-tot"><span class="b">التقدير الإجمالي :</span> ${e(t.overall||"")}</div>
    <div class="vis-sig b"><span>الأستاذ(ة)</span><span>المدير(ة)</span><span>المفتش(ة)</span></div>
    <div class="spacer"></div>`},window.Docs.VISIT=E,window.Docs.VISIT_LEVELS=y,Object.assign(N,{exceptional:{title:"طلب رخصة (استثنائية / ولادة)",icon:"🗓️",desc:"نموذج المديرية مع جدول الرخص الاستثنائية خلال 12 شهرا",cat:"leave"},marriage:{title:"طلب رخصة الزواج",icon:"💍",desc:"طلب الاستفادة من رخصة استثنائية للزواج، يحرره الموظف مرفقا بعقد الزواج",page:"a4",pageClass:"big-a4",cat:"leave"},assignReq:{title:"طلب التكليف",icon:"🔁",desc:"طلب تكليف مؤقت بإحدى المؤسسات (جدول الاختيارات) أو طلب تكليف بالتبادل مع أستاذ(ة)",page:"a4",pageClass:"big-a4",cat:"work"},paternity:{title:"طلب رخصة الأبوة",icon:"👶",desc:"طلب يحرره الموظف مرفقا بشهادة الوضع",page:"a4",pageClass:"big-a4",cat:"leave"},breastfeeding:{title:"طلب رخصة الرضاعة",icon:"🍼",desc:"بعد استئناف العمل إثر رخصة الولادة",page:"a4",pageClass:"big-a4",cat:"leave"},medicalDir:{title:"وصل تسلم الشهادة الطبية",icon:"🩺",desc:"النموذج الرسمي: نسخة للمدلي ونسخة تلحق بالشهادة",cat:"leave"},counterExam:{title:"طلب إجراء فحص طبي مضاد",icon:"⚕️",desc:"إلى مندوبية وزارة الصحة مع جدول الشواهد السابقة",page:"a4",cat:"leave"},inquiryDir:{title:"استفسار",icon:"❔",desc:"مع جواب المعني ورأي المدير",page:"a4",cat:"work"},resume2:{title:"محضر استئناف العمل (A4)",icon:"✔️",desc:"نموذج صفحة كاملة",page:"a4",cat:"work"},joinWork:{title:"محضر الالتحاق بالعمل",icon:"🏫",desc:"التحاق موظف جديد أو منقول أو عائد بالمؤسسة، على نموذج المديرية",page:"a4",cat:"work"},resumeDir:{title:"محضر استئناف العمل (نموذج المديرية)",icon:"☑️",desc:"النموذج الرسمي للمديرية الإقليمية",page:"a4",cat:"work"},absenceNotice:{title:"إعلان بانقطاع عن العمل",icon:"⛔",desc:"يبعث في ثلاث نظائر بعد 48 أو 72 ساعة",page:"a4",cat:"work"},absInform:{title:"إشعار بتغيب",icon:"📝",desc:"إشعار بتغيب موظف(ة): الإطار والدرجة والرتبة والمهمة، تاريخ الانقطاع وسببه وملاحظات رئيس المؤسسة — نسختان في الورقة",page:"a4",cat:"work"},returnWarn:{title:"إنذار بوجوب العودة إلى العمل",icon:"⚠️",desc:"بعد الانقطاع عن العمل: أجل سبعة أيام لاستئناف العمل (موظفو الوزارة)",page:"a4",cat:"work"},missionArrival:{title:"إخبار بالوصول إلى مقر المأمورية",icon:"📍",desc:"حالة تكليف",page:"a4",cat:"work"},certificate2:{title:"طلب شهادة",icon:"📃",desc:"شهادة العمل، الأجرة، الالتزام...",page:"a4",pageClass:"big-a4",cat:"cert"},workAttAr:{title:"شهادة العمل",icon:"🏅",desc:"تسلمها المؤسسة بالعربية، مع ترويسة المؤسسة",page:"a4",pageClass:"wa-a4",cat:"cert",quick:!0},workAttFr:{title:"Attestation de travail",icon:"📜",desc:"شهادة العمل بالفرنسية، مع ترويسة المؤسسة",page:"a4",pageClass:"wa-a4",cat:"cert",quick:!0},birthCard:{title:"بطاقة تقديم (ازدياد - وفاة)",icon:"👪",desc:"للتعويضات العائلية",page:"a4",cat:"cert"},spouseCard:{title:"بطاقة تقديم (حركية الزوج)",icon:"💑",desc:"زواج، طلاق، وفاة، مهنة الزوج",page:"a4",pageClass:"mid-a4",cat:"cert"},transmittal:{title:"ورقة الإرسال",icon:"📨",desc:"لإرسال الوثائق إلى المديرية",page:"a4",cat:"mail",noEmp:!0},transmittalDir:{title:"ورقة الإرسال (نموذج المديرية)",icon:"📮",desc:"إطار مكتب الضبط، المصلحة والمكتب، العدد والملاحظات: نسختان في ورقة A4 أفقية",cat:"mail",noEmp:!0},permission:{title:"طلب الإذن بالتغيب",icon:"🙋",desc:"تغيب لمدة قصيرة بإذن من رئيس المؤسسة",cat:"leave"},visit:{title:"تقرير الزيارة",icon:"🏫",desc:"زيارة صفية: شبكة مؤشرات التقويم والتوجيهات",page:"a4",pageClass:"vis-a4",cat:"peda"}}),N.monthly.noEmp=!0,["inquiry","leave","certificate","medical","resume2"].forEach(s=>{N[s]&&(N[s].hidden=!0)}),window.Docs.CATS=[["leave","الرخص والغياب"],["work","الاستئناف والانقطاع والاستفسار"],["peda","التأطير والتتبع التربوي"],["cert","الشهادات وبطاقات التقديم"],["mail","المراسلات"]],window.Docs.RESUME2_CASES=X,window.Docs.RESUMEDIR_CASES=$,window.Docs.JOIN_CASES=F,window.Docs.STOP_REASONS=I,window.Docs.longDate=S,window.Docs.extraCss=`
  .page-a4 .hdr-img{margin:-10mm -12mm 3mm}.page-a4 .hdr-img img{width:100%;height:auto}
  .info{margin:3mm 0 2mm;padding-right:5mm;line-height:1.75}.info li{margin:0}
  .info2 p{margin:0 0 .6mm}
  /* 1.9.4: sender (المرسل) and recipient (المرسل إليه) are centred on the page, the recipient under the sender */
  .addr-l{width:60%;margin:3mm auto;text-align:center;line-height:1.6}
  .addr-l.c2{width:64%}
  table.ar-t{width:92%;margin:2mm auto 3mm;border-collapse:collapse;font-size:11.5pt}table.ar-t th,table.ar-t td{border:1px solid #000;padding:1mm 2mm;height:7.5mm}table.ar-t th{background:#eef2f1;font-weight:700}
  .tx{flex:1;min-height:0;display:flex;flex-direction:column;border:1.4px solid #000;margin-top:1.5mm;font-size:10pt}
  .tx-r1{display:flex;border-bottom:1.4px solid #000;min-height:13mm}
  .tx-sch{flex:1;padding:1.5mm 3mm;display:flex;align-items:center;font-size:11pt}
  .tx-no{width:44%;padding:1.2mm 3mm;line-height:1.75;font-weight:700;display:flex;flex-direction:column;justify-content:center;font-size:9.6pt}
  .tx-r2{display:flex;border-bottom:1.4px solid #000}
  .tx-reg{width:42%;padding:1mm 2mm;border-left:1.4px solid #000;min-height:33mm;font-size:9.6pt}
  .tx-to{flex:1;padding:2mm 2.5mm;text-align:center;line-height:1.7;font-size:10pt}.tx-to>div{margin:0}.tx-ts{margin-top:.8mm}
  .tx-t{text-align:center;font-size:15pt;font-weight:700;padding:.6mm 0 .8mm;border-bottom:1.4px solid #000;line-height:1.5}
  .tx-main{flex:1;min-height:0;display:flex;flex-direction:column}
  .tx-h{width:100%;table-layout:fixed;border-collapse:collapse}.tx-h th{background:#d9d9d9;border-bottom:1.4px solid #000;font-size:10.4pt;padding:.8mm 1mm;text-align:center}.tx-h th+th{border-right:1.2px solid #000}
  .tx-b{flex:1;min-height:0;position:relative}.tx-b>i{position:absolute;top:0;bottom:0;width:0;border-left:1.2px solid #000}
  .tx-i{width:100%;table-layout:fixed;border-collapse:collapse;position:relative}.tx-i td{padding:.7mm 2mm;vertical-align:top;font-size:10pt;line-height:1.5;text-align:center}.tx-i td.r{text-align:right}
  .tx-ft{margin-top:1.5mm;text-align:center;line-height:1.45}.tx-f1{font-size:7.2pt}.tx-f2{font-size:7.4pt;font-weight:700;font-family:'Times New Roman',serif;direction:ltr}
  .subj{margin-top:3mm}
  .body{line-height:1.85;text-indent:8mm}
  .sig{margin-left:15mm}
  .small2{font-size:8.6pt;line-height:1.5}
  .big{font-size:13pt}.big2{font-size:16pt}
  .u{text-decoration:underline}.u2{text-decoration:underline}
  .ind2{text-indent:10mm}
  .lh2{line-height:2.05}.lh2 p{margin:0}
  .row2x{display:flex;justify-content:space-between;gap:4mm}.row2x>*{flex:1}
  .row3x{display:flex;justify-content:space-between;gap:3mm}.row3x>*{flex:1}
  .ab2{display:flex;flex-direction:column;height:100%}.ab-cp{height:134mm;box-sizing:border-box;display:flex;flex-direction:column;font-size:12pt;overflow:hidden}.ab-cp p{margin:.6mm 0;line-height:1.5}
  .ab-h{zoom:.66}.ab-t{align-self:center;border:1.5px solid #333;border-radius:3mm;padding:.6mm 10mm;font-weight:700;font-size:16pt;margin:1mm 0 3mm;box-shadow:1.5px 1.5px 0 #333}
  .ab-r{display:flex;flex-wrap:wrap;gap:1mm 7mm}.ab-s{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-start;min-height:37mm;padding-left:12mm}
  .ab-cut{text-align:center;color:#777;font-size:10pt;border-top:1.2px dashed #888;line-height:1;margin:1.5mm 0 2mm}
  .kv2 td{padding:1.2mm 0}.kv2 .lbc{width:28%}.kv2 .frc{width:32%;text-align:left}
  .wa-a4{font-size:12.5pt;line-height:1.75}
  .wa-title{text-align:center;font-family:'MAJT','Amiri',serif;font-weight:700;font-size:24pt;margin:12mm 0 10mm;line-height:1.3}
  .wa-title.fr{font-family:Arial,'Liberation Sans','MAJ','NSA',sans-serif;font-size:19pt;letter-spacing:.3px}
  .wa-intro{margin:0 0 4mm}
  .wa-kv{margin:0 0 6mm}.wa-kv td{padding:2.2mm 0;vertical-align:top}.wa-kv .lbc{width:30%;font-weight:600}.wa-kv .sepc{width:5mm;text-align:center}
  .wa-p{margin:0 0 4mm;text-align:justify;line-height:1.9}
  .wa-sign{margin-top:8mm;margin-inline-start:auto;width:60%;text-align:center}
  .wa-fr{direction:ltr;text-align:left;font-family:Arial,'Liberation Sans','MAJ','NSA',sans-serif}
  .wa-fr .vv .v{text-transform:uppercase}
  .wa-fr .wa-sign{margin-inline-start:auto;margin-inline-end:0}
  .sep{border-top:1.2px solid #000;margin:2mm 0}
  .frame{border:1.2px solid #000;padding:1.5mm 3mm;margin:1.5mm 0}
  .sigt{margin-top:2mm}.sigt td{height:18mm}.sigt th{background:#ececec}
  .ribbon{align-self:center;text-align:center;border:1.4px solid #000;border-radius:2mm;padding:1mm 12mm;margin:4mm 0 5mm;font-size:15pt;line-height:1.45;box-shadow:-8mm 3mm 0 -2mm #f3f3f3,8mm 3mm 0 -2mm #f3f3f3}
  .form-lines p{margin:0 0 2.6mm;line-height:1.7}
  .form-lines.b2 p{margin-bottom:1.8mm;font-weight:600}
  .footbox{border:1px solid #000;padding:1mm 3mm;font-size:8.6pt;font-weight:700;text-align:center}
  .title-u{font-family:'MAJT','Amiri',serif;font-size:20pt;font-weight:700;text-decoration:underline;margin:2mm 0 3mm}
  .title-u2{font-size:13pt;font-weight:700;text-decoration:underline;margin:2mm 0 2mm}
  .vsec{display:flex;border:1.2px solid #000;margin-bottom:2mm}
  .vlab{width:13mm;background:#dcdcdc;border-left:1.2px solid #000;display:flex;align-items:center;justify-content:center}
  .vlab span{writing-mode:vertical-rl;transform:rotate(180deg);font-weight:700;font-size:13pt;white-space:nowrap}
  .vbody{flex:1;padding:2mm 3mm;line-height:2}.vbody p{margin:0}
  .cases1{line-height:1.75;padding-right:3mm}
  .dir-foot{margin-top:3mm;text-align:center}.dir-foot img{width:100%;max-height:19mm;object-fit:contain}.dir-foot.txt{font-size:9pt;border-top:1px solid #000;padding-top:1.5mm}
  .halves{display:flex;flex-direction:column;height:100%}
  .half{flex:1 1 0;display:flex;flex-direction:column;overflow:hidden;font-size:9.1pt}
  .half .hdr-img img{max-height:26mm;object-fit:fill}.half .hdr-img{margin:0 -12mm 1mm}
  .spaced{letter-spacing:1.2mm;font-size:13pt;font-weight:700}
  .tight p{margin:0;line-height:1.75}.half .tight p{line-height:1.6}
  .tight2 p{margin:0;line-height:1.85}
  .fn{font-size:7.6pt;line-height:1.5;margin-top:1mm}
  .reasons{line-height:1.8;padding-right:3mm}.circ{border:1.4px solid #000;border-radius:2mm;padding:0 2mm}
  .frm2 td,.frm2 th{font-size:9pt}.tbl td.r{text-align:right;vertical-align:top;line-height:1.9}
  .dls .dl{border-bottom:1px dotted #444;height:6.6mm}.dls .dl.filled{height:auto;min-height:6.6mm;padding-top:.6mm}
  .tr-t td{height:9mm}.tr-t td.top{vertical-align:top;padding:2mm}
  .big-a4{font-size:13.5pt;line-height:1.8}.big-a4 .small2{font-size:10pt}.big-a4 .body{line-height:2}.big-a4 .info{line-height:1.9}.big-a4 .kv2 td{padding:2mm 0}
  .mid-a4{font-size:12pt}.mid-a4 .form-lines p{margin-bottom:3.2mm}
  .sigw{margin-left:12mm;text-align:center;width:60mm;margin-right:auto;line-height:1.8}
  .r2sig{margin-top:5mm}.r2sig .box{min-height:32mm}
  .r2cases{line-height:1.9}.r2cases.two{display:grid;grid-template-columns:1fr 1fr;column-gap:4mm;line-height:1.6;font-size:9.4pt;padding-right:0}
  .vis-a4{font-size:9.6pt;line-height:1.45;padding:8mm 10mm}.page-a4.vis-a4 .hdr-img{margin:-8mm -10mm 2mm}
  .vis-top{display:flex;align-items:center;justify-content:space-between;border:1.2px solid #000;background:#efefef;padding:1mm 4mm;margin-bottom:2mm}
  .vis-t{font-family:'MAJT','Amiri',serif;font-weight:700;font-size:15pt}.vis-d{font-size:10pt}
  .vis-info{width:100%;border-collapse:collapse;margin-bottom:2mm}.vis-info td{border:1.2px solid #000;vertical-align:top;padding:1mm 2.5mm;width:50%;background:#f7f7f7}
  .vis-info p{margin:0;line-height:1.75}
  .vis-g{font-size:8.6pt;line-height:1.25}.vis-g th{font-size:8.2pt;padding:.6mm .5mm}.vis-g td{height:5.3mm;padding:.3mm .8mm}
  .vis-g th.lvh{width:7.2%;font-size:7.6pt;line-height:1.15}
  .vis-g td.ind{text-align:right}.vis-g td.lv{font-weight:700}
  .vis-g td.grp{background:#ececec;width:7%;padding:0}.vis-g td.grp span{writing-mode:vertical-rl;transform:rotate(180deg);font-weight:700;font-size:9pt;white-space:nowrap;display:inline-block}
  .vis-g td.nt{vertical-align:top;text-align:right;font-size:8.6pt;line-height:1.5;padding:1mm 1.5mm}.vis-g .ntx{margin-top:1mm}
  .vis-tot{border:1.2px solid #000;border-top:0;min-height:12mm;padding:1mm 2.5mm}
  .vis-sig{display:flex;justify-content:space-around;margin-top:4mm;font-size:11pt}
  `})();

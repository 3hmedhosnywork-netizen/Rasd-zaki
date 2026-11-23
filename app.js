(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'marsal-sites-v1';
  const normalize = raw => ({
    prefix: typeof raw?.prefix === 'string' ? raw.prefix : '',
    next: raw?.next === null || raw?.next === '' || raw?.next === undefined ? null : Number(raw.next),
    pendingSendId: typeof raw?.pendingSendId === 'string' ? raw.pendingSendId : null,
    pendingSendAt: Number(raw?.pendingSendAt)||0,
    pendingWentAwayAt: Number(raw?.pendingWentAwayAt)||0,
    pendingReturnHandled: typeof raw?.pendingReturnHandled === 'string' ? raw.pendingReturnHandled : null,
    items: Array.isArray(raw?.items) ? raw.items.filter(x => x && typeof x.url === 'string').map(x => ({
      id: String(x.id || (Date.now()+Math.random())), code: String(x.code || ''), url: String(x.url), sent: !!x.sent, created: Number(x.created)||Date.now()
    })) : []
  });
  let state = {prefix:'',next:null,pendingSendId:null,pendingSendAt:0,pendingWentAwayAt:0,pendingReturnHandled:null,items:[]};
  try { state = normalize(JSON.parse(localStorage.getItem(KEY)||'{}')); } catch {}
  let installPrompt = null;
  let visibleCount = 120;
  const PAGE_SIZE = 120;
  function persist(){ localStorage.setItem(KEY,JSON.stringify(state)); render(); }
  function extractUrl(value){
    const matches=String(value||'').match(/https?:\/\/[^\s<>"']+/ig)||[];
    for(const raw of matches){ const url=raw.replace(/[),،؛.!؟]+$/,''); if(/maps\.|google\.[^/]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl/i.test(url)) return url; }
    return matches[0]?.replace(/[),،؛.!؟]+$/,'')||'';
  }
  function makeCode(){ if(!state.prefix.trim()||state.next===null||!Number.isFinite(state.next)){return '';} return state.prefix.trim()+state.next; }
  function addLink(raw, explicitCode=''){
    const url=extractUrl(raw); if(!url){notice('لم أتعرف على رابط خرائط. الصق الرابط وحاول مرة أخرى.');return false;}
    const typedCode=String(explicitCode||$('codeInput').value||'').trim();
    const code=typedCode||makeCode();
    if(!code){ $('urlInput').value=url; notice('الرابط وصل. أدخل اسم الدبوس مثل A111 أو حدد الترقيم ثم أضف الموقع.'); return false; }
    if(state.items.some(x=>x.url===url)){ $('urlInput').value=''; $('codeInput').value=''; notice('الرابط ده موجود بالفعل في القائمة.'); return false; }
    if(state.items.some(x=>x.code.toLowerCase()===code.toLowerCase())){ $('urlInput').value=url; $('codeInput').value=code; notice(`الكود ${code} موجود بالفعل. لم يتم تسجيل الموقع لتجنب التكرار.`); return false; }
    state.items.push({id:String(Date.now()+Math.random()),code,url,sent:false,created:Date.now()});
    if(!typedCode && state.next!==null && Number.isFinite(state.next)) state.next+=1;
    $('urlInput').value=''; $('codeInput').value='';notice(`تم إضافة الموقع باسم ${code}.`);persist();return true;
  }
  function extractPinCode(sharedText, title=''){
    // Inspect only the human-readable title/text before a URL; never derive a code from the URL slug.
    const sources=[String(title||''),String(sharedText||'')];
    const codePattern=/\b([A-Za-z]{1,4}[-_ ]?\d{1,5})\b/g;
    for(const source of sources){
      const beforeUrl=source.split(/https?:\/\//i)[0];
      const matches=[...beforeUrl.matchAll(codePattern)].map(m=>m[1].replace(/[-_ ]/g,''));
      if(matches.length){ return matches[matches.length-1].toUpperCase(); }
    }
    return '';
  }
  function notice(text){ $('shareNotice').textContent=text; $('shareNotice').classList.remove('hidden'); }
  // A blank line is intentionally kept between the URL and code to match the user's WhatsApp layout.
  function formatted(item){ return `${item.url}\n\n\n\n\n${item.code}`; }
  function waShare(text){ const url='https://wa.me/?text='+encodeURIComponent(text); window.open(url,'_blank'); }
  function codeParts(code){ const m=String(code||'').match(/^([A-Za-z]+)[\s_-]*(\d+)$/); return m ? {letters:m[1].toUpperCase(),num:Number(m[2]),raw:String(code)} : {letters:String(code||'').toUpperCase(),num:null,raw:String(code||'')}; }
  function ordered(){ return [...state.items].sort((a,b)=>{ const A=codeParts(a.code),B=codeParts(b.code); const letterCmp=A.letters.localeCompare(B.letters,'en'); if(letterCmp) return letterCmp; if(A.num!==null&&B.num!==null) return B.num-A.num; if(A.num!==null) return -1; if(B.num!==null) return 1; return A.raw.localeCompare(B.raw,'en',{numeric:true}); }); }
  function chronological(){ return [...state.items].sort((a,b)=>a.created-b.created); }
  function render(){
    $('prefix').value=state.prefix; $('nextNumber').value=state.next??''; $('count').textContent=`${state.items.length} موقع`;
    $('queue').replaceChildren(); $('empty').classList.toggle('hidden',state.items.length>0); $('sendAllBtn').classList.toggle('hidden',state.items.length===0);
    let moreBtn=$('loadMoreBtn'); if(!moreBtn){moreBtn=document.createElement('button');moreBtn.id='loadMoreBtn';moreBtn.className='secondary';moreBtn.style.width='100%';moreBtn.style.margin='12px 0';moreBtn.textContent='عرض المزيد من المواقع';moreBtn.onclick=()=>{visibleCount+=PAGE_SIZE;render();};$('queue').after(moreBtn);} moreBtn.classList.toggle('hidden',state.items.length<=visibleCount); moreBtn.textContent=`عرض ${Math.max(0,Math.min(PAGE_SIZE,state.items.length-visibleCount))} موقع إضافي (${Math.min(visibleCount,state.items.length)} من ${state.items.length})`;
    const nextToSend=ordered().find(x=>!x.sent);
    $('sendAllBtn').textContent=state.pendingSendId?`بانتظار الرجوع من واتساب (${chronological().find(x=>x.id===state.pendingSendId)?.code||''})`:(nextToSend?`إرسال الموقع التالي (${nextToSend.code}) إلى واتساب`:'تم إرسال جميع المواقع');
    $('sendAllBtn').disabled=!nextToSend||!!state.pendingSendId;
    for(const item of ordered().slice(0,visibleCount)){
      const card=document.createElement('article'); card.className='item';
      const top=document.createElement('div'); top.className='item-top';
      const code=document.createElement('strong'); code.className='code'; code.textContent=item.code;
      const status=document.createElement('span'); status.className='tag'+(item.sent?' done':''); status.textContent=item.sent?'تم الإرسال':(state.pendingSendId===item.id?'جارٍ الإرسال':'بانتظار الإرسال'); top.append(code,status);
      const link=document.createElement('div'); link.className='link'; link.textContent=item.url;
      const actions=document.createElement('div'); actions.className='item-actions';
      const resend=document.createElement('button'); resend.className='resend'; resend.textContent='إعادة إرسال'; resend.onclick=()=>waShare(formatted(item));
      const remove=document.createElement('button'); remove.className='delete-item'; remove.textContent='مسح الموقع'; remove.onclick=()=>{if(confirm(`حذف الموقع ${item.code} من القائمة؟`)){if(state.pendingSendId===item.id){state.pendingSendId=null;state.pendingSendAt=0;state.pendingWentAwayAt=0;state.pendingReturnHandled=null;}state.items=state.items.filter(x=>x.id!==item.id);persist();notice(`تم حذف الموقع ${item.code}.`);}};
      actions.append(resend,remove); card.append(top,link,actions); $('queue').append(card);
    }
  }
  $('prefix').onchange=()=>{state.prefix=$('prefix').value.trim();persist();};
  $('nextNumber').onchange=()=>{const v=$('nextNumber').value.trim();state.next=v===''?null:Math.max(0,parseInt(v,10)||0);persist();};
  $('addBtn').onclick=()=>addLink($('urlInput').value,$('codeInput').value);
  $('pasteBtn').onclick=async()=>{try{$('urlInput').value=await navigator.clipboard.readText();}catch{notice('الصق الرابط يدويًا داخل المربع.');}};
  $('clearDone').textContent='مسح الكل';
  $('clearDone').onclick=()=>{const count=state.items.length;if(!count){notice('القائمة فارغة بالفعل.');return;}if(confirm(`تأكيد مسح الكل؟ سيتم حذف جميع المواقع (${count}) بما فيها المرسلة وغير المرسلة. لا يمكن التراجع.`)){state.items=[];state.pendingSendId=null;state.pendingSendAt=0;state.pendingWentAwayAt=0;state.pendingReturnHandled=null;persist();notice('تم مسح كل المواقع من القائمة.');}};
  $('sendAllBtn').onclick=()=>{const next=ordered().find(x=>!x.sent);if(!next||state.pendingSendId)return;state.pendingSendId=next.id;state.pendingSendAt=Date.now();state.pendingWentAwayAt=0;state.pendingReturnHandled=null;persist();waShare(formatted(next));notice(`تم تجهيز ${next.code}. بعد الرجوع من واتساب سيتم نقل الطابور تلقائيًا للموقع التالي.`);};
  let finalizeTimer=null;
  function finalizeAfterReturn(){
    if(finalizeTimer)clearTimeout(finalizeTimer);
    finalizeTimer=setTimeout(()=>{
      if(document.visibilityState!=='visible'||!state.pendingSendId||!state.pendingSendAt)return;
      // Android/PWA may return from WhatsApp without firing visibilitychange(hidden).
      // Treat a stable visible return after a short handoff window as completion, even if hidden was missed.
      if(Date.now()-state.pendingSendAt<1800)return;
      const pending=state.pendingSendId;
      if(state.pendingReturnHandled===pending)return;
      const item=state.items.find(x=>x.id===pending);
      if(item&&!item.sent){item.sent=true;notice(`تم تسجيل ${item.code} وإعداد الموقع التالي تلقائيًا.`);}
      state.pendingReturnHandled=pending;
      state.pendingSendId=null;state.pendingSendAt=0;state.pendingWentAwayAt=0;
      persist();
    },700);
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      if(state.pendingSendId&&!state.pendingWentAwayAt){state.pendingWentAwayAt=Date.now();persist();}
    }else finalizeAfterReturn();
  });
  window.addEventListener('pageshow',()=>{if(state.pendingSendId)finalizeAfterReturn();});
  window.addEventListener('focus',()=>{if(state.pendingSendId)finalizeAfterReturn();});
  // Recover a pending share on app return/start; visibility hidden is not reliable on Android PWAs.
  function handleShared(){
    const p=new URLSearchParams(location.search);
    const title=p.get('title')||''; const text=p.get('text')||''; const urlParam=p.get('url')||'';
    const received=[urlParam,text,title].filter(Boolean).join('\n'); const url=extractUrl(received);
    const code=extractPinCode(text,title);
    if(url){
      if(code){ $('urlInput').value=url; $('codeInput').value=code; addLink(url,code); }
      else { $('urlInput').value=url; $('codeInput').value=''; notice('استلمت الرابط لكن اسم الدبوس لم يظهر في بيانات المشاركة. اكتب الاسم مثل A111 ثم اضغط إضافة الموقع؛ لن أرقّمه تلقائيًا.'); }
    }else if(received){ $('urlInput').value=received; $('codeInput').value=code; notice(code?`تم استخراج اسم الدبوس ${code}، لكن لم أجد رابط خرائط صالحًا.`:'تم استلام المشاركة، لكن لم أتمكن من استخراج اسم الدبوس والرابط.'); }
    if(received)history.replaceState({},'',location.pathname);
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').classList.remove('hidden');});
  $('installBtn').onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').classList.add('hidden');};
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

  // V7: Keep KML/KMZ import and add lightweight JSON import for Android file pickers.
  const mapFile=$('mapFile'), importBtn=$('importMapBtn'), importNotice=$('importNotice');
  function importMsg(s){importNotice.textContent=s;importNotice.classList.remove('hidden');}
  // Android picker compatibility: confirm file selection immediately and accept generic MIME types.
  mapFile.addEventListener('change',()=>{
    const file=mapFile.files?.[0];
    if(!file){importMsg('لم يتم اختيار ملف. حاول اختيار الملف مرة أخرى.');return;}
    importMsg(`تم اختيار الملف: ${file.name} (${(file.size/1024/1024).toFixed(2)} MB). اضغط «استيراد المواقع» للقراءة.`);
  });
  async function readSelectedFile(file){
    if(typeof file.text==='function') return await file.text();
    return await new Promise((resolve,reject)=>{
      const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result||''));
      reader.onerror=()=>reject(new Error('تعذر قراءة الملف من الهاتف.'));
      reader.readAsText(file,'UTF-8');
    });
  }
  function parseKmlText(xmlText){
    const doc=new DOMParser().parseFromString(xmlText,'application/xml');
    if(doc.querySelector('parsererror')) throw new Error('ملف KML غير صالح.');
    const placemarks=[...doc.getElementsByTagNameNS('*','Placemark')];
    const found=[];
    for(const pm of placemarks){
      const name=(pm.getElementsByTagNameNS('*','name')[0]?.textContent||'').trim();
      const coordNode=pm.getElementsByTagNameNS('*','coordinates')[0];
      if(!coordNode) continue;
      const raw=coordNode.textContent.trim().split(/[\s]+/)[0];
      const parts=raw.split(','); if(parts.length<2) continue;
      const lon=Number(parts[0]), lat=Number(parts[1]); if(!Number.isFinite(lon)||!Number.isFinite(lat)) continue;
      const codeMatch=name.match(/\b([A-Za-z]{1,5}[-_ ]?\d{1,6})\b/);
      const code=codeMatch?codeMatch[1].replace(/[-_ ]/g,'').toUpperCase():name;
      if(!code) continue;
      const url=`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      found.push({code,url,name,lat,lon});
    }
    return found;
  }
  async function extractKmlFromKmz(buf){
    // Read ZIP local file headers and support common stored/deflate KML entries.
    const view=new DataView(buf); let pos=0;
    while(pos+30<=view.byteLength){
      if(view.getUint32(pos,true)!==0x04034b50){pos++;continue;}
      const method=view.getUint16(pos+8,true), compSize=view.getUint32(pos+18,true), nameLen=view.getUint16(pos+26,true), extraLen=view.getUint16(pos+28,true);
      const nameBytes=new Uint8Array(buf,pos+30,nameLen); const filename=new TextDecoder().decode(nameBytes);
      const dataStart=pos+30+nameLen+extraLen;
      if(filename.toLowerCase().endsWith('.kml')){
        const compressed=new Uint8Array(buf,dataStart,compSize); let data;
        if(method===0)data=compressed;
        else if(method===8){
          if(typeof DecompressionStream==='undefined') throw new Error('متصفحك لا يدعم فك KMZ. جرّب تصدير KML.');
          const ds=new DecompressionStream('deflate-raw'); data=new Uint8Array(await new Response(new Blob([compressed]).stream().pipeThrough(ds)).arrayBuffer());
        } else throw new Error('ضغط KMZ غير مدعوم. جرّب ملف KML.');
        return new TextDecoder().decode(data);
      }
      pos=dataStart+compSize;
    }
    throw new Error('لم أجد ملف KML داخل KMZ.');
  }
  importBtn.onclick=async()=>{
    const file=mapFile.files?.[0]; if(!file){importMsg('اختار ملف JSON أو KML أو KMZ الأول.');return;}
    try{
      let pins;
      const lowerName=String(file.name||'').toLowerCase();
      const looksJson=lowerName.endsWith('.json')||/json/i.test(file.type||'');
      if(looksJson){
        const parsed=JSON.parse(await readSelectedFile(file));
        const rawPins=Array.isArray(parsed)?parsed:(Array.isArray(parsed?.pins)?parsed.pins:[]);
        pins=rawPins.map(p=>{const lat=Number(p.lat),lon=Number(p.lon);const name=String(p.name??p.code??'').trim();const code=String(p.code??name).trim();const url=String(p.url||((Number.isFinite(lat)&&Number.isFinite(lon))?`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`:''));return {code,name,lat,lon,url};}).filter(p=>p.code&&p.url);
      }else{
        let text;
        if(lowerName.endsWith('.kmz')) text=await extractKmlFromKmz(await file.arrayBuffer()); else text=await readSelectedFile(file);
        pins=parseKmlText(text);
      } if(!pins.length){importMsg('لم أجد دبابيس بها أسماء وإحداثيات في الملف.');return;}
      // Import deduplication is by code only. Different site codes may legitimately share a map URL/location.
      const unique=[]; const seenCodes=new Set();
      for(const p of pins){const ck=p.code.trim().toLowerCase(); if(seenCodes.has(ck)||state.items.some(x=>String(x.code||'').trim().toLowerCase()===ck))continue;seenCodes.add(ck);unique.push(p);}
      if(!unique.length){importMsg(`قرأت ${pins.length} دبوس، لكن جميع الأكواد موجودة بالفعل أو مكررة؛ لم أضف شيئًا.`);return;}
      if(!confirm(`قرأت ${pins.length} دبوس من الخريطة. سيتم إضافة ${unique.length} كود جديد. هل تريد المتابعة؟`))return;
      unique.forEach(p=>state.items.push({id:String(Date.now()+Math.random()),code:p.code,url:p.url,sent:false,created:Date.now(),sourceName:p.name,lat:p.lat,lon:p.lon}));
      persist(); importMsg(`تم استيراد ${unique.length} كود. تم تجاهل ${pins.length-unique.length} كود مكرر/موجود مسبقًا. (لم يعد يتم تجاهل المواقع بسبب تشابه الرابط فقط)`);
    }catch(e){importMsg(e?.message||'حدث خطأ أثناء قراءة الملف.');}
  };


  // V11: Safe deletion of an entire single-letter code group (sent and unsent).
  const letterDeleteToggle=$('letterDeleteToggle'), letterDeleteBody=$('letterDeleteBody'), letterDeleteInput=$('letterDeleteInput'), letterDeletePreview=$('letterDeletePreview'), letterDeleteConfirm=$('letterDeleteConfirm');
  function matchingLetterGroup(letter){
    const L=String(letter||'').trim().toUpperCase();
    if(!/^[A-Z]$/.test(L)) return [];
    return state.items.filter(item=>{const parts=codeParts(item.code);return parts.letters===L&&parts.num!==null;});
  }
  letterDeleteToggle.onclick=()=>{const open=letterDeleteBody.classList.contains('hidden');letterDeleteBody.classList.toggle('hidden',!open);letterDeleteToggle.textContent=open?'إغلاق':'فتح';if(open)letterDeleteInput.focus();};
  letterDeleteInput.oninput=()=>{letterDeleteInput.value=letterDeleteInput.value.replace(/[^a-z]/gi,'').slice(0,1).toUpperCase();const letter=letterDeleteInput.value;const matches=matchingLetterGroup(letter);letterDeleteConfirm.disabled=!letter||matches.length===0;letterDeletePreview.textContent=letter?(matches.length?`الحرف ${letter}: سيتم حذف ${matches.length} موقع (المرسل وغير المرسل).`:`لا توجد مواقع مسجلة بكود يبدأ بالحرف ${letter} متبوعًا برقم.`): 'أدخل حرفًا لعرض عدد المواقع المستهدفة.';};
  letterDeleteConfirm.onclick=()=>{const letter=letterDeleteInput.value.trim().toUpperCase();const matches=matchingLetterGroup(letter);if(!matches.length)return;const count=matches.length;if(!confirm(`تأكيد نهائي: حذف جميع مواقع المجموعة ${letter} (${count} موقع)؟
سيتم حذف المرسل وغير المرسل فقط لهذه المجموعة، ولن تتأثر بقية الحروف. لا يمكن التراجع.`))return;const ids=new Set(matches.map(x=>x.id));if(ids.has(state.pendingSendId)){state.pendingSendId=null;state.pendingSendAt=0;state.pendingWentAwayAt=0;state.pendingReturnHandled=null;}state.items=state.items.filter(x=>!ids.has(x.id));persist();letterDeleteInput.value='';letterDeleteConfirm.disabled=true;letterDeletePreview.textContent=`تم حذف ${count} موقع من المجموعة ${letter}.`;notice(`تم حذف ${count} موقع من المجموعة ${letter} فقط.`);};

  render();handleShared();
})();

(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'marsal-map-v2';
  const cleanState = raw => {
    const s = raw && typeof raw === 'object' ? raw : {};
    return {
      prefix: typeof s.prefix === 'string' ? s.prefix : '',
      next: s.next ?? null,
      items: Array.isArray(s.items) ? s.items.filter(x => x && typeof x === 'object' && typeof x.url === 'string').map(x => ({
        id: x.id ?? (Date.now()+Math.random()), code: String(x.code ?? ''), url: String(x.url), done: !!x.done, created: Number(x.created)||Date.now()
      })) : []
    };
  };
  let state = {prefix:'',next:null,items:[]};
  try { state = cleanState(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); render(); }
  function extractUrl(s){
    const text = String(s||'');
    const matches = text.match(/https?:\/\/[^\s<>\u00ab\u00bb"']+/ig) || [];
    for (const m of matches) {
      const u=m.replace(/[),،؛.!؟]+$/,'');
      if (/maps\.|google\.[^/]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl/i.test(u)) return u;
    }
    return matches.length ? matches[0].replace(/[),،؛.!؟]+$/,'') : '';
  }
  function add(raw){
    const url=extractUrl(raw);
    if(!url){ alert('لم أجد رابط خرائط. الصق الرابط أو شاركه من Google Maps.'); return false; }
    if(!state.prefix.trim() || state.next===null || state.next==='' || !Number.isFinite(Number(state.next))){
      $('urlInput').value=url; $('shareNotice').textContent='الرابط وصل. اختَر بادئة الكود والرقم التالي ثم اضغط إضافة الموقع.'; $('shareNotice').classList.remove('hidden'); return false;
    }
    if(state.items.some(x=>x.url===url)){ alert('الرابط موجود بالفعل.'); return false; }
    const n=Number(state.next);
    state.items.unshift({id:Date.now()+Math.random(),code:state.prefix.trim()+n,url,done:false,created:Date.now()});
    state.next=n+1; $('urlInput').value=''; $('shareNotice').classList.add('hidden'); save(); return true;
  }
  function message(item){ return `${item.url}\n\n\n\n\n${item.code}`; }
  function openWhatsApp(item){ window.location.href='https://wa.me/?text='+encodeURIComponent(message(item)); }
  let seq=null;
  function pending(){ return state.items.filter(x=>!x.done).sort((a,b)=>(a.created||0)-(b.created||0)); }
  function current(){ return seq && state.items.find(x=>x.id===seq.ids[seq.i]); }
  function refreshSeq(){
    const p=$('seqPanel');
    if(!seq || seq.i>=seq.ids.length){ seq=null; p.classList.add('hidden'); return; }
    p.classList.remove('hidden'); $('seqProgress').textContent=`${seq.i+1} / ${seq.ids.length}`; $('seqCode').textContent=current()?.code||'';
    $('seqNextBtn').textContent=seq.i+1<seq.ids.length?'تم إرسالها — جهّز التالية':'تم إرسالها — إنهاء';
  }
  function openCurrent(){ if(current()) openWhatsApp(current()); else refreshSeq(); }
  function startAll(){
    const arr=pending(); if(!arr.length){alert('لا توجد مواقع غير مكتملة.');return;}
    seq={ids:arr.map(x=>x.id),i:0};refreshSeq();openCurrent();
  }
  $('seqNextBtn').onclick=()=>{ if(!seq)return; const it=current(); if(it){it.done=true;save();} seq.i++; if(seq.i>=seq.ids.length){seq=null;refreshSeq();alert('انتهت القائمة.');return;} refreshSeq();openCurrent(); };
  $('seqStopBtn').onclick=()=>{seq=null;refreshSeq();};
  function render(){
    $('prefix').value=state.prefix||''; $('nextNumber').value=state.next??''; $('count').textContent=state.items.length+' موقع';
    $('empty').classList.toggle('hidden',state.items.length>0); $('sendAllBtn').classList.toggle('hidden',state.items.length===0); $('queue').innerHTML='';
    for(const item of state.items){
      const el=document.createElement('article'); el.className='item';
      el.innerHTML='<div class="item-top"><span class="code"></span><span class="tag"></span></div><div class="link"></div><div class="item-actions"><button class="resend">إعادة إرسال</button><button class="mark">تأكيد الإرسال</button></div>';
      el.querySelector('.code').textContent=item.code; const tag=el.querySelector('.tag'); tag.textContent=item.done?'تم تأكيد الإرسال':'بانتظار الإرسال'; tag.classList.toggle('done',!!item.done);
      el.querySelector('.link').textContent=item.url; el.querySelector('.resend').onclick=()=>openWhatsApp(item);
      const mark=el.querySelector('.mark'); mark.textContent=item.done?'تم الإرسال ✓':'تأكيد الإرسال'; mark.classList.toggle('ready',!!item.done); mark.onclick=()=>{item.done=!item.done;save();};
      $('queue').appendChild(el);
    }
    $('sendAllBtn').onclick=startAll;
  }
  $('prefix').onchange=e=>{state.prefix=e.target.value.trim();save();};
  $('nextNumber').onchange=e=>{const v=e.target.value.trim();state.next=v===''?null:Math.max(0,Number(v)||0);save();};
  $('addBtn').onclick=()=>add($('urlInput').value);
  $('pasteBtn').onclick=async()=>{try{$('urlInput').value=await navigator.clipboard.readText();}catch{alert('الصق يدويًا داخل المربع.')}};
  $('clearDone').onclick=()=>{const completed=state.items.filter(x=>x.done).length;if(!completed){alert('مفيش مواقع مكتملة للإزالة.');return;}if(confirm(`مسح ${completed} موقع مكتمل من القائمة؟ المواقع غير المكتملة ستظل كما هي.`)){state.items=state.items.filter(x=>!x.done);save();}};
  function handleShare(){
    const p=new URLSearchParams(location.search);
    const candidates=[p.get('url'),p.get('text'),p.get('title'),p.get('name')].filter(Boolean);
    const url=candidates.map(extractUrl).find(Boolean);
    if(url){
      if(state.prefix.trim() && state.next!==null && state.next!=='') add(url);
      else {$('urlInput').value=url;$('shareNotice').textContent='وصل رابط الموقع بنجاح. حدد بادئة الكود والرقم التالي ثم اضغط إضافة الموقع.';$('shareNotice').classList.remove('hidden');}
    } else if(candidates.length){$('urlInput').value=candidates.join('\n');$('shareNotice').textContent='وصلت المشاركة لكن لم أستخرج رابط خرائط. راجع النص ثم أضف الموقع.';$('shareNotice').classList.remove('hidden');}
    if(candidates.length) history.replaceState({},'',location.pathname);
  }
  let installEvt=null; window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;$('installBtn').classList.remove('hidden');});
  $('installBtn').onclick=async()=>{if(installEvt){installEvt.prompt();await installEvt.userChoice;installEvt=null;$('installBtn').classList.add('hidden');}};
  if('serviceWorker'in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  render(); handleShare();
})();

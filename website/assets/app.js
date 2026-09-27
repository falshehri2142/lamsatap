// أدوات مشتركة خفيفة: اسم الشركة، زر واتساب، نسخ النص. بدون أي طلب خارجي.
(function(){
  var S=window.SITE||{};
  window.fillCompany=function(){
    var els=document.querySelectorAll('[data-company]');
    for(var i=0;i<els.length;i++)els[i].textContent=S.companyName||'[اسم الشركة]';
  };
  window.fillWhatsapp=function(){
    var num=String(S.whatsapp||'').replace(/\D/g,'');
    var els=document.querySelectorAll('[data-wa]');
    for(var i=0;i<els.length;i++){
      var a=els[i];
      if(num){a.href='https://wa.me/'+num;a.removeAttribute('aria-disabled');a.textContent=a.getAttribute('data-wa')||'كلّمنا واتساب';}
      else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.textContent='واتساب: الرقم قريباً';}
    }
  };
  window.copyText=function(text,statusEl){
    function done(ok){if(statusEl)statusEl.textContent=ok?'تم النسخ':'ما قدرنا ننسخ، انسخها يدوياً';}
    if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(function(){done(true)},function(){fallback()});}
    else fallback();
    function fallback(){
      var t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';
      document.body.appendChild(t);t.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}
      document.body.removeChild(t);done(ok);
    }
  };
  window.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  document.addEventListener('DOMContentLoaded',function(){fillCompany();fillWhatsapp();});
})();

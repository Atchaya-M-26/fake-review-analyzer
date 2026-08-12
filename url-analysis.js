(function(){
  const $=id=>document.getElementById(id);
  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function highlightReview(text,signals){let safe=escapeHtml(text);const terms=[];if(signals.some(x=>/promotional/i.test(x)))terms.push('must buy','best ever','buy now','changed my life','amazing','perfect');if(signals.some(x=>/punctuation/i.test(x)))terms.push('!');terms.sort((a,b)=>b.length-a.length);terms.forEach(term=>{const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');safe=safe.replace(new RegExp(escaped,'gi','g'),m=>`<mark>${m}</mark>`);});return safe;}
  async function scan(){
    const input=$('urlInput'),url=input.value.trim();if(!url){input.focus();return}
    const button=$('urlBtn');button.disabled=true;button.textContent='Scanning…';
    try{
      const response=await fetch('http://127.0.0.1:8765/api/analyze-url',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to analyze this URL.');
      const rows=data.reviews.map((r,i)=>`<div class="review-row url-review-row"><p><strong>Review ${i+1}</strong><br><small class="review-copy">${highlightReview(r.text,r.signals)}</small><br><small class="review-meta">By ${escapeHtml(r.reviewer||'Unknown reviewer')} · ${escapeHtml(r.date||'Date unavailable')} at ${escapeHtml(r.time||'time unavailable')} · ${r.rating||'—'}/5 stars</small><br><small class="review-analysis"><b>Important signals:</b> ${r.signals.map(escapeHtml).join(' · ')}</small></p><span class="tag ${r.label!=='Likely genuine'?'suspicious':''}">${r.label}</span><strong>${r.trustScore}/100</strong></div>`).join('');
      $('urlResult').innerHTML=`<div class="url-summary"><div class="stat"><span>PRODUCT TRUST SCORE</span><strong>${data.trustScore}/100</strong></div><div class="stat"><span>REVIEWS SCANNED</span><strong>${data.reviewsScanned}</strong></div><div class="stat"><span>FLAGGED SIGNALS</span><strong>${data.suspicious+data.fake}</strong></div></div><div class="table-card"><span class="card-kicker">${data.source.toUpperCase()}</span><h3>${data.product.title}</h3><p class="url-product-meta">${data.product.category} · ${data.genuine} likely genuine · ${data.suspicious} suspicious · ${data.fake} likely fake</p>${rows}</div>`;
      $('urlResult').classList.remove('hidden');saveHistory({type:'Product',title:data.product.title,label:data.trustScore>=68?'Likely genuine':data.trustScore>=42?'Suspicious':'Likely fake',score:data.trustScore,text:url,report:data});
    }catch(error){$('urlResult').innerHTML=`<div class="notice url-error">${error.message}</div>`;$('urlResult').classList.remove('hidden');}
    button.disabled=false;button.innerHTML='Scan product <span>→</span>';
  }
  const style=document.createElement('style');style.textContent='.url-product-meta{font-size:12px;color:#72827e;margin:5px 0 16px}.url-error{margin-top:18px;background:#fff0f0;color:#b45252}.url-review-row{grid-template-columns:minmax(0,1fr) 118px 70px;align-items:start}.url-review-row p{min-width:0}.review-copy{display:block;color:#667570;line-height:1.45;margin-top:4px}.review-copy mark{background:#ffe59c;color:#5f4610;border-radius:3px;padding:1px 3px}.review-meta{display:block;color:#9aa8a3;margin-top:5px}.review-analysis{display:block;color:#9a6b9c;margin-top:6px;line-height:1.4}.review-analysis b{color:#73517a}.url-review-row .tag{margin-top:2px}@media(max-width:700px){.url-review-row{grid-template-columns:minmax(0,1fr) 90px}.url-review-row>strong{grid-column:2;grid-row:2;text-align:center}}';
  const badge=document.querySelector('#urlView .api-badge');if(badge){badge.textContent='＋';badge.className='new-url-icon';badge.title='Start a new product scan';badge.onclick=()=>{$('urlInput').value='';$('urlResult').classList.add('hidden');$('urlInput').focus();};}
  document.head.appendChild(style);
  setTimeout(()=>{if($('urlBtn'))$('urlBtn').onclick=scan;},0);
})();

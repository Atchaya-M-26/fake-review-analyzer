"""Local Fake Online Review Analyzer API."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from collections import Counter
import hashlib, json, re
from urllib.parse import urlparse, parse_qs
import numpy as np

ROOT=Path(__file__).resolve().parent
MODEL=np.load(ROOT/'ml/artifacts/review_risk_model.npz')
WEIGHTS=MODEL['weights']; BIAS=float(MODEL['bias'][0]); DIM=int(MODEL['dimensions'][0])
TOKEN_RE=re.compile(r"[a-z0-9']+")
STORE=json.loads((ROOT/'demo_store.json').read_text(encoding='utf-8'))
REVIEW_TEMPLATES=[
    'The product arrived on time and matched the description. I have used it several times and it performs reliably.',
    'The quality is reasonable for the price. The design is practical, although there are a few small areas that could be improved.',
    'I have been using this for over a week and it has fit smoothly into my daily routine. Setup was straightforward.',
    'The materials feel solid and the instructions were clear. It is useful, but I would compare the size carefully before ordering.',
    'This works as expected for normal use. The finish is good and cleaning or storing it has been simple.',
    'I like the overall design and have not noticed any major problems. Delivery packaging also kept the product protected.',
    'The product is comfortable to use and the controls are easy to understand. Performance has been consistent so far.',
    'It is a decent option for everyday use. A small improvement to the accessories would make the package more complete.',
    'The item looks like the photos and feels well made. I would recommend it for someone with similar needs.',
    'After several uses, the product remains functional and easy to handle. The value depends on the current price.',
    'The size was accurate and the product was ready to use quickly. It has been dependable during normal use.',
    'I noticed a minor issue with the finish, but it does not affect the main function. Overall, it is acceptable.',
    'The instructions could include more detail, though the product itself was not difficult to operate.',
    'This is useful for my home and takes up less space than expected. The build quality feels average but durable.',
    'I tested the product in different situations and the results were generally good. It is not perfect, but it is practical.',
    'The product has been convenient for regular use and the basic features work properly. It offers fair value for a demo purchase.',
    'I am satisfied with the function and appearance. There was no complicated setup, and it has handled my usual tasks well.'
]
for product in STORE['products']:
    seed_count=len(product['reviews'])
    for offset, template in enumerate(REVIEW_TEMPLATES):
        if len(product['reviews']) >= 20: break
        product['reviews'].append({
            'text': template,
            'rating': 3 + ((offset + int(product['id'])) % 3 == 2),
            'date': f"2026-{5 + ((offset + int(product['id'])) % 3):02d}-{10 + offset:02d}",
            'reviewer': f"reviewer-{product['id']}01{offset + seed_count}"
        })
def index(token): return int.from_bytes(hashlib.md5(token.encode()).digest()[:4],'little')%DIM
def probability(text):
    tokens=TOKEN_RE.findall(text.lower()); features=tokens+[f'{a}_{b}' for a,b in zip(tokens,tokens[1:])]
    counts=Counter(index(x) for x in features); vector=np.zeros(DIM,dtype=np.float32)
    for col,count in counts.items(): vector[col]=1+np.log(count)
    norm=np.linalg.norm(vector)
    if norm: vector/=norm
    return float(1/(1+np.exp(-np.clip(vector@WEIGHTS+BIAS,-30,30))))
def analyze(text):
    model_risk=probability(text); signals=[]; lower=text.lower(); words=TOKEN_RE.findall(text); signal_risk=.50
    if len(words)<18: signals.append('Very short or low-detail review'); signal_risk+=.15
    elif len(words)>=30: signal_risk-=.15
    if text.count('!')>=3: signals.append('High punctuation intensity'); signal_risk+=.18
    if any(word in lower for word in ('must buy','best ever','buy now','changed my life')): signals.append('Promotional wording'); signal_risk+=.22
    if len(set(words)) / max(1,len(words)) < .48: signals.append('Unusually repetitive wording'); signal_risk+=.12
    if len(words)>=25 and text.count('!')==0 and not any(word in lower for word in ('must buy','best ever','buy now')): signal_risk-=.08
    risk=max(0.02,min(.98,.45*model_risk+.55*signal_risk))
    label='Likely fake' if risk>=.68 else 'Suspicious' if risk>=.42 else 'Likely genuine'
    if not signals: signals.append('Model language profile matched the training distribution')
    return {'label':label,'trustScore':round((1-risk)*100),'riskProbability':round(risk,4),'modelRisk':round(model_risk,4),'confidence':round(abs(risk-.5)*2,4),'signals':signals,'words':len(words),'sentiment':'Mixed / neutral','model':'review-risk-baseline-v1 + signal calibration'}
def analyze_product(url):
    parsed=urlparse(url)
    path=parsed.path.strip('/').split('/')
    product_id=path[-1] if path else ''
    if product_id in ('', 'index.html', 'products'):
        product_id=parse_qs(parsed.query).get('product', [''])[0]
    product=next((x for x in STORE['products'] if x['id']==product_id),None)
    if not product: raise ValueError('Demo product not found. Try http://127.0.0.1:8765/demo/products/1 or /2.')
    reviews=[]
    for idx,item in enumerate(product['reviews'][:25]):
        result=analyze(item['text']); reviews.append({**item,'time':item.get('time',f'10:{10+idx*7:02d} AM'),**result})
    counts={label:sum(1 for x in reviews if x['label']==label) for label in ('Likely genuine','Suspicious','Likely fake')}
    return {'product':{'id':product['id'],'title':product['title'],'category':product['category'],'image':product.get('image','')},'source':'SampleCart demo store','reviews':reviews,'reviewsScanned':len(reviews),'genuine':counts['Likely genuine'],'suspicious':counts['Suspicious'],'fake':counts['Likely fake'],'trustScore':round(sum(x['trustScore'] for x in reviews)/len(reviews))}
class Handler(BaseHTTPRequestHandler):
    def send_json(self,status,value):
        body=json.dumps(value).encode(); self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Headers','Content-Type'); self.end_headers(); self.wfile.write(body)
    def do_OPTIONS(self): self.send_json(204,{})
    def do_GET(self):
        parsed=urlparse(self.path)
        if parsed.path in ('/', '/api/health'):
            self.send_json(200, {'ok': True, 'service': 'ReviewLens prediction API', 'model': 'review-risk-baseline-v1 + signal calibration', 'endpoints': {'health': 'GET /api/health', 'analyze': 'POST /api/analyze-review'}})
        elif parsed.path.startswith('/api/demo-products/'):
            product_id=parsed.path.rsplit('/',1)[-1]
            product=next((x for x in STORE['products'] if x['id']==product_id),None)
            if not product: return self.send_json(404, {'error':'Demo product not found.'})
            self.send_json(200, product)
        elif parsed.path == '/demo/' or parsed.path == '/demo/index.html':
            self.send_file(ROOT/'demo-store'/'index.html','text/html; charset=utf-8')
        elif parsed.path.startswith('/demo/products/'):
            self.send_file(ROOT/'demo-store'/'product.html','text/html; charset=utf-8')
        elif parsed.path == '/demo/demo_store.json':
            self.send_file(ROOT/'demo_store.json','application/json')
        elif parsed.path.startswith('/demo/'):
            filename=parsed.path.removeprefix('/demo/')
            candidate=(ROOT/'demo-store'/filename).resolve()
            if candidate.parent == (ROOT/'demo-store').resolve() and candidate.is_file():
                self.send_file(candidate)
            else:
                self.send_json(404, {'error':'Not found'})
        else:
            self.send_json(404, {'error':'Not found'})
    def send_file(self,path,content_type=None):
        body=path.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type',content_type or 'application/octet-stream')
        self.send_header('Content-Length',str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def do_POST(self):
        if self.path=='/api/analyze-url':
            try:
                payload=json.loads(self.rfile.read(int(self.headers.get('Content-Length',0)))); self.send_json(200,analyze_product(str(payload.get('url','')).strip()))
            except Exception as exc: self.send_json(400,{'error':str(exc)})
            return
        if self.path!='/api/analyze-review': return self.send_json(404,{'error':'Not found'})
        try:
            payload=json.loads(self.rfile.read(int(self.headers.get('Content-Length',0)))); text=str(payload.get('text','')).strip()
            if len(text)<5: raise ValueError('Review text is too short.')
            self.send_json(200,analyze(text))
        except Exception as exc: self.send_json(400,{'error':str(exc)})
    def log_message(self,*args): pass
if __name__=='__main__':
    print('ReviewLens API running at http://127.0.0.1:8765'); ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()

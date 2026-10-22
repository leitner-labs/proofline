"""Generate the Proofline demo dataset: Meridian Roast Co. (fictional SF coffee roaster)
deciding whether to switch oat-milk suppliers. Synthetic but internally consistent."""
import sqlite3, csv, os, random
random.seed(42)
BASE = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(BASE, exist_ok=True)

DB = os.path.join(BASE, 'roaster.db')
if os.path.exists(DB): os.remove(DB)
con = sqlite3.connect(DB); cur = con.cursor()
cur.executescript('''
CREATE TABLE suppliers (id TEXT PRIMARY KEY, name TEXT, hq TEXT, since INT, status TEXT);
CREATE TABLE purchase_orders (id TEXT PRIMARY KEY, supplier_id TEXT, order_date TEXT,
    product TEXT, qty_liters REAL, unit_price REAL, delivered_on_time INT, FOREIGN KEY(supplier_id) REFERENCES suppliers(id));
CREATE TABLE quality_tests (id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_id TEXT, batch TEXT,
    test_date TEXT, brix REAL, ph REAL, microbial TEXT, passed INT, FOREIGN KEY(supplier_id) REFERENCES suppliers(id));
''')
suppliers = [
    ('SUP-001','Oatly West (distributor)','Millville, NJ',2016,'current'),
    ('SUP-002','Pacific Oat Co.','Modesto, CA',2019,'candidate'),
    ('SUP-003','Nordic Grain Foods','Fresno, CA',2021,'candidate'),
    ('SUP-004','Golden State Oats','Petaluma, CA',2018,'candidate'),
]
cur.executemany('INSERT INTO suppliers VALUES (?,?,?,?,?)', suppliers)
po_id = 1000
for month in range(1, 11):
    for s in suppliers:
        base = {'SUP-001':3.42,'SUP-002':2.98,'SUP-003':3.05,'SUP-004':2.87}[s[0]]
        price = round(base + random.uniform(-0.06,0.08),2)
        qty = 400 + random.randint(0,200)
        ontime = 1 if random.random() > (0.18 if s[0]=='SUP-001' else 0.06) else 0
        cur.execute('INSERT INTO purchase_orders VALUES (?,?,?,?,?,?,?)',
            (f'PO-{po_id}', s[0], f'2026-{month:02d}-05', 'barista oat milk 12x1L', qty, price, ontime))
        po_id += 1
        brix = round(random.uniform(9.5, 11.5) - (0.8 if s[0]=='SUP-003' else 0),2)
        ph = round(random.uniform(6.4, 6.9),2)
        micro = 'pass' if random.random() > 0.05 else 'review'
        passed = 1 if micro=='pass' and brix>=9.0 else 0
        cur.execute('INSERT INTO quality_tests(supplier_id,batch,test_date,brix,ph,microbial,passed) VALUES (?,?,?,?,?,?,?)',
            (s[0], f'B{month:02d}-{s[0][-3:]}', f'2026-{month:02d}-07', brix, ph, micro, passed))
con.commit()

with open(os.path.join(BASE,'supplier_price_lists.csv'),'w',newline='') as f:
    w = csv.writer(f); w.writerow(['supplier','product','unit_price_usd','moq_liters','lead_time_days','contract_discount_pct','updated'])
    w.writerows([
        ['Oatly West (distributor)','barista oat milk 12x1L',3.42,400,7,0,'2026-10-01'],
        ['Pacific Oat Co.','barista oat milk 12x1L',2.98,600,5,4,'2026-10-12'],
        ['Nordic Grain Foods','barista oat milk 12x1L',3.05,500,6,2,'2026-10-10'],
        ['Golden State Oats','barista oat milk 12x1L',2.87,800,4,6,'2026-10-15'],
    ])
with open(os.path.join(BASE,'certifications.csv'),'w',newline='') as f:
    w = csv.writer(f); w.writerow(['supplier','certification','valid_until','scope'])
    w.writerows([
        ['Oatly West (distributor)','FDA facility registration','2027-03-31','processing'],
        ['Pacific Oat Co.','USDA Organic','2027-06-30','processing + packaging'],
        ['Pacific Oat Co.','Non-GMO Project','2027-06-30','full line'],
        ['Nordic Grain Foods','USDA Organic','2026-12-31','processing'],
        ['Golden State Oats','USDA Organic','2027-09-30','processing + packaging'],
        ['Golden State Oats','SQF Level 2','2027-04-30','food safety'],
    ])
with open(os.path.join(BASE,'recall_notices.csv'),'w',newline='') as f:
    w = csv.writer(f); w.writerow(['source','date','supplier','notice','severity','url'])
    w.writerows([
        ['FDA enforcement report','2026-08-14','Nordic Grain Foods',"Voluntary recall: two lots barista oat milk; potential Bacillus cereus",'Class II','https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts'],
        ['CA DPH notice','2026-05-02','Oatly West (distributor)','Distribution delay advisory (logistics, non-safety)','Informational','https://www.cdph.ca.gov'],
    ])
con.close()
print('data written:', os.listdir(BASE))

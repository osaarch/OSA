import numpy as np, json
from scipy import ndimage as ndi
d=np.load('palm_maps.npz'); G=d['topG']; Nn=d['topN']
green=(G>-1e8)&(G>Nn+0.03)
er=ndi.binary_erosion(green,structure=ndi.generate_binary_structure(2,1),iterations=5)
N=2000; OFF=1000.0
zz,xx=np.mgrid[0:N,0:N]
X=xx+0.5-OFF; Z=zz+0.5-OFF
R=np.hypot(X,Z)
valid=er&(R>=230)&(R<=950)
ys,xs=np.nonzero(valid)
print('valid cells',len(ys))
rng=np.random.default_rng(20261107)
COUNT=700; MINSP=5.5
pts=[]; grid={}
def ok(x,z):
    gx,gz=int(x//MINSP),int(z//MINSP)
    for a in (-1,0,1):
        for b in (-1,0,1):
            for q in grid.get((gx+a,gz+b),()):
                if (q[0]-x)**2+(q[1]-z)**2<MINSP**2: return False
    return True
def add(x,z):
    pts.append((x,z)); grid.setdefault((int(x//MINSP),int(z//MINSP)),[]).append((x,z))
def cell_ok(x,z):
    i=int(z+OFF); j=int(x+OFF)
    return 0<=i<N and 0<=j<N and valid[i,j]
seeds=[]
for _ in range(110):
    k=rng.integers(len(ys)); seeds.append((xs[k]+0.5-OFF, ys[k]+0.5-OFF))
tries=0
while len(pts)<COUNT and tries<200000:
    tries+=1
    if rng.random()<0.65:
        sx,sz=seeds[rng.integers(len(seeds))]
        a=rng.random()*6.2832; r=4+np.sqrt(rng.random())*22
        x,z=sx+np.cos(a)*r, sz+np.sin(a)*r
    else:
        k=rng.integers(len(ys)); x,z=xs[k]+rng.random()-OFF, ys[k]+rng.random()-OFF
    if cell_ok(x,z) and ok(x,z): add(float(x),float(z))
print('placed',len(pts),'tries',tries)
out=[[round(x,1),round(float(G[int(z+OFF),int(x+OFF)]),2),round(z,1)] for x,z in pts]
json.dump(out,open('/home/claude/osa/src/scene/stadium/palms.json','w'),separators=(',',':'))
r=np.hypot(*np.array(pts).T); print('radius range',r.min().round(),r.max().round(),'y range',min(p[1] for p in out),max(p[1] for p in out))

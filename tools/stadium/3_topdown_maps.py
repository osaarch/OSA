import pickle, numpy as np, json, time, sys
src=open('build_new.py').read()
ns={}
exec(src.split("sc=trimesh.Scene()")[0], ns)
G=ns['G']; cx,cy,zg=ns['cx'],ns['cy'],ns['zg']
GRASS_LAYERS={'GRASS 01','GRASS BLAG'}
N=2000; OFF=1000.0   # 1 m cells covering x,z in [-1000,1000]
topG=np.full((N,N),-1e9,np.float32); topN=np.full((N,N),-1e9,np.float32)
t0=time.time(); ntri=0
for gk,lst in G.items():
    for o in lst:
        v=o['v']; f=o['f']
        P=np.stack([v[:,0]-cx, v[:,2]-zg, -(v[:,1]-cy)],1)   # x, height, z
        g = o['lname'] in GRASS_LAYERS
        T=P[f]                                               # (n,3,3)
        for tri in T:
            x=tri[:,0]; z=tri[:,2]; y=tri[:,1]
            area=(x[1]-x[0])*(z[2]-z[0])-(x[2]-x[0])*(z[1]-z[0])
            if abs(area)<1e-4: continue
            x0=int(np.floor(x.min()+OFF)); x1=int(np.ceil(x.max()+OFF))
            z0=int(np.floor(z.min()+OFF)); z1=int(np.ceil(z.max()+OFF))
            if x1<0 or z1<0 or x0>=N or z0>=N: continue
            x0=max(x0,0); z0=max(z0,0); x1=min(x1,N-1); z1=min(z1,N-1)
            gx,gz=np.meshgrid(np.arange(x0,x1+1)+0.5-OFF, np.arange(z0,z1+1)+0.5-OFF)
            w0=((x[1]-gx)*(z[2]-gz)-(x[2]-gx)*(z[1]-gz))/area
            w1=((x[2]-gx)*(z[0]-gz)-(x[0]-gx)*(z[2]-gz))/area
            w2=1-w0-w1
            m=(w0>=-1e-6)&(w1>=-1e-6)&(w2>=-1e-6)
            if not m.any(): continue
            yy=w0*y[0]+w1*y[1]+w2*y[2]
            sl=(slice(z0,z1+1),slice(x0,x1+1))
            cur=(topG if g else topN)[sl]
            upd=m&(yy>cur)
            cur[upd]=yy[upd]
            ntri+=1
print('rasterised',ntri,'tris in',round(time.time()-t0),'s')
np.savez_compressed('palm_maps.npz',topG=topG,topN=topN)

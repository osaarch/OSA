import rhino3dm, numpy as np, pickle, time, collections, sys
f = rhino3dm.File3dm.Read('/mnt/user-data/uploads/STADUAM_Exterior_.3dm')
L = f.Layers
def mesh_to_np(m):
    v = np.array([[p.X,p.Y,p.Z] for p in m.Vertices], dtype=np.float32)
    tris=[]
    for fc in m.Faces:
        a,b,c,d = fc
        tris.append((a,b,c))
        if c!=d: tris.append((a,c,d))
    return v, np.array(tris, dtype=np.int32)
out=[]; inst=[]
t=time.time()
for oi,ob in enumerate(f.Objects):
    g=ob.Geometry; n=type(g).__name__
    a=ob.Attributes; li=a.LayerIndex
    if n=='InstanceReference':
        xf=g.Xform
        M=[[getattr(xf,'M%d%d'%(r,c)) for c in range(4)] for r in range(4)]
        inst.append(dict(i=oi,layer=li,lname=L[li].FullPath,idef=str(g.ParentIdefId),M=M,vis=bool(L[li].Visible)))
        continue
    ms=[]
    if n=='Brep':
        for fc in g.Faces:
            m=fc.GetMesh(rhino3dm.MeshType.Any)
            if m: ms.append(m)
    elif n=='Extrusion':
        m=g.GetMesh(rhino3dm.MeshType.Any)
        if m: ms.append(m)
    elif n=='Mesh':
        ms.append(g)
    else: continue
    if not ms: continue
    mi = a.MaterialIndex if a.MaterialSource==rhino3dm.ObjectMaterialSource.MaterialFromObject else L[li].RenderMaterialIndex
    col = a.ObjectColor if a.ColorSource==rhino3dm.ObjectColorSource.ColorFromObject else L[li].Color
    Vs=[];Fs=[];off=0
    for m in ms:
        if len(m.Vertices)==0: continue
        v,t3=mesh_to_np(m)
        if t3.ndim!=2 or len(t3)==0: continue
        Vs.append(v); Fs.append(t3+off); off+=len(v)
    if not Vs: continue
    out.append(dict(i=oi,type=n,layer=li,lname=L[li].FullPath,mat=mi,color=(col[0],col[1],col[2]),name=a.Name,v=np.concatenate(Vs),f=np.concatenate(Fs)))
print('extracted',len(out),'objects,',len(inst),'instance refs in',round(time.time()-t,1),'s',flush=True)
# instance definitions: geometry
defs={}
for k in range(len(f.InstanceDefinitions)):
    d=f.InstanceDefinitions[k]
    print('idef',k,d.Name,str(d.Id),'objs',len(d.GetObjectIds()) if hasattr(d,'GetObjectIds') else '?')
pickle.dump(dict(objs=out,inst=inst), open('objs_new.pkl','wb'), protocol=4)
agg=collections.defaultdict(lambda:[0,np.full(3,1e30),np.full(3,-1e30),0])
for o in out:
    s=agg[o['lname']]; s[0]+=len(o['f']); s[1]=np.minimum(s[1],o['v'].min(0)); s[2]=np.maximum(s[2],o['v'].max(0)); s[3]+=1
for k,s in sorted(agg.items(), key=lambda kv:-kv[1][0]):
    print(f'{s[0]:8d} tris {s[3]:5d} objs {k:40s} min {s[1].round(0)} max {s[2].round(0)}')

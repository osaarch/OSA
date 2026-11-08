import pickle, numpy as np, trimesh, json, os, rhino3dm
D=pickle.load(open('objs_new.pkl','rb')); objs=D['objs']
f3=rhino3dm.File3dm.Read('/mnt/user-data/uploads/STADUAM_Exterior_.3dm'); MAT=f3.Materials
cx,cy,zg=-412.0,-520.0,-48.0
groups_def = {
 'roof':   [('STADUIM MA',3000)],
 'bowl':   [('STEBS STADIUM',400)],
 'bowl2':  [('STADIUM SEAT',900)],   # the second, smaller stadium 550 m to the west: its stands (red seat blocks)
 'wall':   [('Glass Stadium',3000),('GLASS 01',3000),('smart SCREEN',3000)],   # 'GLASS 01' also wraps the second stadium, 550 m away
 'text':   [('teXT',3000)],
 'doors':  [('Doors',3000)],
 'stone':  [('STEBS',700),('out',700),('gr 03',700),('UI',700),('34',900)],   # '34' = the second stadium's floor plate
 'ground': [('SITE01',3000),('GROUND',1600),('GROUND 02',1600)],
 'grass':  [('GRASS 01',1600),('GRASS BLAG',1600),('green Roof',1600),('grass Wall',1600)],
 'water':  [('WATER 01',1600),('WATER BLAG',1600),('OUT WATER',1600),('UNDER WATER',1600)],
 'paving': [('STREET 01',1400),('RASSEF 01',1400),('coloume Bridge',700),('ROAD TRAM',1400),('WALKING',1400),('Line Street',1400),('LIGHT',700)],
 'blocks': [('BOX BULIDING',2400)],
 'poles':  [('MILINOUOM',1600),('iron',1600),('Default',400),('STAIERS 01',700)],   # lamp posts, railings, small details
 'beads':  [('circle red',600),('circle white',600),('circle blue',600),('circle yellow',600)],   # the coloured spheres
}
lim={l:r for g in groups_def.values() for l,r in g}
lay2g={l:k for k,g in groups_def.items() for l,_ in g}
G={k:[] for k in groups_def}
for o in objs:
    l=o['lname']
    if l not in lim: continue
    v=o['v']; c=(v.min(0)+v.max(0))/2
    if np.hypot(c[0]-cx,c[1]-cy)>lim[l]: continue
    G[lay2g[l]].append(o)
def objcolor(o):
    mi=o['mat']
    if mi>=0:
        d=MAT[mi].DiffuseColor; c=(d[0],d[1],d[2])
        if c==(255,255,255) or c==(0,0,0):   # white / black placeholder -> use the object (layer) colour if it has one
            oc=o['color']
            if oc!=(0,0,0) and oc!=(255,255,255): c=oc
        return c
    oc=o['color']; return oc if oc!=(0,0,0) else (255,255,255)
sc=trimesh.Scene(); info={}; tot=0
for k,lst in G.items():
    if not lst: continue
    V=[];F=[];C=[];off=0
    for o in lst:
        if k=='beads':   # each coloured sphere (4k triangles) becomes a light icosphere of the same size and place
            v0=o['v']; ctr=(v0.min(0)+v0.max(0))/2; rad=float((v0.max(0)-v0.min(0)).max())/2
            ic=trimesh.creation.icosphere(subdivisions=2,radius=max(rad,0.05))
            o=dict(o); o['v']=np.asarray(ic.vertices)+ctr; o['f']=np.asarray(ic.faces)
        V.append(o['v']);F.append(o['f']+off);off+=len(o['v'])
        c=objcolor(o); C.append(np.tile(np.array([c[0],c[1],c[2],255],np.uint8),(len(o['v']),1)))
    V=np.concatenate(V).astype(np.float64);F=np.concatenate(F);C=np.concatenate(C)
    P=np.stack([V[:,0]-cx, V[:,2]-zg, -(V[:,1]-cy)],1)
    m=trimesh.Trimesh(P,F,vertex_colors=C,process=False)
    m.update_faces(m.nondegenerate_faces()); m.remove_unreferenced_vertices()
    m.vertices=np.round(m.vertices,2)
    m.merge_vertices()
    m.update_faces(m.nondegenerate_faces()); m.remove_unreferenced_vertices()
    sc.add_geometry(m,node_name=k,geom_name=k)
    tot+=len(m.faces)
    info[k]=dict(objs=len(lst),tris=int(len(m.faces)),verts=int(len(m.vertices)),min=m.bounds[0].round(1).tolist(),max=m.bounds[1].round(1).tolist())
    print(f'{k:8s} objs {len(lst):4d} tris {len(m.faces):7d} verts {len(m.vertices):7d} bounds {m.bounds[0].round(0)} {m.bounds[1].round(0)}')
print('total tris',tot)
sc.export('stadium_new_raw.glb')
print(round(os.path.getsize('stadium_new_raw.glb')/1e6,2),'MB')
json.dump(info,open('stadium_new_info.json','w'),indent=1)

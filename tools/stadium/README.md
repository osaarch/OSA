# Rebuilding the stadium model and the palm positions

These scripts turn the architect's Rhino file into what the site loads. They are not part of the site build; run them
only when the `.3dm` changes (needs `python3`, `rhino3dm`, `numpy`, `trimesh`, `scipy`, and `npx gltfpack`).

1. `1_extract_rhino.py` — reads `STADUAM_Exterior_.3dm` (path inside the script) and dumps every mesh with its layer,
   material and colour to `objs_new.pkl`.
2. `2_build_glb.py` — groups the layers (roof, bowl, wall/glazing, text, doors, stone, ground, grass, water, paving,
   blocks), maps Rhino (x, y, z) to the site's (x, height, −y) around the bowl centre, bakes the layer colours as vertex
   colours and writes `stadium_new_raw.glb`. Then compress it into the repo:
   `npx gltfpack -i stadium_new_raw.glb -o public/assets/stadium/stadium.glb -cc -vpf -kn -noq`
   (`-vpf` keeps float positions — the pitch is cut from the bowl's own vertices; `-kn` keeps the group names the loader uses).
3. `3_topdown_maps.py` — rasterises the model from above at 1 m per cell: the highest surface that is grass, and the
   highest surface that is anything else.
4. `4_palm_points.py` — keeps the cells where grass is on top (eroded by 5 m, 230–950 m from the bowl) and picks the palm
   positions in groves → `src/scene/stadium/palms.json`.

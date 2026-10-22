# Map interactions — 2026-10-22

- Enabled scroll-wheel zoom on portfolio and boundary editor maps.
- Display zoom extends to 22. Satellite requests stop at native zoom 17, street requests at 19; Leaflet scales existing tiles above those levels. Extra zoom adds no actual imagery resolution. This avoids requesting unsupported high-zoom imagery (including image-embedded "Map data not yet available" responses that cannot be detected by HTTP tileerror alone).
- Boundary editor keeps the 10-point cap and does not close at the third point. After 3–10 vertices, clicking the first vertex requests closure through the same polygon validation as the Close boundary button.
- Vertex click bubbling disabled so closing does not append a duplicate point. First vertex enlarged while drawing. Button-based close/reopen remains available; translated instructions updated.
- Production build/type/lint passed before deployment. No private field data requested or modified.
- Pending live browser verification at this checkpoint.

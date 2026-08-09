from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import items, assets, parse_cabinet, render_png, bom_xlsx, wire_pdf, export_dxf, import_spec, ai_render, reference, cockpit

app = FastAPI(title='HydroNexis-AI R&D backend', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://localhost:8765', 'file://'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Route registration
app.include_router(items.router,         prefix='/api/rnd', tags=['items'])
app.include_router(assets.router,        prefix='/api/rnd', tags=['assets'])
app.include_router(parse_cabinet.router, prefix='/api/rnd', tags=['cabinet'])
app.include_router(render_png.router,    prefix='/api/rnd', tags=['cabinet'])
app.include_router(bom_xlsx.router,      prefix='/api/rnd', tags=['cabinet'])
app.include_router(wire_pdf.router,      prefix='/api/rnd', tags=['cabinet'])
app.include_router(export_dxf.router,    prefix='/api/rnd', tags=['cabinet'])
app.include_router(import_spec.router,   prefix='/api/rnd', tags=['import'])
app.include_router(ai_render.router,     prefix='/api/rnd', tags=['ai'])
app.include_router(reference.router,     prefix='/api/rnd', tags=['reference'])
app.include_router(cockpit.router,       prefix='/api/rnd', tags=['cockpit', 'nexi'])

@app.get('/api/rnd/health')
def health():
    return {'ok': True, 'service': 'hnx-rnd', 'version': '0.1.0'}

from app.api import wizards, build_3d  # added by 3D+wizard layer

app.include_router(wizards.router,  prefix='/api/rnd', tags=['wizards'])
app.include_router(build_3d.router, prefix='/api/rnd', tags=['3d'])


# Final layer — submission, uploads, parse, fully wired
from app.api import uploads as uploads_v2
from app.api import submission as submission_v2

app.include_router(uploads_v2.router,        prefix='/api/rnd', tags=['uploads'])
app.include_router(submission_v2.router,     prefix='/api/rnd', tags=['submission'])

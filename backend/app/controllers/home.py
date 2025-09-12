from fastapi import APIRouter, Response

api = APIRouter()


@api.get("/", include_in_schema=False)
async def root():
    return {"status": "ok", "service": "Linq RMS Task API"}

@api.get("/health", include_in_schema=False)
async def health():
    return Response(status_code=200)
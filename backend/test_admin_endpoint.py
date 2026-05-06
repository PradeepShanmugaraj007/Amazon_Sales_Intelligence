import asyncio
from app.db.session import AsyncSessionLocal
from app.api.v1.endpoints.admin import send_expiry_warnings

async def run():
    async with AsyncSessionLocal() as db:
        res = await send_expiry_warnings(db)
        print(res)

asyncio.run(run())

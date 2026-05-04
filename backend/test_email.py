import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy.future import select
from app.models.sales import User
from app.services.email_service import send_email, get_promotional_email_html

async def test():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            if u.plan in ["demo", "none"]:
                print(f'Sending to {u.email}')
                res = send_email(u.email, 'test', get_promotional_email_html(u.name))
                print(f'Sent to {u.email}: {res}')

asyncio.run(test())

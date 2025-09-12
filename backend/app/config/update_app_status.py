import asyncio

import aiofiles

STATUS_FILE_PATH = "/tmp/app.status"


async def update_app_status():
    while True:
        try:
            async with aiofiles.open(STATUS_FILE_PATH, "w") as f:
                await f.write("OK\n")
        except Exception as e:
            print(f"Failed to write status file: {e}")
        await asyncio.sleep(5)
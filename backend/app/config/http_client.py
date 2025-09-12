from contextlib import asynccontextmanager
from enum import Enum

import httpx


class HttpConfig(Enum):
    NUM_CONN_POOL = 200
    EXPIRE_CONN_POOL = 60

    TIMEOUT_TOTAL = 180.0
    TIMEOUT_CONNECT = 20.0


@asynccontextmanager
async def create_httpx_client():
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(
            timeout=HttpConfig.TIMEOUT_TOTAL.value,
            connect=HttpConfig.TIMEOUT_CONNECT.value,
        ),
        limits=httpx.Limits(
            max_connections=HttpConfig.NUM_CONN_POOL.value,  # default 100
            max_keepalive_connections=HttpConfig.NUM_CONN_POOL.value,  # default 20
            keepalive_expiry=HttpConfig.EXPIRE_CONN_POOL.value,  # default 5
        ),
    )

    try:
        yield http_client
    finally:
        await http_client.aclose()
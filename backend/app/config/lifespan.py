import asyncio
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import cast
import httpx
from app.config.http_client import create_httpx_client
from app.config.logger import create_logger
from app.config.postgres_manager import PostgresManager
from app.config.opensearch_manager import OpenSearchManager
from app.config.update_app_status import update_app_status
from fastapi import FastAPI, Request
from sqlalchemy.ext.asyncio import AsyncSession
from opensearchpy import AsyncOpenSearch
import openai

logger = create_logger(__name__)


@dataclass
class Context:
    """Context available to request handlers."""
    http_client: httpx.AsyncClient
    db_session: AsyncSession
    os_client: AsyncOpenSearch
    openai_client: openai.AsyncOpenAI | None


@dataclass
class InternalContext:
    """Internal context stored in app state."""
    http_client: httpx.AsyncClient
    db_manager: PostgresManager
    os_manager: OpenSearchManager
    openai_client: openai.AsyncOpenAI | None


async def get_ctx_from_request(request: Request) -> AsyncGenerator[Context, None]:
    """Get context for request handlers with both database session and OpenSearch client."""
    internal_ctx = cast(InternalContext, request.state.context)
    
    # Get database session
    async for session in internal_ctx.db_manager.get_session():
        # Get OpenSearch client
        async for os_client in internal_ctx.os_manager.get_client():
            ctx = Context(
                http_client=internal_ctx.http_client,
                db_session=session,
                os_client=os_client,
                openai_client=internal_ctx.openai_client
            )
            yield ctx

@asynccontextmanager
async def lifespan(
    app: FastAPI | None,  # pyright: ignore[reportUnusedParameter]
):
    """
    A lifespan handler for dealing with code that needs to run 
    before the application starts up or when the application is shutting down.
    """
    status_task = None
    db_manager = None
    os_manager = None
    
    try:
        status_task = asyncio.create_task(update_app_status())
        logger.info("Setting application context...")
        
        # Initialize PostgreSQL
        db_manager = PostgresManager()
        await db_manager.initialize()
        
        # Initialize OpenSearch
        os_manager = OpenSearchManager()
        await os_manager.initialize()
        
        async with create_httpx_client() as http_client:
            # Create OpenAI client only if API key is provided
            openai_client = None
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                openai_client = openai.AsyncOpenAI(
                    api_key=api_key,
                    http_client=http_client
                )
            
            ctx = InternalContext(
                http_client=http_client,
                db_manager=db_manager,
                os_manager=os_manager,
                openai_client=openai_client,
            )
            
            yield {"context": ctx}
            
    finally:
        # Cleanup OpenSearch
        if os_manager:
            await os_manager.close()
        
        # Cleanup PostgreSQL
        if db_manager:
            await db_manager.close()
        
        # Cleanup status task
        if status_task is not None:
            _ = status_task.cancel()
            try:
                await status_task
            except asyncio.CancelledError:
                pass
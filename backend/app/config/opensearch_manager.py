import os
from collections.abc import AsyncGenerator
from typing import Any
from opensearchpy import AsyncOpenSearch
from dotenv import load_dotenv
from app.config.logger import create_logger

_ = load_dotenv()
logger = create_logger(__name__)


class OpenSearchManager:
    def __init__(self):
        self.client: AsyncOpenSearch | None = None
        self.host: str = os.getenv("OPENSEARCH_HOST", "localhost")
        self.port: int = int(os.getenv("OPENSEARCH_PORT", "9200"))
        self.use_ssl: bool = os.getenv("OPENSEARCH_USE_SSL", "false").lower() == "true"
        
    async def initialize(self):
        """Initialize the OpenSearch client with connection pooling."""
        # Basic auth setup if provided
        http_auth = None
        username = os.getenv("OPENSEARCH_USERNAME")
        password = os.getenv("OPENSEARCH_PASSWORD")
        if username and password:
            http_auth = (username, password)
        
        self.client = AsyncOpenSearch(
            hosts=[{"host": self.host, "port": self.port}],
            http_auth=http_auth,
            use_ssl=self.use_ssl,
            verify_certs=False,  # For local development
            ssl_assert_hostname=False,
            ssl_show_warn=False,
            pool_maxsize=100,
            timeout=30.0,
        )
        
        # Test connection
        try:
            health = await self.client.cluster.health()
            logger.info(f"OpenSearch connection test successful: cluster status = {health.get('status', 'unknown')}")
            
            # Log additional info in development
            env = os.getenv("ENV", "development")
            if env == "development":
                info = await self.client.info()
                logger.info(f"OpenSearch version: {info.get('version', {}).get('number', 'unknown')}")
        except Exception as e:
            logger.error(f"OpenSearch connection test failed: {e}")
            raise
            
        logger.info("OpenSearch client initialized successfully")
    
    async def close(self):
        """Close the OpenSearch client connection."""
        if self.client:
            await self.client.close()
            logger.info("OpenSearch client closed")
    
    async def get_client(self) -> AsyncGenerator[AsyncOpenSearch, None]:
        """Get the OpenSearch client for use in requests."""
        if not self.client:
            raise Exception("OpenSearch client not initialized")
        
        try:
            yield self.client
        except Exception as e:
            logger.error(f"Error during OpenSearch operation: {e}")
            raise
    
    def get_vector_index_settings(self, embedding_dimension: int = 1536) -> dict[str, Any]:
        """
        Get default settings for a vector search index.
        
        Args:
            embedding_dimension: Dimension of the embedding vectors
            
        Returns:
            Index configuration with settings and mappings
        """
        return {
            "settings": {
                "index.knn": True,
                "number_of_replicas": 1,
                "number_of_shards": 3,
                "analysis": {
                    "analyzer": {
                        "icu_analyzer": {
                            "tokenizer": "standard",
                            "filter": ["lowercase", "icu_normalization"],
                        }
                    },
                    "filter": {
                        "icu_normalization": {"type": "icu_normalizer"}
                    },
                },
            },
            "mappings": {
                "properties": {
                    "chunk_vector": {
                        "type": "knn_vector",
                        "dimension": embedding_dimension,
                        "data_type": "float",
                        "space_type": "l2",
                        # "mode": "on_disk",  # Uncomment if needed
                        "compression_level": "32x",
                        "method": {
                            "name": "hnsw",
                            "engine": "faiss",
                            "parameters": {
                                "ef_construction": 128,
                                "m": 24
                            },
                        },
                    },
                    "text": {
                        "type": "text",
                        "analyzer": "icu_analyzer",
                        "fields": {
                            "cjk": {"type": "text", "analyzer": "cjk"},
                            "eng": {"type": "text", "analyzer": "english"},
                        },
                    },
                    # Add other fields as needed - these are configurable
                    "metadata": {
                        "type": "object",
                        "enabled": True
                    },
                    "doc_id": {
                        "type": "keyword"
                    },
                    "created_at": {
                        "type": "date"
                    }
                }
            }
        }
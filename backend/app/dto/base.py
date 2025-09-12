from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict
from typing import TypeVar, Generic, ClassVar

T = TypeVar("T")

# Base Models
class BaseDTOModel(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(populate_by_name=True)

class ModelSchemaBase(BaseDTOModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(populate_by_name=True, from_attributes=True)

# Requests
class BaseRequest(BaseDTOModel):
    """Base class for request data structures"""
    pass

# Responses
class BaseResponseCore(BaseDTOModel):
    """Base class for response core data structures"""
    pass


class BaseResponse(BaseDTOModel, Generic[T]):
    code: int = 0
    success: bool = True
    message: str = "success"
    response: T

    def render_json(self, status_code: int = 200):
        return JSONResponse(content=jsonable_encoder(self), status_code=status_code)
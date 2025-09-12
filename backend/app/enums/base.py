# pyright: reportAny=false
# pyright: reportExplicitAny=false  
# pyright: reportUnknownLambdaType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportUnknownVariableType=false
from enum import IntEnum, StrEnum
from typing import Any, TypeVar
from sqlalchemy import Enum as SQLEnum, Column
from sqlmodel import Field

T = TypeVar('T', bound='BaseStrEnum')
U = TypeVar('U', bound='BaseIntEnum')


class BaseStrEnum(StrEnum):
    """Base string enum with database integration"""
    
    @classmethod
    def db_field(cls: type[T], nullable: bool = False, default: T | None = None, **kwargs: Any) -> T:
        """Create SQLModel field for this string enum"""
        return Field(  
            sa_column=Column(
                SQLEnum(cls, native_enum=False, values_callable=lambda e: [str(x.value) for x in e]),
                nullable=nullable
            ),
            default=default,
            **kwargs
        )


class BaseIntEnum(IntEnum):
    """Base integer enum with database integration"""
    
    @classmethod
    def db_field(cls: type[U], nullable: bool = False, default: U | None = None, **kwargs: Any) -> U:
        """Create SQLModel field for this integer enum"""
        return Field( 
            sa_column=Column(
                SQLEnum(cls, native_enum=False, values_callable=lambda e: [int(x.value) for x in e]),
                nullable=nullable
            ),
            default=default,
            **kwargs
        )
        
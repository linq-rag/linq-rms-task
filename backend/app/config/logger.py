import datetime
import json
import logging
import os
import sys
from logging.config import dictConfig
from types import FrameType
from typing import cast
import loguru
import stackprinter
from pydantic import BaseModel

env = os.getenv("ENV", "development")
host_name = os.getenv("HOSTNAME", "")

LEVEL_TO_NAME = {
    logging.CRITICAL: "CRITICAL",
    logging.ERROR: "ERROR",
    logging.WARNING: "WARNING",
    logging.INFO: "INFO",
    logging.DEBUG: "DEBUG",
    logging.NOTSET: "TRACE",
}


class CustomLogRecord(logging.LogRecord):
    duration: float | int | None
    request_json_fields: dict | None
    props: dict | None


class LogFilter(logging.Filter):
    def filter(self, record: CustomLogRecord) -> bool:
        # 무시할 엔드포인트 설정
        ignore_endpoints = ["/health"]
        for endpoint in ignore_endpoints:
            if endpoint in record.getMessage():
                return False
        return True


class BaseJsonLogSchema(BaseModel):
    """
    Main log in JSON format
    """
    level: str
    message: str
    source_log: str
    time: str
    app: str
    component: str
    env: str
    request_id: str = ""  # Default empty string instead of context var
    is_error: int = 0
    path: str | None = None
    task_id: str | None = None
    exceptions: str | list[str] | None = None
    duration: float | int | None = None
    host_name: str | None = None

    class Config:
        populate_by_name = True


class ConsoleLogger(logging.Handler):
    def emit(self, record: CustomLogRecord) -> None:  # pragma: no cover
        # Get corresponding Loguru level if it exists
        try:
            level = loguru.logger.level(record.levelname).name
        except ValueError:
            level = str(record.levelno)

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:  # noqa: WPS609
            frame = cast(FrameType, frame.f_back)
            depth += 1

        loguru.logger.opt(depth=depth, exception=record.exc_info).log(
            level,
            record.getMessage(),
        )


class JSONLogFormatter(logging.Formatter):
    """
    Custom class-formatter for writing logs to json
    """

    def format(self, record: CustomLogRecord, *args, **kwargs) -> str:
        """
        Formating LogRecord to json
        :param record: logging.LogRecord
        :return: json string
        """
        log_object: dict = self._format_log_object(record)
        return json.dumps(log_object, ensure_ascii=False)

    @staticmethod
    def _format_log_object(record: CustomLogRecord) -> dict:
        now = (
            datetime.datetime.fromtimestamp(record.created)
            .astimezone()
            .replace(microsecond=0)
            .isoformat()
        )
        message = record.getMessage()
        duration = getattr(record, "duration", record.msecs)
        
        # Get request_id and path from record attributes if they exist
        request_id = getattr(record, "request_id", "")
        path = getattr(record, "path", None)
        
        # Get task_id from record attributes if it exists
        task_id = getattr(record, "task_id", "")

        json_log_fields = BaseJsonLogSchema(
            time=now,
            level=LEVEL_TO_NAME[record.levelno],
            message=message,
            source_log=record.name,
            duration=duration,
            app="linq-search",
            component="fastapi_boilerplate",
            env=env,
            request_id=request_id,
            path=path,
            task_id=task_id,
            host_name=host_name,
        )

        if hasattr(record, "props") and record.props:
            json_log_fields.props = record.props

        if record.exc_info:
            json_log_fields.exceptions = stackprinter.format(
                record.exc_info,
                suppressed_paths=[
                    r"lib/python.*/site-packages/starlette.*",
                ],
                add_summary=False,
            ).split("\n")
        elif record.exc_text:
            json_log_fields.exceptions = record.exc_text

        # Pydantic to dict
        json_log_object = json_log_fields.dict(
            exclude_unset=True,
            by_alias=True,
        )

        # getting additional fields
        if hasattr(record, "request_json_fields") and record.request_json_fields:
            json_log_object.update(record.request_json_fields)

        return json_log_object


def handlers():
    handler_dic = {"development": ["intercept"], "production": ["json"], "staging": ["json"]}
    handler = handler_dic[env]
    return handler


LOG_HANDLER = handlers()
LOGGING_LEVEL = logging.INFO

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "ignore_endpoints": {
            "()": LogFilter,
        },
    },
    "formatters": {
        "json": {
            "()": JSONLogFormatter,
        },
    },
    "handlers": {
        "json": {
            "formatter": "json",
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
        },
        "intercept": {
            "()": ConsoleLogger,
        },
    },
    "loggers": {
        "": {
            "handlers": LOG_HANDLER,
            "level": LOGGING_LEVEL,
            "propagate": False,
        },
        "uvicorn": {
            "handlers": LOG_HANDLER,
            "level": "INFO" if env == "development" else "CRITICAL",
            "propagate": False,
        },
        "uvicorn.access": {
            "handlers": LOG_HANDLER,
            "level": "INFO",
            "propagate": False,
            "filters": ["ignore_endpoints"],
        },
        "sqlalchemy": {
            "handlers": LOG_HANDLER,
            "level": "INFO",
            "propagate": False,
        },
        "sqlalchemy.engine": {
            "handlers": LOG_HANDLER,
            "level": "WARNING",
            "propagate": False,
        },
        "sqlalchemy.orm": {
            "handlers": LOG_HANDLER,
            "level": "WARNING",
            "propagate": False,
        },
        "celery.worker.consumer.mingle": {
            "handlers": LOG_HANDLER,
            "level": "WARNING",
            "propagate": False,
        },
    },
}


def create_logger(name: str) -> logging.Logger:
    dictConfig(LOG_CONFIG)
    logger = logging.getLogger(name)
    return logger


# Helper function to add context to log records
def add_request_context(logger, request_id=None, path=None, task_id=None):
    """
    Helper function to add context information to logger
    
    Usage:
        logger = create_logger(__name__)
        logger = add_request_context(logger, request_id="123", path="/api/users")
        logger.info("Processing request")
    """
    class ContextFilter(logging.Filter):
        def filter(self, record):
            if request_id:
                record.request_id = request_id
            if path:
                record.path = path
            if task_id:
                record.task_id = task_id
            return True
    
    context_filter = ContextFilter()
    logger.addFilter(context_filter)
    return logger
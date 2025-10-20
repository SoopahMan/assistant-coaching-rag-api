import os

from celery import Celery
from dotenv import load_dotenv

load_dotenv()


def make_celery() -> Celery:
    celery = Celery(
        "worker",
        backend=os.getenv("CELERY_RESULT_BACKEND"),
        broker=os.getenv("CELERY_BROKER_URL"),
    )

    return celery

import os
import sys

from config.celery import make_celery

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

celery = make_celery()

celery.autodiscover_tasks(["task"])

if __name__ == "__main__":
    celery.worker_main()

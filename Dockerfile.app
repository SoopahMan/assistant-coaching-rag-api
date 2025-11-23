FROM python:3.12.9
WORKDIR /app
COPY requirements.txt .

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgl1-mesa-glx \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update \ 
    && apt-get install -y postgresql-client libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt
COPY ./app /app 
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]

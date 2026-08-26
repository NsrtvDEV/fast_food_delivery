FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

COPY . .
RUN uv sync --frozen
RUN chmod +x start.sh

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["./start.sh"]

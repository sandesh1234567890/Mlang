FROM python:3.12-slim

WORKDIR /app

# Copy setup.py and source folder
COPY setup.py /app/
COPY mlang /app/mlang/

# Install local package
RUN pip install --no-cache-dir .

EXPOSE 8080

CMD ["python", "mlang/ide_server.py"]

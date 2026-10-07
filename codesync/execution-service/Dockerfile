FROM python:3.12-slim

RUN groupadd -r sandbox && useradd -r -g sandbox sandbox

WORKDIR /sandbox

COPY runner.py /sandbox/runner.py

RUN chown -R sandbox:sandbox /sandbox

USER sandbox

ENTRYPOINT ["python", "/sandbox/runner.py"]

PYTHON := .venv/bin/python
PIP    := .venv/bin/pip

.PHONY: install run test

install:
	python3 -m venv .venv
	$(PIP) install --upgrade pip -q
	$(PIP) install -r requirements.txt -q

run: .venv
	$(PYTHON) main.py

test: .venv
	$(PYTHON) -m pytest tests/ -v

.venv:
	@echo "Run 'make install' first"
	@exit 1

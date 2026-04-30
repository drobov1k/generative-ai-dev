"""AWS Lambda entry point. Mangum wraps the FastAPI ASGI app."""
from mangum import Mangum
from main import app

handler = Mangum(app, lifespan="off")

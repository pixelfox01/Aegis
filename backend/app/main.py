from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def healthcheck():
    return {"message": "We are so back!"}

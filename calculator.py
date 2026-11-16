import math
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Calculator API")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


class Calculation(BaseModel):
    left: float
    operator: str
    right: float


@app.get("/", include_in_schema=False)
def calculator_ui() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.post("/api/calc")
def calculate(calculation: Calculation) -> dict[str, float]:
    left = calculation.left
    right = calculation.right

    if not math.isfinite(left) or not math.isfinite(right):
        raise HTTPException(status_code=422, detail="Operands must be finite numbers.")

    if calculation.operator == "+":
        result = left + right
    elif calculation.operator == "-":
        result = left - right
    elif calculation.operator == "*":
        result = left * right
    elif calculation.operator == "/":
        if right == 0:
            raise HTTPException(status_code=400, detail="Cannot divide by zero.")
        result = left / right
    else:
        raise HTTPException(status_code=422, detail="Operator must be +, -, *, or /.")

    if not math.isfinite(result):
        raise HTTPException(status_code=422, detail="Calculation result is not finite.")

    return {"result": result}

@echo off
REM DealFlow360 FastAPI Backend Startup Script

echo.
echo ====================================
echo DealFlow360 Python FastAPI Backend
echo ====================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if dependencies are installed
echo Checking dependencies...
pip show fastapi > nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
    echo.
)

REM Start the server
echo.
echo Starting FastAPI server...
echo.
echo Server will be available at: http://localhost:5000
echo API Documentation at: http://localhost:5000/docs
echo.
echo Press CTRL+C to stop the server
echo.

uvicorn app.main:app --reload --port 5000

pause

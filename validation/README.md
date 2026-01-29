# Part 4: Content Validation & Evaluation System

## Overview

This module validates AI-generated educational content to ensure:
- **Lab content**: Code is syntactically correct and well-formatted
- **Theory content**: Text is properly structured and grounded in source materials

## Files

| File | Description |
|------|-------------|
| `validator.py` | Core validation logic (works without API keys) |
| `validation_api.py` | Flask REST API for validation services |
| `requirements.txt` | Python dependencies |

## Quick Start

### 1. Install Dependencies

```bash
cd validation
pip install -r requirements.txt
```

### 2. Run the Validation API Server

```bash
python validation_api.py
```

Server runs on `http://localhost:5002`

### 3. Test the Validation

```bash
# Test code validation
curl -X POST http://localhost:5002/api/validate/code \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"hello world\")", "language": "python"}'

# Test text validation
curl -X POST http://localhost:5002/api/validate/text \
  -H "Content-Type: application/json" \
  -d '{"text": "# Title\n\nSome content here..."}'

# Full validation pipeline
curl -X POST http://localhost:5002/api/validate \
  -H "Content-Type: application/json" \
  -d '{"content": "def hello():\n    return 42", "type": "lab"}'
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/validate` | POST | Main validation pipeline |
| `/api/validate/code` | POST | Code syntax validation only |
| `/api/validate/text` | POST | Text formatting validation only |
| `/api/validate/grounding` | POST | Check grounding against source |
| `/api/validate/batch` | POST | Validate multiple items |

## Using with Node.js Backend

The main `server.js` has routes that proxy to this Python service:

```javascript
// These routes are already added to server.js
POST /api/validate
POST /api/validate/code  
POST /api/validate/text
POST /api/validate/grounding
GET  /api/validations/:contentId
GET  /api/validations/stats/summary
```

## Adding LLM API Keys

When your friend provides API keys, update `validator.py`:

```python
class Config:
    OPENAI_API_KEY = "sk-..."  # Add your key here
    # or
    ANTHROPIC_API_KEY = "sk-ant-..."
```

Then uncomment the LLM implementation in the `check_grounding()` method.

## Validation Types

### 1. Syntax Validation (Lab)
- Uses Python's `ast` module - **No API needed**
- Checks for syntax errors in Python code
- Basic bracket matching for JavaScript

### 2. Formatting Validation (Theory)
- Rule-based checks - **No API needed**
- Ensures markdown headers present
- Checks content length and structure

### 3. Grounding Validation
- Currently mocked - **Needs LLM API**
- Will verify content matches source material
- Detects hallucinations

### 4. AI Evaluation
- Currently mocked - **Needs LLM API**
- Rubric-based scoring
- Explainable feedback

## Response Format

```json
{
  "is_valid": true,
  "score": 85,
  "feedback": "All validation checks passed",
  "checks": [
    {
      "is_valid": true,
      "score": 100,
      "feedback": "Code syntax is valid",
      "validation_type": "syntax",
      "error_messages": []
    }
  ]
}
```

## Running Tests

```bash
# Run the validator directly to see test output
python validator.py
```

Expected output:
```
============================================================
Content Validation & Evaluation System - Part 4
============================================================

[TEST 1] Python Syntax Validation
----------------------------------------
Valid code test: is_valid=True, score=100
Invalid code test: is_valid=False, score=0

[TEST 2] Theory Content Validation  
----------------------------------------
Good theory test: is_valid=True, score=85
Bad theory test: is_valid=False, score=35
```

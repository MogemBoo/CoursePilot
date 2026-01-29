"""
Validation API Routes
=====================
Express-compatible API endpoints for the validation system.
These can be called from the Node.js backend via subprocess or HTTP.

Run as standalone Flask server:
    python validation_api.py

Or import functions directly in your Python scripts.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from validator import (
    validate_output,
    validate_python_code,
    check_formatting,
    ContentValidator,
    quick_validate_code,
    quick_validate_text
)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "validation-api",
        "version": "1.0.0"
    })


@app.route('/api/validate', methods=['POST'])
def validate_content():
    """
    Main validation endpoint.
    
    Request body:
    {
        "content": "string - the content to validate",
        "type": "theory" | "lab",
        "language": "python" | "javascript" (optional, for lab),
        "source_context": "string - source material for grounding" (optional),
        "api_key": "string - LLM API key" (optional)
    }
    
    Response:
    {
        "is_valid": boolean,
        "score": number (0-100),
        "feedback": "string",
        "checks": [array of individual check results]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({
                "error": "Missing required field: content"
            }), 400
        
        content = data.get('content', '')
        content_type = data.get('type', 'theory')
        language = data.get('language', 'python')
        source_context = data.get('source_context')
        api_key = data.get('api_key')
        
        result = validate_output(
            content=content,
            content_type=content_type,
            language=language,
            source_context=source_context,
            api_key=api_key
        )
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "is_valid": False,
            "score": 0
        }), 500


@app.route('/api/validate/code', methods=['POST'])
def validate_code_endpoint():
    """
    Validate code syntax only.
    
    Request body:
    {
        "code": "string - the code to validate",
        "language": "python" | "javascript"
    }
    
    Response:
    {
        "is_valid": boolean,
        "error": "string or null"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({"error": "Missing required field: code"}), 400
        
        code = data.get('code', '')
        language = data.get('language', 'python')
        
        if language == 'python':
            is_valid, error = validate_python_code(code)
        else:
            is_valid = quick_validate_code(code, language)
            error = None if is_valid else "Syntax error detected"
        
        return jsonify({
            "is_valid": is_valid,
            "error": error,
            "language": language
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "is_valid": False
        }), 500


@app.route('/api/validate/text', methods=['POST'])
def validate_text_endpoint():
    """
    Validate text formatting only.
    
    Request body:
    {
        "text": "string - the text to validate"
    }
    
    Response:
    {
        "is_valid": boolean,
        "score": number,
        "issues": [array of issues]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Missing required field: text"}), 400
        
        text = data.get('text', '')
        result = check_formatting(text)
        
        return jsonify({
            "is_valid": result.is_valid,
            "score": result.score,
            "issues": result.error_messages
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "is_valid": False
        }), 500


@app.route('/api/validate/grounding', methods=['POST'])
def validate_grounding_endpoint():
    """
    Check if content is grounded in source material.
    
    Request body:
    {
        "generated_text": "string - the AI-generated content",
        "source_context": "string - the source material",
        "api_key": "string - LLM API key" (optional)
    }
    
    Response:
    {
        "is_grounded": boolean,
        "score": number,
        "feedback": "string",
        "issues": [array of issues]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'generated_text' not in data:
            return jsonify({"error": "Missing required field: generated_text"}), 400
        
        generated_text = data.get('generated_text', '')
        source_context = data.get('source_context', '')
        api_key = data.get('api_key')
        
        validator = ContentValidator(api_key)
        result = validator.check_grounding(generated_text, source_context)
        
        return jsonify({
            "is_grounded": result.is_valid,
            "score": result.score,
            "feedback": result.feedback,
            "issues": result.error_messages
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "is_grounded": False
        }), 500


@app.route('/api/validate/batch', methods=['POST'])
def validate_batch_endpoint():
    """
    Validate multiple content items at once.
    
    Request body:
    {
        "items": [
            {"content": "...", "type": "theory"},
            {"content": "...", "type": "lab", "language": "python"}
        ]
    }
    
    Response:
    {
        "results": [array of validation results],
        "summary": {
            "total": number,
            "passed": number,
            "failed": number,
            "average_score": number
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'items' not in data:
            return jsonify({"error": "Missing required field: items"}), 400
        
        items = data.get('items', [])
        results = []
        
        for item in items:
            content = item.get('content', '')
            content_type = item.get('type', 'theory')
            language = item.get('language', 'python')
            
            result = validate_output(
                content=content,
                content_type=content_type,
                language=language
            )
            results.append(result)
        
        # Calculate summary
        passed = sum(1 for r in results if r['is_valid'])
        total = len(results)
        avg_score = sum(r['score'] for r in results) / total if total > 0 else 0
        
        return jsonify({
            "results": results,
            "summary": {
                "total": total,
                "passed": passed,
                "failed": total - passed,
                "average_score": round(avg_score, 2)
            }
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("🔍 Validation API Server Starting...")
    print("=" * 60)
    print("\nEndpoints available:")
    print("  POST /api/validate          - Main validation pipeline")
    print("  POST /api/validate/code     - Code syntax validation")
    print("  POST /api/validate/text     - Text formatting validation")
    print("  POST /api/validate/grounding - Grounding check")
    print("  POST /api/validate/batch    - Batch validation")
    print("  GET  /health                - Health check")
    print("\n" + "=" * 60)
    
    app.run(host='0.0.0.0', port=5002, debug=True)

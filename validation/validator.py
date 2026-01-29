"""
Part 4: Content Validation & Evaluation System
===============================================
This module provides validation pipelines for AI-generated educational content.

Supports:
- Lab content: Syntax checking, compilation validation for code
- Theory content: Grounding checks, formatting validation, rubric evaluation

Author: CoursePilot Team
"""

import ast
import re
import os
import json
from typing import Dict, Tuple, Optional, List
from dataclasses import dataclass
from enum import Enum

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'server', '.env'))

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️ OpenAI package not installed. Run: pip install openai")


# ============================================================================
# CONFIGURATION - API keys loaded from environment
# ============================================================================

class Config:
    """
    Configuration for validation services.
    API keys are loaded from environment variables.
    """
    # OpenAI API Key for LLM-based validation
    OPENAI_API_KEY: Optional[str] = os.getenv('OPENAI_API_KEY')
    
    # Alternative: Anthropic Claude API
    ANTHROPIC_API_KEY: Optional[str] = os.getenv('ANTHROPIC_API_KEY')
    
    # Model to use for AI evaluation
    LLM_MODEL: str = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')  # Use cost-effective model
    
    # Supported programming languages for lab validation
    SUPPORTED_LANGUAGES: List[str] = ["python", "javascript", "java", "c", "cpp"]
    
    @classmethod
    def is_openai_configured(cls) -> bool:
        """Check if OpenAI API is properly configured."""
        return OPENAI_AVAILABLE and cls.OPENAI_API_KEY is not None


# ============================================================================
# DATA CLASSES
# ============================================================================

class ValidationType(Enum):
    """Types of validation that can be performed."""
    SYNTAX = "syntax"
    COMPILATION = "compilation"
    GROUNDING = "grounding"
    RUBRIC = "rubric"
    TEST_CASE = "test_case"
    AI_EVALUATION = "ai_evaluation"


@dataclass
class ValidationResult:
    """Structured result from any validation check."""
    is_valid: bool
    score: int  # 0-100
    feedback: str
    validation_type: ValidationType
    error_messages: List[str] = None
    
    def __post_init__(self):
        if self.error_messages is None:
            self.error_messages = []
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for API responses."""
        return {
            "is_valid": self.is_valid,
            "score": self.score,
            "feedback": self.feedback,
            "validation_type": self.validation_type.value,
            "error_messages": self.error_messages
        }


# ============================================================================
# CODE VALIDATION (LAB CONTENT) - Works without AI
# ============================================================================

def validate_python_code(code_string: str) -> Tuple[bool, Optional[str]]:
    """
    Validate Python code syntax using the built-in ast module.
    
    This function does NOT require any API keys - it uses Python's
    abstract syntax tree parser to check for syntax errors.
    
    Args:
        code_string: The Python code to validate
        
    Returns:
        Tuple of (is_valid: bool, error_message: Optional[str])
        
    Example:
        >>> is_valid, error = validate_python_code("print('hello')")
        >>> print(is_valid)  # True
        >>> print(error)     # None
        
        >>> is_valid, error = validate_python_code("print('hello'")
        >>> print(is_valid)  # False
        >>> print(error)     # "SyntaxError at line 1: ..."
    """
    if not code_string or not code_string.strip():
        return False, "Empty code string provided"
    
    try:
        # Parse the code into an AST - this catches syntax errors
        ast.parse(code_string)
        return True, None
    except SyntaxError as e:
        error_msg = f"SyntaxError at line {e.lineno}: {e.msg}"
        if e.text:
            error_msg += f"\n  Code: {e.text.strip()}"
        return False, error_msg
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"


def validate_javascript_code(code_string: str) -> Tuple[bool, Optional[str]]:
    """
    Basic JavaScript validation using regex patterns.
    
    Note: This is a simplified validator. For production, consider using
    a proper JS parser like esprima (requires Node.js) or a linting service.
    
    Args:
        code_string: The JavaScript code to validate
        
    Returns:
        Tuple of (is_valid: bool, error_message: Optional[str])
    """
    if not code_string or not code_string.strip():
        return False, "Empty code string provided"
    
    # Basic bracket matching check
    brackets = {'(': ')', '[': ']', '{': '}'}
    stack = []
    
    in_string = False
    string_char = None
    
    for i, char in enumerate(code_string):
        # Track string literals to avoid counting brackets inside strings
        if char in ('"', "'", '`') and (i == 0 or code_string[i-1] != '\\'):
            if not in_string:
                in_string = True
                string_char = char
            elif char == string_char:
                in_string = False
                string_char = None
            continue
        
        if in_string:
            continue
            
        if char in brackets:
            stack.append(char)
        elif char in brackets.values():
            if not stack:
                return False, f"Unmatched closing bracket '{char}' at position {i}"
            if brackets[stack.pop()] != char:
                return False, f"Mismatched bracket '{char}' at position {i}"
    
    if stack:
        return False, f"Unclosed brackets: {stack}"
    
    return True, None


def validate_code(code_string: str, language: str = "python") -> ValidationResult:
    """
    Validate code based on the specified programming language.
    
    Args:
        code_string: The code to validate
        language: Programming language ("python", "javascript", etc.)
        
    Returns:
        ValidationResult with syntax check results
    """
    language = language.lower()
    
    if language == "python":
        is_valid, error = validate_python_code(code_string)
    elif language in ("javascript", "js"):
        is_valid, error = validate_javascript_code(code_string)
    else:
        # For unsupported languages, do basic checks
        is_valid = bool(code_string and code_string.strip())
        error = None if is_valid else "Empty code"
    
    return ValidationResult(
        is_valid=is_valid,
        score=100 if is_valid else 0,
        feedback="Code syntax is valid" if is_valid else f"Syntax error: {error}",
        validation_type=ValidationType.SYNTAX,
        error_messages=[error] if error else []
    )


# ============================================================================
# TEXT VALIDATION (THEORY CONTENT)
# ============================================================================

class ContentValidator:
    """
    Validator for theory/text content including grounding checks.
    
    This class handles validation of AI-generated educational text content,
    ensuring it's grounded in source materials and properly formatted.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the ContentValidator.
        
        Args:
            api_key: Optional LLM API key for AI-powered validation.
                    If not provided, uses mock validation.
        """
        self.api_key = api_key or Config.OPENAI_API_KEY
        self._llm_available = self.api_key is not None
    
    def check_grounding(
        self, 
        generated_text: str, 
        source_context: str
    ) -> ValidationResult:
        """
        Check if the generated text is grounded in the source materials.
        
        This validates that AI-generated content is factually based on
        the provided course materials, not hallucinated.
        
        Args:
            generated_text: The AI-generated content to validate
            source_context: The source material the content should be based on
            
        Returns:
            ValidationResult indicating grounding status
            
        # ================================================================
        # TODO: IMPLEMENT LLM JUDGE WHEN API KEY IS AVAILABLE
        # ================================================================
        # When your friend provides the API key, replace the mock logic
        # below with actual LLM calls. Here's the implementation pattern:
        #
        # ```python
        # from openai import OpenAI
        # 
        # client = OpenAI(api_key=self.api_key)
        # 
        # judge_prompt = f'''
        # You are a grounding validator for educational content.
        # 
        # SOURCE MATERIAL:
        # {source_context}
        # 
        # GENERATED CONTENT:
        # {generated_text}
        # 
        # Task: Determine if the generated content is factually grounded
        # in the source material. Check for:
        # 1. Factual accuracy - claims match the source
        # 2. No hallucinations - no made-up information
        # 3. Proper attribution - concepts traced to source
        # 
        # Respond with JSON:
        # {{"is_grounded": true/false, "score": 0-100, "issues": ["list of issues"]}}
        # '''
        # 
        # response = client.chat.completions.create(
        #     model=Config.LLM_MODEL,
        #     messages=[{"role": "user", "content": judge_prompt}],
        #     response_format={"type": "json_object"}
        # )
        # 
        # result = json.loads(response.choices[0].message.content)
        # return ValidationResult(
        #     is_valid=result["is_grounded"],
        #     score=result["score"],
        #     feedback="Content grounding check complete",
        #     validation_type=ValidationType.GROUNDING,
        #     error_messages=result.get("issues", [])
        # )
        # ```
        # ================================================================
        """
        
        if self._llm_available and Config.is_openai_configured():
            # LLM-based grounding check using OpenAI
            try:
                client = OpenAI(api_key=self.api_key)
                
                judge_prompt = f'''You are a grounding validator for educational content.

SOURCE MATERIAL:
{source_context[:3000]}  

GENERATED CONTENT:
{generated_text[:2000]}

Task: Determine if the generated content is factually grounded in the source material. Check for:
1. Factual accuracy - claims match the source
2. No hallucinations - no made-up information
3. Proper attribution - concepts traced to source

Respond with JSON only:
{{"is_grounded": true/false, "score": 0-100, "issues": ["list of any issues found"]}}'''

                response = client.chat.completions.create(
                    model=Config.LLM_MODEL,
                    messages=[{"role": "user", "content": judge_prompt}],
                    response_format={"type": "json_object"},
                    max_tokens=500
                )
                
                result = json.loads(response.choices[0].message.content)
                return ValidationResult(
                    is_valid=result.get("is_grounded", True),
                    score=result.get("score", 80),
                    feedback="AI grounding check complete",
                    validation_type=ValidationType.GROUNDING,
                    error_messages=result.get("issues", [])
                )
            except Exception as e:
                print(f"⚠️ LLM grounding check failed: {e}")
                # Fall through to mock implementation
        
        # ============================================================
        # MOCK IMPLEMENTATION - Returns True for testing
        # Remove this when LLM is integrated
        # ============================================================
        
        # Basic heuristic checks (work without AI)
        issues = []
        score = 100
        
        # Check if generated text is not empty
        if not generated_text or len(generated_text.strip()) < 50:
            issues.append("Generated content is too short")
            score -= 30
        
        # Check if there's some overlap with source (very basic)
        if source_context:
            source_words = set(source_context.lower().split())
            gen_words = set(generated_text.lower().split())
            overlap = len(source_words & gen_words) / max(len(gen_words), 1)
            
            if overlap < 0.1:
                issues.append("Low vocabulary overlap with source material")
                score -= 20
        
        is_valid = score >= 60
        
        return ValidationResult(
            is_valid=is_valid,
            score=max(0, score),
            feedback="Grounding check passed (mock mode)" if is_valid else "Grounding issues detected",
            validation_type=ValidationType.GROUNDING,
            error_messages=issues
        )
    
    def ai_evaluate(
        self, 
        content: str, 
        rubric: Optional[Dict] = None
    ) -> ValidationResult:
        """
        Perform AI-assisted evaluation with explainability.
        
        Args:
            content: The content to evaluate
            rubric: Optional rubric criteria for evaluation
            
        Returns:
            ValidationResult with AI evaluation
            
        # ================================================================
        # TODO: IMPLEMENT WHEN API KEY IS AVAILABLE
        # ================================================================
        # Similar to check_grounding, implement LLM call here for
        # comprehensive content evaluation against a rubric.
        # 
        # Example rubric format:
        # {
        #     "clarity": {"weight": 0.3, "description": "Is content clear?"},
        #     "accuracy": {"weight": 0.3, "description": "Is content accurate?"},
        #     "completeness": {"weight": 0.2, "description": "Is topic covered?"},
        #     "structure": {"weight": 0.2, "description": "Is it well organized?"}
        # }
        # ================================================================
        """
        
        if self._llm_available and Config.is_openai_configured():
            # LLM-based content evaluation
            try:
                client = OpenAI(api_key=self.api_key)
                
                default_rubric = rubric or {
                    "clarity": {"weight": 0.25, "description": "Is the content clear and easy to understand?"},
                    "accuracy": {"weight": 0.30, "description": "Is the content academically accurate?"},
                    "completeness": {"weight": 0.25, "description": "Does it cover the topic adequately?"},
                    "structure": {"weight": 0.20, "description": "Is the content well-organized?"}
                }
                
                rubric_text = "\n".join([f"- {k}: {v['description']} (weight: {v['weight']})" 
                                         for k, v in default_rubric.items()])
                
                eval_prompt = f'''You are an educational content evaluator.

CONTENT TO EVALUATE:
{content[:3000]}

EVALUATION RUBRIC:
{rubric_text}

Task: Evaluate the content against each rubric criterion and provide:
1. An overall score (0-100)
2. Specific feedback for improvement
3. Any issues or concerns

Respond with JSON only:
{{"is_valid": true/false, "score": 0-100, "feedback": "detailed feedback", "criterion_scores": {{"clarity": 0-100, ...}}, "issues": ["list of issues"]}}'''

                response = client.chat.completions.create(
                    model=Config.LLM_MODEL,
                    messages=[{"role": "user", "content": eval_prompt}],
                    response_format={"type": "json_object"},
                    max_tokens=800
                )
                
                result = json.loads(response.choices[0].message.content)
                return ValidationResult(
                    is_valid=result.get("is_valid", True),
                    score=result.get("score", 75),
                    feedback=result.get("feedback", "AI evaluation complete"),
                    validation_type=ValidationType.AI_EVALUATION,
                    error_messages=result.get("issues", [])
                )
            except Exception as e:
                print(f"⚠️ AI evaluation failed: {e}")
                # Fall through to mock implementation
        
        # Mock implementation when API not available
        return ValidationResult(
            is_valid=True,
            score=85,
            feedback="AI evaluation pending - API key required",
            validation_type=ValidationType.AI_EVALUATION,
            error_messages=["Mock mode: Add API key for real evaluation"]
        )


# ============================================================================
# RUBRIC / FORMATTING CHECKS - Rule-based (No AI needed)
# ============================================================================

def check_formatting(text: str) -> ValidationResult:
    """
    Rule-based check for basic formatting requirements.
    
    Ensures the output meets minimum formatting standards:
    - Not empty
    - Contains markdown structure (headers)
    - Has reasonable length
    - Proper paragraph structure
    
    Args:
        text: The text content to check
        
    Returns:
        ValidationResult with formatting check results
    """
    issues = []
    score = 100
    
    # Check 1: Not empty
    if not text or not text.strip():
        return ValidationResult(
            is_valid=False,
            score=0,
            feedback="Content is empty",
            validation_type=ValidationType.RUBRIC,
            error_messages=["Empty content provided"]
        )
    
    text = text.strip()
    
    # Check 2: Minimum length (at least 100 characters for meaningful content)
    if len(text) < 100:
        issues.append("Content is too short (minimum 100 characters)")
        score -= 25
    
    # Check 3: Contains markdown headers
    has_headers = bool(re.search(r'^#{1,6}\s+.+', text, re.MULTILINE))
    if not has_headers:
        issues.append("Missing markdown headers (e.g., # Title, ## Section)")
        score -= 20
    
    # Check 4: Has multiple paragraphs/sections
    paragraphs = [p for p in text.split('\n\n') if p.strip()]
    if len(paragraphs) < 2:
        issues.append("Content should have multiple paragraphs or sections")
        score -= 15
    
    # Check 5: Not all caps (indicates poor formatting)
    if text.isupper():
        issues.append("Content should not be all uppercase")
        score -= 10
    
    # Check 6: Has some content after headers (not just headers)
    lines = text.split('\n')
    non_header_content = [l for l in lines if not l.startswith('#') and l.strip()]
    if len(non_header_content) < 3:
        issues.append("Need more content between headers")
        score -= 15
    
    is_valid = score >= 60
    
    return ValidationResult(
        is_valid=is_valid,
        score=max(0, score),
        feedback="Formatting check passed" if is_valid else "Formatting issues found",
        validation_type=ValidationType.RUBRIC,
        error_messages=issues
    )


def check_code_formatting(code: str, language: str = "python") -> ValidationResult:
    """
    Check code formatting and style conventions.
    
    Args:
        code: The code to check
        language: Programming language
        
    Returns:
        ValidationResult with code formatting results
    """
    issues = []
    score = 100
    
    if not code or not code.strip():
        return ValidationResult(
            is_valid=False,
            score=0,
            feedback="No code provided",
            validation_type=ValidationType.RUBRIC,
            error_messages=["Empty code"]
        )
    
    lines = code.split('\n')
    
    # Check 1: Has comments/documentation
    has_comments = any(
        line.strip().startswith('#') or 
        line.strip().startswith('//') or
        '"""' in line or "'''" in line
        for line in lines
    )
    if not has_comments:
        issues.append("Code should include comments or documentation")
        score -= 15
    
    # Check 2: Reasonable line length (PEP 8 suggests 79 chars)
    long_lines = [i+1 for i, line in enumerate(lines) if len(line) > 100]
    if long_lines:
        issues.append(f"Lines {long_lines[:5]} exceed recommended length")
        score -= 10
    
    # Check 3: Consistent indentation
    indents = set()
    for line in lines:
        if line and not line.isspace():
            indent = len(line) - len(line.lstrip())
            if indent > 0:
                indents.add(indent % 4 if language == "python" else indent % 2)
    
    if len(indents) > 2:
        issues.append("Inconsistent indentation detected")
        score -= 15
    
    is_valid = score >= 60
    
    return ValidationResult(
        is_valid=is_valid,
        score=max(0, score),
        feedback="Code formatting acceptable" if is_valid else "Code formatting issues",
        validation_type=ValidationType.RUBRIC,
        error_messages=issues
    )


# ============================================================================
# MAIN VALIDATION PIPELINE
# ============================================================================

def validate_output(
    content: str,
    content_type: str = "theory",
    language: str = "python",
    source_context: Optional[str] = None,
    api_key: Optional[str] = None
) -> Dict:
    """
    Main validation pipeline that routes content to appropriate validators.
    
    This is the primary entry point for the validation system. It automatically
    selects and runs the appropriate validation checks based on content type.
    
    Args:
        content: The generated content to validate
        content_type: Either "theory" or "lab"
        language: Programming language (for lab content)
        source_context: Original source material (for grounding checks)
        api_key: Optional API key for LLM-based validation
        
    Returns:
        Dictionary with validation results:
        {
            "is_valid": bool,
            "score": int (0-100),
            "feedback": str,
            "checks": [list of individual check results]
        }
        
    Example:
        >>> result = validate_output(
        ...     content="# Neural Networks\\n\\nNeural networks are...",
        ...     content_type="theory"
        ... )
        >>> print(result["is_valid"])
        True
        
        >>> result = validate_output(
        ...     content="def hello():\\n    print('world')",
        ...     content_type="lab",
        ...     language="python"
        ... )
        >>> print(result["score"])
        100
    """
    results = []
    
    if content_type.lower() == "lab":
        # ============================================
        # LAB CONTENT VALIDATION PIPELINE
        # ============================================
        
        # 1. Syntax validation (required)
        syntax_result = validate_code(content, language)
        results.append(syntax_result)
        
        # 2. Code formatting check
        format_result = check_code_formatting(content, language)
        results.append(format_result)
        
        # 3. If source context provided, check grounding
        if source_context:
            validator = ContentValidator(api_key)
            grounding_result = validator.check_grounding(content, source_context)
            results.append(grounding_result)
    
    else:
        # ============================================
        # THEORY CONTENT VALIDATION PIPELINE
        # ============================================
        
        # 1. Formatting check (required)
        format_result = check_formatting(content)
        results.append(format_result)
        
        # 2. Grounding check if source provided
        if source_context:
            validator = ContentValidator(api_key)
            grounding_result = validator.check_grounding(content, source_context)
            results.append(grounding_result)
        
        # 3. AI evaluation (when available)
        validator = ContentValidator(api_key)
        ai_result = validator.ai_evaluate(content)
        results.append(ai_result)
    
    # ============================================
    # AGGREGATE RESULTS
    # ============================================
    
    # Overall validity: all critical checks must pass
    is_valid = all(r.is_valid for r in results if r.validation_type in [
        ValidationType.SYNTAX, 
        ValidationType.RUBRIC
    ])
    
    # Overall score: weighted average
    total_score = sum(r.score for r in results) / len(results) if results else 0
    
    # Collect all feedback
    all_errors = []
    for r in results:
        all_errors.extend(r.error_messages)
    
    feedback = "All validation checks passed" if is_valid else f"Issues found: {'; '.join(all_errors[:3])}"
    
    return {
        "is_valid": is_valid,
        "score": int(total_score),
        "feedback": feedback,
        "checks": [r.to_dict() for r in results]
    }


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def quick_validate_code(code: str, language: str = "python") -> bool:
    """Quick syntax check - returns just True/False."""
    if language == "python":
        is_valid, _ = validate_python_code(code)
        return is_valid
    result = validate_code(code, language)
    return result.is_valid


def quick_validate_text(text: str) -> bool:
    """Quick formatting check - returns just True/False."""
    result = check_formatting(text)
    return result.is_valid


# ============================================================================
# CLI INTERFACE (for testing)
# ============================================================================

if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("Content Validation & Evaluation System - Part 4")
    print("=" * 60)
    
    # Test Python code validation
    print("\n[TEST 1] Python Syntax Validation")
    print("-" * 40)
    
    valid_code = """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
    
print(fibonacci(10))
"""
    
    invalid_code = """
def broken_function(
    print("missing closing paren"
"""
    
    result = validate_output(valid_code, content_type="lab", language="python")
    print(f"Valid code test: is_valid={result['is_valid']}, score={result['score']}")
    
    result = validate_output(invalid_code, content_type="lab", language="python")
    print(f"Invalid code test: is_valid={result['is_valid']}, score={result['score']}")
    print(f"Feedback: {result['feedback']}")
    
    # Test theory content validation
    print("\n[TEST 2] Theory Content Validation")
    print("-" * 40)
    
    good_theory = """
# Introduction to Neural Networks

Neural networks are computational models inspired by biological neural networks.

## Key Components

The main components of a neural network include:
- Input layer
- Hidden layers
- Output layer

## How They Work

Each neuron receives inputs, applies weights, and produces an output through an activation function.
"""
    
    bad_theory = "just some text without structure"
    
    result = validate_output(good_theory, content_type="theory")
    print(f"Good theory test: is_valid={result['is_valid']}, score={result['score']}")
    
    result = validate_output(bad_theory, content_type="theory")
    print(f"Bad theory test: is_valid={result['is_valid']}, score={result['score']}")
    print(f"Feedback: {result['feedback']}")
    
    print("\n" + "=" * 60)
    print("✅ Validation system ready!")
    print("📝 TODO: Add API keys to Config class for LLM features")
    print("=" * 60)

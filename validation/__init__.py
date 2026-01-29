"""
Content Validation & Evaluation System
Part 4 of CoursePilot AI Learning Platform
"""

from .validator import (
    # Main pipeline
    validate_output,
    
    # Code validation
    validate_python_code,
    validate_javascript_code,
    validate_code,
    
    # Text validation
    check_formatting,
    check_code_formatting,
    
    # Content validator class
    ContentValidator,
    
    # Quick validators
    quick_validate_code,
    quick_validate_text,
    
    # Data classes
    ValidationResult,
    ValidationType,
    
    # Config
    Config
)

__version__ = "1.0.0"
__all__ = [
    'validate_output',
    'validate_python_code',
    'validate_javascript_code', 
    'validate_code',
    'check_formatting',
    'check_code_formatting',
    'ContentValidator',
    'quick_validate_code',
    'quick_validate_text',
    'ValidationResult',
    'ValidationType',
    'Config'
]

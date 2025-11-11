"""
Logger Utility
Simple logging functions for Lambda
"""


def log_info(message: str):
    """Log info message to CloudWatch"""
    print(f"[INFO] {message}")


def log_error(message: str):
    """Log error message to CloudWatch"""
    print(f"[ERROR] {message}")
"""
Unified Main Entry Point for MCA-FARGATE Processing
Routes to the appropriate processor based on JOB_TYPE environment variable

Supported Job Types:
- auditors-report-processing (or auditors-report)
- aoc4-processing (or aoc4)
- directors-report-processing (or directors-report)
"""

import os
import sys
import subprocess
from datetime import datetime

# Add app to path for utils import
sys.path.insert(0, '/app')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Utils
from utils.logger import log_info, log_error as log_err


# Job type to processor file mapping - matches your actual file names
JOB_PROCESSOR_FILES = {
    'auditors-report': 'jobs/auditors-report-processing/job_auditors_report.py',
    'auditors-report-processing': 'jobs/auditors-report-processing/job_auditors_report.py',
    'aoc4': 'jobs/aoc4-processing/job_aoc4.py',
    'aoc4-processing': 'jobs/aoc4-processing/job_aoc4.py',
    'directors-report': 'jobs/directors-report-processing/job_directors_report.py',
    'directors-report-processing': 'jobs/directors-report-processing/job_directors_report.py',
}


def main():
    """
    Main entry point for Fargate container
    Routes to appropriate processor based on JOB_TYPE
    """
    
    log_info("=" * 80)
    log_info("MCA-FARGATE UNIFIED PROCESSOR STARTING")
    log_info(f"Timestamp: {datetime.now().isoformat()}")
    log_info("=" * 80)
    
    # Determine job type
    job_type = os.environ.get('JOB_TYPE', '').lower()
    
    if not job_type:
        log_err("ERROR: JOB_TYPE environment variable is required")
        log_err("")
        log_err("Supported job types:")
        for job in sorted(set(JOB_PROCESSOR_FILES.keys())):
            log_err(f"  - {job}")
        sys.exit(1)
    
    log_info(f"Job Type: {job_type}")
    
    # Get the appropriate processor file
    processor_file = JOB_PROCESSOR_FILES.get(job_type)
    
    if not processor_file:
        log_err(f"ERROR: Unknown JOB_TYPE: '{job_type}'")
        log_err("")
        log_err("Supported job types:")
        for job in sorted(set(JOB_PROCESSOR_FILES.keys())):
            log_err(f"  - {job}")
        sys.exit(1)
    
    # Check if processor file exists
    if not os.path.exists(processor_file):
        log_err(f"ERROR: Processor file not found: {processor_file}")
        log_err(f"Looking for file at: {os.path.abspath(processor_file)}")
        sys.exit(1)
    
    # Get parameters from environment variables or command line
    if len(sys.argv) > 1:
        # Command line arguments provided
        log_info("Parameters provided via command line arguments")
        log_info(f"Will be passed to processor: {' '.join(sys.argv[1:])}")
        
        # Run the processor with CLI args
        cmd = [sys.executable, processor_file] + sys.argv[1:]
    else:
        # Use environment variables
        log_info("Parameters will be read from environment variables by processor")
        
        bucket = os.environ.get('BUCKET_NAME')

        document_key = os.environ.get('DOCUMENT_KEY')
        template_key = os.environ.get('TEMPLATE_KEY')

        # Auto-map job-specific keys if generic ones are missing
        if not document_key or not template_key:
            if job_type.startswith('auditors'):
                document_key = os.environ.get('AUDITORS_DOCUMENT_KEY')
                template_key = os.environ.get('AUDITORS_TEMPLATE_KEY')
            elif job_type.startswith('aoc4'):
                document_key = os.environ.get('AOC4_DOCUMENT_KEY')
                template_key = os.environ.get('AOC4_TEMPLATE_KEY')
            elif job_type.startswith('directors'):
                document_key = os.environ.get('DIRECTORS_DOCUMENT_KEY')
                template_key = os.environ.get('DIRECTORS_TEMPLATE_KEY')

        
        if not all([bucket, document_key, template_key]):
            log_err("Missing required environment variables:")
            log_err("  - BUCKET_NAME")
            log_err("  - DOCUMENT_KEY")
            log_err("  - TEMPLATE_KEY")
            log_err("  - JOB_TYPE")
            sys.exit(1)
        
        log_info(f"Parameters:")
        log_info(f"  Bucket: {bucket}")
        log_info(f"  Document Key: {document_key}")
        log_info(f"  Template Key: {template_key}")

        # Inject resolved parameters into the subprocess environment
        os.environ["BUCKET_NAME"] = bucket
        os.environ["DOCUMENT_KEY"] = document_key
        os.environ["TEMPLATE_KEY"] = template_key

        # Run the processor (it will read from env vars)
        cmd = [sys.executable, processor_file]

    
    log_info(f"Executing processor: {processor_file}")
    try:
        log_info(f"Starting subprocess: {' '.join(cmd)}")
        
        # Ensure PYTHONPATH includes /app
        env = os.environ.copy()
        current_pythonpath = env.get('PYTHONPATH', '')
        if current_pythonpath:
            env['PYTHONPATH'] = f"/app:{current_pythonpath}"
        else:
            env['PYTHONPATH'] = '/app'
        
        # Run without capturing - let output stream directly
        result = subprocess.run(cmd, check=False, env=env)
        exit_code = result.returncode
        
        log_info("")
        log_info("=" * 80)
        if exit_code == 0:
            log_info("✓ Job completed successfully")
            sys.exit(0)
        else:
            log_err(f"✗ Job failed with exit code {exit_code}")
            sys.exit(exit_code)
            
    except Exception as e:
        log_err(f"✗ Fatal error executing processor: {str(e)}")
        import traceback
        log_err(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    main()
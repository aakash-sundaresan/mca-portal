# MCA Portal - S3 Upload & Display

A simple vanilla JavaScript application for uploading files to and browsing files from AWS S3 buckets using Amplify environment variables.

## Features

- **File Upload**: Drag & drop or click to upload files to S3
- **S3 Browser**: Navigate through S3 buckets and folders
- **File Viewer**: View text files, JSON files, and images directly in the browser
- **AWS Integration**: Uses environment variables from AWS Amplify
- **File Download**: Download files from S3 to your local machine

## Project Structure

```
mca-portal/
├── index.html         # Main HTML file
├── style.css          # CSS styles
├── script.js          # JavaScript application
└── package.json       # Project configuration
```

## Getting Started

1. **Open the application**:
   - Simply open `index.html` in your web browser, or
   - Use a local server: `npm start` (Python) or `npm run serve` (Node.js)

2. **Set up environment variables in Amplify**:
   - `AWS_REGION`: Your AWS region (e.g., us-east-1)
   - `S3_BUCKET_NAME`: Your S3 bucket name
   - AWS credentials are automatically provided by Amplify

3. **Use the application**:
   - **Upload**: Drag & drop files or click the upload area (uploads to `auditors-report/uploads/`)
   - **Browse Results**: View processed JSON results from `auditors-report/json/`
   - **Check Results**: Use "Check for Results" button after uploading to see new processed files
   - **View Files**: Click on JSON files to view their contents

## Supported File Types

- **Text files**: .txt, .md, .csv, .log, .html, .css, .js, .xml, .yaml, .yml
- **JSON files**: .json (with syntax highlighting)
- **Images**: .jpg, .jpeg, .png, .gif, .bmp, .webp, .svg
- **Other files**: Download-only for binary files

## Workflow

1. **Upload**: Files are uploaded to `bucket/auditors-report/uploads/`
2. **Processing**: Your backend processes the uploaded files
3. **Results**: Processed JSON results are saved to `bucket/auditors-report/json/`
4. **Display**: Use the browser to view the JSON results

## Environment Variables

The application expects these environment variables to be set in AWS Amplify:

- `AWS_REGION`: Your AWS region (e.g., us-east-1)
- `S3_BUCKET_NAME`: The name of your S3 bucket

AWS credentials are automatically provided by Amplify's execution environment.

## Available Scripts

- `npm start` - Start a Python HTTP server on port 8000
- `npm run serve` - Start a Node.js HTTP server (requires npx serve)

## Browser Compatibility

This application works in all modern browsers that support:
- ES6 classes and async/await
- Fetch API
- Local Storage
- AWS SDK for JavaScript v2
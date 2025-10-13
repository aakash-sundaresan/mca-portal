// MCA Portal - S3 Upload & Display with Amplify Environment Variables
class S3Portal {
    constructor() {
        this.s3 = null;
        this.selectedFile = null;
        this.currentPath = 'auditors-report/json/';
        this.pathHistory = [];
        this.uploadPath = 'auditors-report/uploads/';
        this.resultsPath = 'auditors-report/json/';
        this.pollingInterval = null;
        this.uploadedFileName = null;
        
        this.initializeEventListeners();
        this.initializeAWS();
    }

    initializeEventListeners() {
        // Upload functionality
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        uploadBtn.addEventListener('click', this.uploadFile.bind(this));
        
        // Browser controls
        document.getElementById('navigateBtn').addEventListener('click', () => this.navigateToPath());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshCurrentPath());
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('goToResults').addEventListener('click', () => this.goToResults());
        document.getElementById('refreshResults').addEventListener('click', () => this.checkForResults());
        
        // Viewer controls
        document.getElementById('closeViewer').addEventListener('click', () => this.closeViewer());
        
        // Enter key navigation
        document.getElementById('currentPath').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigateToPath();
            }
        });
    }

    initializeAWS() {
        try {
            // Get environment variables injected by Amplify
            const bucketName = '%%S3_BUCKET_NAME%%';
            const region = '%%REGION%%' || 'us-east-2';
            const accessKeyId = '%%ACCESS_KEY_ID%%';
            const secretAccessKey = '%%SECRET_ACCESS_KEY%%';

            // Store bucket name for later use
            this.bucketName = bucketName;

            // Configure AWS SDK
            AWS.config.update({
                region: region,
                credentials: new AWS.Credentials({
                    accessKeyId: accessKeyId,
                    secretAccessKey: secretAccessKey
                })
            });

            this.s3 = new AWS.S3();
            
            console.log('AWS SDK initialized successfully');
            console.log('Bucket:', bucketName);
            console.log('Region:', region);
            
            // Load results directory on startup
            this.listObjects(this.resultsPath);
            
        } catch (error) {
            console.error('Error initializing AWS:', error);
            this.showMessage('Error initializing AWS SDK: ' + error.message, 'error');
        }
    }

    // Upload functionality
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.selectFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.selectFile(files[0]);
        }
    }

    selectFile(file) {
        this.selectedFile = file;
        
        // Update UI
        document.getElementById('uploadText').textContent = file.name;
        document.getElementById('uploadSubtext').textContent = `Size: ${this.formatFileSize(file.size)}`;
        document.getElementById('uploadBtn').disabled = false;
        
        this.showMessage('File selected: ' + file.name, 'success');
    }

    async uploadFile() {
        if (!this.selectedFile) {
            this.showMessage('Please select a file to upload', 'error');
            return;
        }

        const uploadBtn = document.getElementById('uploadBtn');
        const uploadProgress = document.getElementById('uploadProgress');
        
        uploadBtn.disabled = true;
        uploadProgress.style.display = 'block';

        try {
            const fileName = this.selectedFile.name;
            const key = `${this.uploadPath}${fileName}`;
            
            const params = {
                Bucket: this.bucketName,
                Key: key,
                Body: this.selectedFile,
                ContentType: this.selectedFile.type || 'application/octet-stream'
            };

            // Upload with progress tracking
            const upload = this.s3.upload(params);
            
            upload.on('httpUploadProgress', (progress) => {
                const percentage = Math.round((progress.loaded / progress.total) * 100);
                document.querySelector('.progress-text').textContent = `Uploading... ${percentage}%`;
            });

            const result = await upload.promise();
            
            console.log('Upload successful:', result);
            this.showMessage('File uploaded successfully! Processing may take a few minutes...', 'success');
            
            // Show upload status and start polling
            document.getElementById('uploadStatus').style.display = 'block';
            
            // Store uploaded filename for polling
            this.uploadedFileName = fileName;
            
            // Reset upload UI
            this.resetUploadUI();
            
            // Start polling for results (check every 10 seconds)
            this.startPollingForResults(fileName);
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage('Upload failed: ' + error.message, 'error');
        } finally {
            uploadProgress.style.display = 'none';
        }
    }

    startPollingForResults(uploadedFileName) {
        // Clear any existing polling
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        let pollCount = 0;
        const maxPolls = 36; // Poll for 6 minutes (36 * 10 seconds)
        
        this.showMessage('Checking for results every 10 seconds...', 'info');
        
        this.pollingInterval = setInterval(async () => {
            pollCount++;
            
            try {
                // Look for a JSON file with the same base name
                const baseFileName = uploadedFileName.replace(/\.[^/.]+$/, '');
                const jsonKey = `${this.resultsPath}${baseFileName}.json`;
                
                console.log(`Polling attempt ${pollCount}/${maxPolls} - Looking for: ${jsonKey}`);
                
                const exists = await this.checkFileExists(jsonKey);
                
                if (exists) {
                    clearInterval(this.pollingInterval);
                    this.pollingInterval = null;
                    this.showMessage('✅ Processing complete! Result file found.', 'success');
                    document.getElementById('uploadStatus').style.display = 'none';
                    
                    // Refresh the results view
                    this.goToResults();
                    
                    // Optionally auto-open the file after a short delay
                    setTimeout(() => {
                        this.viewFile(jsonKey, `${baseFileName}.json`, 'json');
                    }, 500);
                }
                
            } catch (error) {
                console.error('Error checking for results:', error);
            }
            
            // Stop polling after max attempts
            if (pollCount >= maxPolls) {
                clearInterval(this.pollingInterval);
                this.pollingInterval = null;
                this.showMessage('⏱️ Polling stopped after 6 minutes. Please check manually for results.', 'info');
                document.getElementById('uploadStatus').style.display = 'none';
            }
        }, 10000); // Check every 10 seconds
    }

    async checkFileExists(key) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: key
            };
            
            await this.s3.headObject(params).promise();
            return true;
        } catch (error) {
            if (error.code === 'NotFound' || error.code === '404') {
                return false;
            }
            console.error('Error checking file:', error);
            return false;
        }
    }

    resetUploadUI() {
        this.selectedFile = null;
        document.getElementById('uploadText').textContent = 'Click to select a file or drag and drop';
        document.getElementById('uploadSubtext').textContent = 'Supported formats: PDF, DOC, DOCX, TXT, etc.';
        document.getElementById('uploadBtn').disabled = true;
        document.getElementById('fileInput').value = '';
    }

    // File browser functionality
    async navigateToPath() {
        const path = document.getElementById('currentPath').value.trim();
        this.navigateToPathDirect(path);
    }

    navigateToPathDirect(path) {
        if (path === this.currentPath) {
            return;
        }

        // Add current path to history
        if (this.currentPath) {
            this.pathHistory.push(this.currentPath);
        }

        this.currentPath = path;
        document.getElementById('currentPath').value = path;
        this.listObjects(path);
    }

    goBack() {
        if (this.pathHistory.length > 0) {
            const previousPath = this.pathHistory.pop();
            this.currentPath = previousPath;
            document.getElementById('currentPath').value = previousPath;
            this.listObjects(previousPath);
        } else {
            this.navigateToPathDirect('');
        }
    }

    refreshCurrentPath() {
        this.listObjects(this.currentPath);
    }

    goToResults() {
        this.navigateToPathDirect(this.resultsPath);
    }

    checkForResults() {
        this.listObjects(this.resultsPath);
        this.showMessage('Checking for new results...', 'info');
    }

    async listObjects(prefix) {
        if (!this.s3) {
            this.showMessage('AWS not initialized', 'error');
            return;
        }

        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '<div class="file-item"><div class="loading"></div>Loading...</div>';

        try {
            const params = {
                Bucket: this.bucketName,
                Prefix: prefix,
                Delimiter: '/'
            };

            const data = await this.s3.listObjectsV2(params).promise();
            fileList.innerHTML = '';

            // Add parent directory link if not at root
            if (prefix && prefix !== '') {
                const parentPath = prefix.split('/').slice(0, -2).join('/') + (prefix.split('/').length > 2 ? '/' : '');
                this.addFileItem(fileList, '..', parentPath, 'folder', null, true);
            }

            // Add folders
            if (data.CommonPrefixes) {
                data.CommonPrefixes.forEach(prefixObj => {
                    const folderName = prefixObj.Prefix.replace(prefix, '').replace(/\/$/, '');
                    this.addFileItem(fileList, folderName, prefixObj.Prefix, 'folder', null, false);
                });
            }

            // Add files
            if (data.Contents) {
                data.Contents.forEach(object => {
                    if (object.Key === prefix || object.Key.endsWith('/')) {
                        return;
                    }
                    
                    const fileName = object.Key.split('/').pop();
                    const fileType = this.getFileType(fileName);
                    this.addFileItem(fileList, fileName, object.Key, fileType, object.Size, false);
                });
            }

            if (fileList.innerHTML === '') {
                fileList.innerHTML = '<div class="file-item"><div class="file-info"><div class="file-name">No files found in this directory</div></div></div>';
            }

        } catch (error) {
            console.error('Error listing objects:', error);
            fileList.innerHTML = '<div class="file-item"><div class="file-info"><div class="file-name" style="color: red;">Error loading files: ' + error.message + '</div></div></div>';
            this.showMessage('Error loading files: ' + error.message, 'error');
        }
    }

    addFileItem(container, name, key, type, size, isParent) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const icon = this.getFileIcon(type, name);
        const sizeText = size ? this.formatFileSize(size) : '';
        
        fileItem.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="file-info">
                <div class="file-name">${name}</div>
                <div class="file-meta">${isParent ? 'Parent Directory' : key}</div>
            </div>
            <div class="file-size">${sizeText}</div>
        `;

        fileItem.addEventListener('click', () => {
            if (type === 'folder' || isParent) {
                this.navigateToPathDirect(key);
            } else {
                this.viewFile(key, name, type);
            }
        });

        container.appendChild(fileItem);
    }

    getFileIcon(type, fileName) {
        if (type === 'folder') {
            return '📁';
        }
        
        const extension = fileName.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': '📄',
            'doc': '📝', 'docx': '📝',
            'txt': '📄',
            'json': '📋',
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
            'zip': '📦', 'rar': '📦', '7z': '📦',
            'mp4': '🎥', 'avi': '🎥', 'mov': '🎥',
            'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
            'xlsx': '📊', 'xls': '📊', 'csv': '📊'
        };
        
        return iconMap[extension] || '📄';
    }

    getFileType(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        return extension || 'unknown';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // File viewer functionality
    async viewFile(key, name, type) {
        const viewerSection = document.querySelector('.viewer-section');
        const currentFile = document.getElementById('currentFile');
        const fileContent = document.getElementById('fileContent');
        
        currentFile.textContent = name;
        viewerSection.style.display = 'block';
        
        fileContent.innerHTML = '<div class="loading"></div>Loading file...';

        try {
            const params = {
                Bucket: this.bucketName,
                Key: key
            };

            const data = await this.s3.getObject(params).promise();
            
            if (type === 'json' || name.toLowerCase().endsWith('.json')) {
                this.displayJsonFile(data.Body.toString(), key);
            } else if (type === 'txt' || name.toLowerCase().endsWith('.txt')) {
                this.displayTextFile(data.Body.toString(), key);
            } else if (this.isImageType(name)) {
                this.displayImageFile(data.Body, data.ContentType, key);
            } else if (this.isTextType(name)) {
                this.displayTextFile(data.Body.toString(), key);
            } else {
                this.displayBinaryFile(name, data.Body, key);
            }

        } catch (error) {
            console.error('Error viewing file:', error);
            fileContent.innerHTML = '<div class="error">Error loading file: ' + error.message + '</div>';
            this.showMessage('Error loading file: ' + error.message, 'error');
        }
    }

    displayJsonFile(content, key) {
        try {
            const jsonData = JSON.parse(content);
            const formatted = JSON.stringify(jsonData, null, 2);
            const escapedContent = content.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
            
            document.getElementById('fileContent').innerHTML = `
                <div class="json-viewer">
                    <pre><code>${this.escapeHtml(formatted)}</code></pre>
                </div>
                <div style="margin-top: 15px;">
                    <button class="btn btn-primary" onclick="s3Portal.copyToClipboard(\`${content.replace(/`/g, '\\`')}\`)">
                        📋 Copy JSON
                    </button>
                    <button class="btn btn-secondary" onclick="s3Portal.downloadFile('${key}')">
                        💾 Download
                    </button>
                </div>
            `;
        } catch (error) {
            document.getElementById('fileContent').innerHTML = `
                <div class="error">Invalid JSON format: ${error.message}</div>
                <pre>${this.escapeHtml(content)}</pre>
            `;
        }
    }

    displayTextFile(content, key) {
        document.getElementById('fileContent').innerHTML = `
            <pre style="white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px;">${this.escapeHtml(content)}</pre>
            <div style="margin-top: 15px;">
                <button class="btn btn-secondary" onclick="s3Portal.downloadFile('${key}')">
                    💾 Download
                </button>
            </div>
        `;
    }

    displayImageFile(content, contentType, key) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        document.getElementById('fileContent').innerHTML = `
            <div style="text-align: center;">
                <img src="${url}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <div style="margin-top: 15px; text-align: center;">
                <button class="btn btn-secondary" onclick="s3Portal.downloadFile('${key}')">
                    💾 Download
                </button>
            </div>
        `;
    }

    displayBinaryFile(name, content, key) {
        document.getElementById('fileContent').innerHTML = `
            <div class="info" style="text-align: center; padding: 30px;">
                <h3>Binary File: ${name}</h3>
                <p style="margin: 20px 0;">This is a binary file that cannot be displayed in the browser.</p>
                <div style="margin-top: 15px;">
                    <button class="btn btn-primary" onclick="s3Portal.downloadFile('${key}')">
                        💾 Download
                    </button>
                </div>
            </div>
        `;
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showMessage('JSON copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showMessage('Failed to copy to clipboard', 'error');
        });
    }

    async downloadFile(key) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: key
            };

            const data = await this.s3.getObject(params).promise();
            const blob = new Blob([data.Body], { type: data.ContentType });
            const url = URL.createObjectURL(blob);
            
            const fileName = key.split('/').pop();
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('File download started', 'success');
        } catch (error) {
            console.error('Error downloading file:', error);
            this.showMessage('Error downloading file: ' + error.message, 'error');
        }
    }

    closeViewer() {
        document.querySelector('.viewer-section').style.display = 'none';
        document.getElementById('fileContent').innerHTML = '';
    }

    isImageType(fileName) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const extension = fileName.split('.').pop().toLowerCase();
        return imageExtensions.includes(extension);
    }

    isTextType(fileName) {
        const textExtensions = ['txt', 'md', 'csv', 'log', 'html', 'css', 'js', 'xml', 'yaml', 'yml'];
        const extension = fileName.split('.').pop().toLowerCase();
        return textExtensions.includes(extension);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type = 'info') {
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type} show`;
        
        setTimeout(() => {
            statusMessage.classList.remove('show');
        }, 5000);
    }
}

// Initialize the application
let s3Portal;
document.addEventListener('DOMContentLoaded', () => {
    s3Portal = new S3Portal();
});
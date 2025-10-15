// MCA Portal - S3 Upload & Display with Document Type Selection
class S3Portal {
    constructor() {
        this.s3 = null;
        this.selectedFile = null;
        this.currentPath = 'auditors-report/json/';
        this.pathHistory = [];
        this.documentType = 'auditors-report'; // Default document type
        this.uploadPath = 'auditors-report/uploads/';
        this.resultsPath = 'auditors-report/json/';
        this.pollingInterval = null;
        this.uploadedFileName = null;
        
        this.initializeEventListeners();
        this.initializeAWS();
    }

    initializeEventListeners() {
        // Document type selection
        const docTypeRadios = document.querySelectorAll('input[name="docType"]');
        docTypeRadios.forEach(radio => {
            radio.addEventListener('change', this.handleDocumentTypeChange.bind(this));
        });

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

    handleDocumentTypeChange(e) {
        this.documentType = e.target.value;
        
        // Update paths based on selected document type
        this.uploadPath = `${this.documentType}/uploads/`;
        this.resultsPath = `${this.documentType}/json/`;
        
        // Update UI to show current paths
        document.getElementById('uploadPath').textContent = `bucket/${this.uploadPath}`;
        document.getElementById('resultsPath').textContent = `bucket/${this.resultsPath}`;
        document.getElementById('currentPathDisplay').textContent = `bucket/${this.resultsPath}`;
        
        // Navigate to the results path for the selected document type
        this.navigateToPathDirect(this.resultsPath);
        
        // Update the path input field
        document.getElementById('currentPath').value = this.resultsPath;
        
        this.showMessage(`Switched to ${this.documentType === 'auditors-report' ? "Auditor's Report" : 'AOC-4'}`, 'success');
    }

    initializeAWS() {
        try {
            let bucketName, region, accessKeyId, secretAccessKey;
            
            // Check if local config exists (for local development)
            if (window.AWS_CONFIG) {
                console.log('Using local AWS_CONFIG');
                bucketName = window.AWS_CONFIG.bucketName;
                region = window.AWS_CONFIG.region;
                accessKeyId = window.AWS_CONFIG.accessKeyId;
                secretAccessKey = window.AWS_CONFIG.secretAccessKey;
            } else {
                // Use environment variables injected by Amplify
                bucketName = '%%S3_BUCKET_NAME%%';
                region = '%%REGION%%' || 'us-east-1';
                accessKeyId = '%%ACCESS_KEY_ID%%';
                secretAccessKey = '%%SECRET_ACCESS_KEY%%';
            }

            // Validate environment variables
            console.log('=== AWS Configuration Debug ===');
            console.log('Bucket Name:', bucketName);
            console.log('Region:', region);
            console.log('Access Key ID (first 8 chars):', accessKeyId ? accessKeyId.substring(0, 8) + '...' : 'NOT SET');
            console.log('Secret Key (last 4 chars):', secretAccessKey ? '***' + secretAccessKey.substring(secretAccessKey.length - 4) : 'NOT SET');
            console.log('Has %% in bucket?', bucketName.includes('%%'));
            console.log('Has %% in accessKey?', accessKeyId.includes('%%'));
            
            if (!bucketName || bucketName.includes('%%')) {
                throw new Error('S3_BUCKET_NAME not properly configured. For local development, create config.local.js file.');
            }
            
            if (!accessKeyId || accessKeyId.includes('%%')) {
                throw new Error('AWS_ACCESS_KEY_ID not properly configured. For local development, create config.local.js file.');
            }
            
            if (!secretAccessKey || secretAccessKey.includes('%%')) {
                throw new Error('AWS_SECRET_ACCESS_KEY not properly configured. For local development, create config.local.js file.');
            }

            // Store bucket name for later use
            this.bucketName = bucketName;

            // Configure AWS SDK with explicit credentials
            AWS.config.update({
                region: region,
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
                signatureVersion: 'v4'
            });

            this.s3 = new AWS.S3({
                region: region,
                credentials: new AWS.Credentials(accessKeyId, secretAccessKey)
            });
            
            console.log('✅ AWS SDK initialized successfully');
            console.log('Ready to connect to bucket:', bucketName);
            
            // Load results directory on startup
            this.listObjects(this.resultsPath);
            
        } catch (error) {
            console.error('❌ Error initializing AWS:', error);
            this.showMessage('Error initializing AWS SDK: ' + error.message, 'error');
            
            const fileList = document.getElementById('fileList');
            fileList.innerHTML = `
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-name" style="color: red;">AWS Configuration Error</div>
                        <div class="file-meta">${error.message}</div>
                        <div class="file-meta" style="margin-top: 10px;">
                            Please check:
                            <ul style="margin-top: 5px; padding-left: 20px;">
                                <li>S3_BUCKET_NAME is set in Amplify</li>
                                <li>AWS_REGION is set in Amplify</li>
                                <li>AWS_ACCESS_KEY_ID is set in Amplify</li>
                                <li>AWS_SECRET_ACCESS_KEY is set in Amplify</li>
                                <li>IAM user has S3 permissions</li>
                                <li>For local: create config.local.js</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
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
            
            console.log('Starting upload...');
            console.log('Document Type:', this.documentType);
            console.log('Bucket:', this.bucketName);
            console.log('Key:', key);
            console.log('File size:', this.selectedFile.size);
            
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
                console.log(`Upload progress: ${percentage}%`);
            });

            const result = await upload.promise();
            
            console.log('Upload successful:', result);
            this.showMessage(`File uploaded successfully to ${this.documentType}! Processing may take a few minutes...`, 'success');
            
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
            console.error('Upload error details:', {
                code: error.code,
                message: error.message,
                statusCode: error.statusCode,
                name: error.name,
                requestId: error.requestId
            });
            
            let errorMessage = error.message || error.code || 'Unknown error';
            
            if (error.code === 'NoSuchBucket') {
                errorMessage = `Bucket "${this.bucketName}" does not exist`;
            } else if (error.code === 'AccessDenied' || error.statusCode === 403) {
                errorMessage = 'Access denied. Check IAM permissions for s3:PutObject';
            } else if (error.code === 'InvalidAccessKeyId') {
                errorMessage = 'Invalid AWS Access Key ID';
            } else if (error.code === 'SignatureDoesNotMatch') {
                errorMessage = 'AWS Secret Key is incorrect';
            }
            
            this.showMessage('Upload failed: ' + errorMessage, 'error');
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
        document.getElementById('currentPathDisplay').textContent = `bucket/${path}`;
        this.listObjects(path);
    }

    goBack() {
        if (this.pathHistory.length > 0) {
            const previousPath = this.pathHistory.pop();
            this.currentPath = previousPath;
            document.getElementById('currentPath').value = previousPath;
            document.getElementById('currentPathDisplay').textContent = `bucket/${previousPath}`;
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
            console.log('Listing objects in:', this.bucketName + '/' + prefix);
            
            const params = {
                Bucket: this.bucketName,
                Prefix: prefix,
                Delimiter: '/'
            };

            const data = await this.s3.listObjectsV2(params).promise();
            
            console.log('List response:', {
                prefix: data.Prefix,
                fileCount: data.Contents ? data.Contents.length : 0,
                folderCount: data.CommonPrefixes ? data.CommonPrefixes.length : 0
            });
            
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
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                statusCode: error.statusCode,
                bucket: this.bucketName,
                prefix: prefix,
                requestId: error.requestId
            });
            
            let errorMessage = error.message;
            
            // Provide more specific error messages
            if (error.code === 'NoSuchBucket') {
                errorMessage = `Bucket "${this.bucketName}" does not exist or is not accessible`;
            } else if (error.code === 'AccessDenied' || error.statusCode === 403) {
                errorMessage = `Access denied to bucket "${this.bucketName}". Check IAM permissions for s3:ListBucket.`;
            } else if (error.code === 'InvalidAccessKeyId') {
                errorMessage = 'Invalid AWS Access Key ID. Check your credentials.';
            } else if (error.code === 'SignatureDoesNotMatch') {
                errorMessage = 'AWS Secret Key is incorrect. Check your credentials.';
            } else if (error.code === 'CredentialsError') {
                errorMessage = 'AWS credentials not properly configured.';
            }
            
            fileList.innerHTML = `
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-name" style="color: red;">Error loading files</div>
                        <div class="file-meta">${errorMessage}</div>
                        <div class="file-meta" style="margin-top: 10px;">
                            <strong>Troubleshooting:</strong><br>
                            • Verify bucket name: ${this.bucketName}<br>
                            • Check IAM user has s3:ListBucket permission<br>
                            • Verify credentials are correct<br>
                            • Check bucket region matches AWS_REGION<br>
                            • Ensure CORS is configured on bucket
                        </div>
                    </div>
                </div>
            `;
            this.showMessage('Error loading files: ' + errorMessage, 'error');
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
            const escapedContent = content.replace(/`/g, '\\`');
            
            // Generate tabular view
            const tableHtml = this.generateJsonTable(jsonData);
            
            document.getElementById('fileContent').innerHTML = `
                <div class="json-display-controls">
                    <button class="btn btn-secondary" id="viewToggle" onclick="s3Portal.toggleJsonView()">
                        <span id="viewToggleText">📊 Switch to Raw JSON</span>
                    </button>
                    <button class="btn btn-primary" onclick="s3Portal.copyToClipboard(\`${escapedContent}\`)">
                        📋 Copy JSON
                    </button>
                    <button class="btn btn-secondary" onclick="s3Portal.downloadFile('${key}')">
                        💾 Download
                    </button>
                </div>
                <div id="jsonTableView" class="json-table-view">
                    ${tableHtml}
                </div>
                <div id="jsonRawView" class="json-raw-view" style="display: none;">
                    <pre><code>${this.escapeHtml(JSON.stringify(jsonData, null, 2))}</code></pre>
                </div>
            `;
        } catch (error) {
            document.getElementById('fileContent').innerHTML = `
                <div class="error-message">
                    <h3>❌ Invalid JSON Format</h3>
                    <p>${error.message}</p>
                </div>
                <pre class="error-content">${this.escapeHtml(content)}</pre>
            `;
        }
    }

    toggleJsonView() {
        const tableView = document.getElementById('jsonTableView');
        const rawView = document.getElementById('jsonRawView');
        const toggleText = document.getElementById('viewToggleText');
        
        if (tableView.style.display === 'none') {
            tableView.style.display = 'block';
            rawView.style.display = 'none';
            toggleText.textContent = '📊 Switch to Raw JSON';
        } else {
            tableView.style.display = 'none';
            rawView.style.display = 'block';
            toggleText.textContent = '📋 Switch to Table View';
        }
    }

    generateJsonTable(data, depth = 0) {
        if (Array.isArray(data)) {
            return this.generateArrayTable(data, depth);
        } else if (typeof data === 'object' && data !== null) {
            return this.generateObjectTable(data, depth);
        } else {
            return `<div class="json-primitive">${this.formatValue(data)}</div>`;
        }
    }

    generateObjectTable(obj, depth = 0) {
        const entries = Object.entries(obj);
        
        if (entries.length === 0) {
            return '<div class="json-empty">Empty Object</div>';
        }

        let html = '<table class="json-table">';
        html += '<thead><tr><th class="json-table-key">Key</th><th class="json-table-value">Value</th></tr></thead>';
        html += '<tbody>';

        for (const [key, value] of entries) {
            html += '<tr>';
            html += `<td class="json-table-key"><span class="key-badge">${this.escapeHtml(key)}</span></td>`;
            html += '<td class="json-table-value">';
            
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    html += '<span class="value-empty">Empty Array</span>';
                } else if (this.isSimpleArray(value)) {
                    html += `<span class="value-array">${value.map(v => this.formatValue(v)).join(', ')}</span>`;
                } else {
                    html += this.generateArrayTable(value, depth + 1);
                }
            } else if (typeof value === 'object' && value !== null) {
                if (Object.keys(value).length === 0) {
                    html += '<span class="value-empty">Empty Object</span>';
                } else if (depth < 2) {
                    html += this.generateObjectTable(value, depth + 1);
                } else {
                    html += `<details class="json-collapsible"><summary>View nested object (${Object.keys(value).length} keys)</summary>${this.generateObjectTable(value, depth + 1)}</details>`;
                }
            } else {
                html += this.formatValue(value);
            }
            
            html += '</td>';
            html += '</tr>';
        }

        html += '</tbody></table>';
        return html;
    }

    generateArrayTable(arr, depth = 0) {
        if (arr.length === 0) {
            return '<div class="json-empty">Empty Array</div>';
        }

        // Check if array contains objects with similar structure
        if (arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
            return this.generateArrayOfObjectsTable(arr, depth);
        }

        // Simple array
        let html = '<div class="json-array-container">';
        arr.forEach((item, index) => {
            html += `<div class="json-array-item">`;
            html += `<span class="array-index">[${index}]</span>`;
            
            if (typeof item === 'object' && item !== null) {
                html += this.generateJsonTable(item, depth + 1);
            } else {
                html += this.formatValue(item);
            }
            html += '</div>';
        });
        html += '</div>';
        
        return html;
    }

    generateArrayOfObjectsTable(arr, depth = 0) {
        // Get all unique keys from all objects
        const allKeys = new Set();
        arr.forEach(obj => {
            Object.keys(obj).forEach(key => allKeys.add(key));
        });

        const keys = Array.from(allKeys);

        let html = '<table class="json-table json-array-table">';
        html += '<thead><tr>';
        html += '<th class="json-table-index">#</th>';
        keys.forEach(key => {
            html += `<th class="json-table-key">${this.escapeHtml(key)}</th>`;
        });
        html += '</tr></thead>';
        html += '<tbody>';

        arr.forEach((obj, index) => {
            html += '<tr>';
            html += `<td class="json-table-index">${index + 1}</td>`;
            
            keys.forEach(key => {
                html += '<td class="json-table-value">';
                const value = obj[key];
                
                if (value === undefined) {
                    html += '<span class="value-undefined">—</span>';
                } else if (typeof value === 'object' && value !== null) {
                    if (Array.isArray(value)) {
                        if (value.length === 0) {
                            html += '<span class="value-empty">[]</span>';
                        } else if (this.isSimpleArray(value)) {
                            html += `<span class="value-array">${value.map(v => this.formatValue(v)).join(', ')}</span>`;
                        } else {
                            html += `<details class="json-collapsible"><summary>View array (${value.length} items)</summary>${this.generateArrayTable(value, depth + 1)}</details>`;
                        }
                    } else {
                        if (Object.keys(value).length === 0) {
                            html += '<span class="value-empty">{}</span>';
                        } else {
                            html += `<details class="json-collapsible"><summary>View object (${Object.keys(value).length} keys)</summary>${this.generateObjectTable(value, depth + 1)}</details>`;
                        }
                    }
                } else {
                    html += this.formatValue(value);
                }
                html += '</td>';
            });
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    isSimpleArray(arr) {
        if (arr.length > 10) return false;
        return arr.every(item => {
            const type = typeof item;
            return type === 'string' || type === 'number' || type === 'boolean' || item === null;
        });
    }

    formatValue(value) {
        if (value === null) {
            return '<span class="value-null">null</span>';
        } else if (value === undefined) {
            return '<span class="value-undefined">undefined</span>';
        } else if (typeof value === 'boolean') {
            return `<span class="value-boolean">${value}</span>`;
        } else if (typeof value === 'number') {
            return `<span class="value-number">${value}</span>`;
        } else if (typeof value === 'string') {
            // Check if it's a URL
            if (value.match(/^https?:\/\//)) {
                return `<a href="${value}" target="_blank" class="value-link">${this.escapeHtml(value)}</a>`;
            }
            // Check if it's a date
            if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
                return `<span class="value-date">${this.escapeHtml(value)}</span>`;
            }
            return `<span class="value-string">${this.escapeHtml(value)}</span>`;
        }
        return `<span class="value-unknown">${this.escapeHtml(String(value))}</span>`;
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
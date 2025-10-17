import React, { useState } from 'react';
import { X, Eye, EyeOff, Search, Copy, Download } from 'lucide-react';
import { flattenJson } from '../utils/helpers';
import JsonTableView from './JsonTableView';

export default function FileViewer({ file, onClose, s3Client, bucketName }) {
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  
  let jsonData = null;
  let flatData = [];
  
  if (file.type === 'json') {
    try {
      jsonData = JSON.parse(file.content);
      flatData = flattenJson(jsonData);
    } catch (error) {
      console.error('JSON parse error:', error);
    }
  }

  const filteredData = searchTerm
    ? flatData.filter(item => 
        item.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : flatData;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(file.content);
  };

  const downloadFile = async () => {
    try {
      setDownloadStatus('Downloading...');
      
      // Convert JSON path to Excel path
      // Example: auditors-report/json/filename.json -> auditors-report/excel/filename.xlsx
      const excelKey = file.key
        .replace('/json/', '/excel/')
        .replace('.json', '.xlsx');
      
      console.log('Attempting to download Excel file:', excelKey);
      
      // Check if Excel file exists
      const params = { Bucket: bucketName, Key: excelKey };
      
      try {
        const data = await s3Client.getObject(params).promise();
        
        // Create blob and download
        const blob = new Blob([data.Body], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = URL.createObjectURL(blob);
        
        // Extract filename from key
        const fileName = excelKey.split('/').pop();
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setDownloadStatus('✅ Downloaded successfully!');
        setTimeout(() => setDownloadStatus(''), 3000);
      } catch (excelError) {
        // If Excel file doesn't exist, try alternative path or download JSON
        console.error('Excel file not found, trying alternative paths...', excelError);
        
        // Try alternative: excel/filename.xlsx (without document type prefix)
        const alternativeKey = file.key
          .split('/')
          .pop()
          .replace('.json', '.xlsx');
        const alternativeExcelKey = `excel/${alternativeKey}`;
        
        console.log('Trying alternative path:', alternativeExcelKey);
        
        try {
          const altData = await s3Client.getObject({ 
            Bucket: bucketName, 
            Key: alternativeExcelKey 
          }).promise();
          
          const blob = new Blob([altData.Body], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          const url = URL.createObjectURL(blob);
          const fileName = alternativeKey;
          
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setDownloadStatus('✅ Downloaded successfully!');
          setTimeout(() => setDownloadStatus(''), 3000);
        } catch (altError) {
          console.error('Alternative Excel path also not found:', altError);
          setDownloadStatus('❌ Excel file not found. Downloading JSON instead...');
          
          // Fallback: Download JSON file
          setTimeout(() => {
            downloadJsonFallback();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('❌ Error: ' + error.message);
      setTimeout(() => setDownloadStatus(''), 5000);
    }
  };

  const downloadJsonFallback = async () => {
    try {
      const params = { Bucket: bucketName, Key: file.key };
      const data = await s3Client.getObject(params).promise();
      const blob = new Blob([data.Body], { type: data.ContentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setDownloadStatus('Downloaded JSON file');
      setTimeout(() => setDownloadStatus(''), 3000);
    } catch (error) {
      console.error('JSON download error:', error);
      setDownloadStatus('❌ Download failed');
      setTimeout(() => setDownloadStatus(''), 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-indigo-600">
        <h2 className="text-2xl font-bold text-gray-800">File Viewer</h2>
        <button
          onClick={onClose}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Close
        </button>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span className="font-semibold text-gray-800">{file.name}</span>
        <div className="flex gap-2 flex-wrap">
          {file.type === 'json' && (
            <>
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'raw' : 'table')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
              >
                {viewMode === 'table' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {viewMode === 'table' ? 'Raw JSON' : 'Table View'}
              </button>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </>
          )}
          <button
            onClick={copyToClipboard}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Copy className="w-4 h-4" />
            Copy JSON
          </button>
          <button
            onClick={downloadFile}
            disabled={downloadStatus.includes('Downloading')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>
      </div>

      {/* Download Status Message */}
      {downloadStatus && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-semibold ${
          downloadStatus.includes('✅') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : downloadStatus.includes('❌')
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {downloadStatus}
        </div>
      )}

      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by field path or value..."
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:ring focus:ring-indigo-200 outline-none"
          />
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              Showing {filteredData.length} of {flatData.length} rows
            </p>
          )}
        </div>
      )}

      <div className="border-2 border-gray-200 rounded-lg overflow-auto max-h-[600px]">
        {file.type === 'json' && jsonData ? (
          viewMode === 'table' ? (
            <JsonTableView data={filteredData} />
          ) : (
            <pre className="p-6 bg-gray-50 text-sm font-mono overflow-auto">
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          )
        ) : (
          <pre className="p-6 bg-gray-50 text-sm font-mono overflow-auto whitespace-pre-wrap">
            {file.content}
          </pre>
        )}
      </div>
    </div>
  );
}
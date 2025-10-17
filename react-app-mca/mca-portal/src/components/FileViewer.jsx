// src/components/FileViewer.jsx
import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Search, Copy, Download, FileSpreadsheet } from 'lucide-react';
import { flattenJson, cleanFieldPath } from '../utils/helpers';
import JsonTableView from './JsonTableView';
import * as XLSX from 'xlsx';

export default function FileViewer({ file, onClose, s3Client, bucketName }) {
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [excelData, setExcelData] = useState(null);
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  
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
    setDownloadStatus('✅ JSON copied to clipboard!');
    setTimeout(() => setDownloadStatus(''), 3000);
  };

  // Load Excel file from S3
  const loadExcelFile = async () => {
    setIsLoadingExcel(true);
    setDownloadStatus('Loading Excel file...');
    
    try {
      // Convert JSON path to Excel path
      const excelKey = file.key
        .replace('/json/', '/excel/')
        .replace('.json', '.xlsx');
      
      console.log('Loading Excel file:', excelKey);
      
      const params = { Bucket: bucketName, Key: excelKey };
      
      try {
        const data = await s3Client.getObject(params).promise();
        
        // Parse Excel file
        const workbook = XLSX.read(data.Body, { type: 'array' });
        
        // Convert to JSON format for display
        const sheets = {};
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          sheets[sheetName] = jsonSheet;
        });
        
        setExcelData(sheets);
        setViewMode('excel');
        setDownloadStatus('✅ Excel file loaded successfully!');
        setTimeout(() => setDownloadStatus(''), 3000);
      } catch (excelError) {
        console.error('Excel file not found, trying alternative paths...', excelError);
        
        // Try alternative path
        const alternativeKey = file.key.split('/').pop().replace('.json', '.xlsx');
        const alternativeExcelKey = `excel/${alternativeKey}`;
        
        console.log('Trying alternative path:', alternativeExcelKey);
        
        try {
          const altData = await s3Client.getObject({ 
            Bucket: bucketName, 
            Key: alternativeExcelKey 
          }).promise();
          
          const workbook = XLSX.read(altData.Body, { type: 'array' });
          const sheets = {};
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            sheets[sheetName] = jsonSheet;
          });
          
          setExcelData(sheets);
          setViewMode('excel');
          setDownloadStatus('✅ Excel file loaded successfully!');
          setTimeout(() => setDownloadStatus(''), 3000);
        } catch (altError) {
          console.error('Alternative Excel path also not found:', altError);
          setDownloadStatus('❌ Excel file not found in S3');
          setTimeout(() => setDownloadStatus(''), 5000);
        }
      }
    } catch (error) {
      console.error('Error loading Excel:', error);
      setDownloadStatus('❌ Error: ' + error.message);
      setTimeout(() => setDownloadStatus(''), 5000);
    } finally {
      setIsLoadingExcel(false);
    }
  };

  const downloadFile = async () => {
    try {
      setDownloadStatus('Downloading...');
      
      const excelKey = file.key
        .replace('/json/', '/excel/')
        .replace('.json', '.xlsx');
      
      console.log('Attempting to download Excel file:', excelKey);
      
      const params = { Bucket: bucketName, Key: excelKey };
      
      try {
        const data = await s3Client.getObject(params).promise();
        
        const blob = new Blob([data.Body], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = URL.createObjectURL(blob);
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
        console.error('Excel file not found, trying alternative paths...', excelError);
        
        const alternativeKey = file.key.split('/').pop().replace('.json', '.xlsx');
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
          setTimeout(() => downloadJsonFallback(), 1500);
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

  const toggleView = () => {
    if (viewMode === 'excel') {
      setViewMode('table');
    } else if (viewMode === 'table') {
      loadExcelFile();
    } else {
      setViewMode('table');
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
                onClick={toggleView}
                disabled={isLoadingExcel}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {viewMode === 'excel' ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Table View
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    {isLoadingExcel ? 'Loading...' : 'View Excel'}
                  </>
                )}
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

      {showSearch && viewMode === 'table' && (
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
          ) : viewMode === 'excel' && excelData ? (
            <ExcelViewer excelData={excelData} />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>Click "View Excel" to load the Excel file</p>
            </div>
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

// Excel Viewer Component
function ExcelViewer({ excelData }) {
    const [activeSheet, setActiveSheet] = useState(Object.keys(excelData)[0]);
    const sheetNames = Object.keys(excelData);
    const currentSheetData = excelData[activeSheet];
  
    if (!currentSheetData || currentSheetData.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          No data in this sheet
        </div>
      );
    }
  
    // Clean the header row using the shared helper function
    const headers = currentSheetData[0]?.map(header => cleanFieldPath(header)) || [];
    const dataRows = currentSheetData.slice(1);
  
    return (
      <div className="excel-viewer">
        {/* Sheet Tabs */}
        {sheetNames.length > 1 && (
          <div className="flex gap-2 p-4 bg-gray-100 border-b-2 border-gray-200 overflow-x-auto">
            {sheetNames.map(sheetName => (
              <button
                key={sheetName}
                onClick={() => setActiveSheet(sheetName)}
                className={`px-4 py-2 rounded-t-lg font-semibold text-sm whitespace-nowrap transition-colors ${
                  activeSheet === sheetName
                    ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {sheetName}
              </button>
            ))}
          </div>
        )}
  
        {/* Excel Table with Clean Headers */}
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0">
              <tr>
                {headers.map((header, colIndex) => (
                  <th
                    key={colIndex}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border border-indigo-500 whitespace-nowrap"
                  >
                    {header || `Column ${colIndex + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-gray-200 hover:bg-indigo-50 transition-colors"
                >
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-4 py-3 text-sm text-gray-700 border border-gray-200"
                    >
                      {cell !== null && cell !== undefined && cell !== '' ? String(cell) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {/* Sheet Info */}
        <div className="p-4 bg-gray-50 border-t-2 border-gray-200 text-sm text-gray-600">
          <strong>Sheet:</strong> {activeSheet} | <strong>Rows:</strong> {dataRows.length} | <strong>Columns:</strong> {headers.length}
        </div>
      </div>
    );
  }
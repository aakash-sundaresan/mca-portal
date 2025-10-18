// src/components/FileViewer.jsx
import React, { useState } from 'react';
import { X, Search, Copy, Download, FileSpreadsheet, Table2, Zap } from 'lucide-react';
import { flattenJson } from '../utils/helpers';
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

  const loadExcelFile = async () => {
    setIsLoadingExcel(true);
    setDownloadStatus('Loading Excel file...');
    
    try {
      const excelKey = file.key.replace('/json/', '/excel/').replace('.json', '.xlsx');
      console.log('Loading Excel file:', excelKey);
      
      const params = { Bucket: bucketName, Key: excelKey };
      
      try {
        const data = await s3Client.getObject(params).promise();
        const workbook = XLSX.read(data.Body, { type: 'array' });
        
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
        const alternativeKey = file.key.split('/').pop().replace('.json', '.xlsx');
        const alternativeExcelKey = `excel/${alternativeKey}`;
        
        try {
          const altData = await s3Client.getObject({ Bucket: bucketName, Key: alternativeExcelKey }).promise();
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
          setDownloadStatus('❌ Excel file not found in S3');
          setTimeout(() => setDownloadStatus(''), 5000);
        }
      }
    } catch (error) {
      setDownloadStatus('❌ Error: ' + error.message);
      setTimeout(() => setDownloadStatus(''), 5000);
    } finally {
      setIsLoadingExcel(false);
    }
  };

  const downloadFile = async () => {
    try {
      setDownloadStatus('Downloading...');
      const excelKey = file.key.replace('/json/', '/excel/').replace('.json', '.xlsx');
      
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
        const alternativeKey = file.key.split('/').pop().replace('.json', '.xlsx');
        const alternativeExcelKey = `excel/${alternativeKey}`;
        
        try {
          const altData = await s3Client.getObject({ Bucket: bucketName, Key: alternativeExcelKey }).promise();
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
          setDownloadStatus('❌ Excel file not found. Downloading JSON instead...');
          setTimeout(() => downloadJsonFallback(), 1500);
        }
      }
    } catch (error) {
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
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl shadow-gold/20 border border-yellow-500/20 p-8 mb-8 animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-yellow-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg shadow-gold">
            <FileSpreadsheet className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">
            File Viewer
          </h2>
        </div>
        <button
          onClick={onClose}
          className="bg-gray-800 border-2 border-gray-700 text-gray-300 px-4 py-2 rounded-lg 
                   hover:border-red-500 hover:text-red-400 transition-all flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Close
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <span className="font-semibold text-yellow-400 text-lg">{file.name}</span>
        <div className="flex gap-2 flex-wrap">
          {file.type === 'json' && (
            <>
              <button
                onClick={toggleView}
                disabled={isLoadingExcel}
                className="bg-gray-800 border-2 border-gray-700 text-yellow-400 px-4 py-2 rounded-lg 
                         hover:border-yellow-500 hover:shadow-gold/50 transition-all flex items-center gap-2 text-sm font-semibold
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {viewMode === 'excel' ? (
                  <>
                    <Table2 className="w-4 h-4" />
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
                className="bg-gray-800 border-2 border-gray-700 text-yellow-400 px-4 py-2 rounded-lg 
                         hover:border-yellow-500 hover:shadow-gold/50 transition-all flex items-center gap-2 text-sm font-semibold"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </>
          )}
          <button
            onClick={copyToClipboard}
            className="bg-gray-800 border-2 border-gray-700 text-yellow-400 px-4 py-2 rounded-lg 
                     hover:border-yellow-500 hover:shadow-gold/50 transition-all flex items-center gap-2 text-sm font-semibold"
          >
            <Copy className="w-4 h-4" />
            Copy JSON
          </button>
          <button
            onClick={downloadFile}
            disabled={downloadStatus.includes('Downloading')}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-4 py-2 rounded-lg 
                     hover:shadow-gold transition-all flex items-center gap-2 text-sm font-semibold
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>
      </div>

      {/* Download Status */}
      {downloadStatus && (
        <div className={`mb-4 p-4 rounded-lg text-sm font-semibold border-2 animate-fade-in ${
          downloadStatus.includes('✅') 
            ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' 
            : downloadStatus.includes('❌')
            ? 'bg-red-500/10 border-red-500/50 text-red-400'
            : 'bg-blue-500/10 border-blue-500/50 text-blue-400'
        }`}>
          {downloadStatus}
        </div>
      )}

      {/* Search Box */}
      {showSearch && viewMode === 'table' && (
        <div className="mb-4 animate-fade-in">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by field path or value..."
            className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg 
                     text-gray-200 placeholder-gray-500
                     focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none
                     transition-all duration-300"
          />
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-2">
              Showing {filteredData.length} of {flatData.length} rows
            </p>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="border-2 border-gray-800 rounded-xl overflow-hidden bg-gray-900/50 max-h-[600px] overflow-y-auto">
        {file.type === 'json' && jsonData ? (
          viewMode === 'table' ? (
            <JsonTableView data={filteredData} />
          ) : viewMode === 'excel' && excelData ? (
            <ExcelViewer excelData={excelData} />
          ) : (
            <div className="p-12 text-center">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Click "View Excel" to load the Excel file</p>
            </div>
          )
        ) : (
          <pre className="p-6 bg-gray-900 text-sm font-mono overflow-auto whitespace-pre-wrap text-gray-300">
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
      <div className="p-12 text-center text-gray-500">
        No data in this sheet
      </div>
    );
  }

  const headers = currentSheetData[0] || [];
  const dataRows = currentSheetData.slice(1);

  return (
    <div className="excel-viewer">
      {/* Sheet Tabs */}
      {sheetNames.length > 1 && (
        <div className="flex gap-2 p-4 bg-gray-800/50 border-b-2 border-gray-800 overflow-x-auto">
          {sheetNames.map(sheetName => (
            <button
              key={sheetName}
              onClick={() => setActiveSheet(sheetName)}
              className={`px-5 py-3 rounded-t-lg font-semibold text-sm whitespace-nowrap transition-all ${
                activeSheet === sheetName
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-gold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-yellow-400'
              }`}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}

      {/* Excel Table */}
      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gradient-to-r from-yellow-400 to-amber-500 sticky top-0 z-10">
            <tr>
              {headers.map((header, colIndex) => (
                <th
                  key={colIndex}
                  className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider border border-yellow-600/30 whitespace-nowrap text-black"
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
                className="border-b border-gray-800 hover:bg-yellow-500/5 transition-colors"
              >
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-3 text-sm text-gray-300 border border-gray-800"
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
      <div className="p-4 bg-gray-800/50 border-t-2 border-gray-800 text-sm text-gray-400">
        <strong className="text-yellow-400">Sheet:</strong> {activeSheet} | 
        <strong className="text-yellow-400 ml-3">Rows:</strong> {dataRows.length} | 
        <strong className="text-yellow-400 ml-3">Columns:</strong> {headers.length}
      </div>
    </div>
  );
}
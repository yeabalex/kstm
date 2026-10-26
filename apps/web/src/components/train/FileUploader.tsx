import React, { useState, useEffect, useRef } from 'react';

interface FileSelection {
  [key: string]: File[];
}

const FileUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileSelection>({
    csv: [],
    json: [],
    pdf: [],
    txt: [],
  });
  const [enteredUrls, setEnteredUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Update total count (files + urls)
  useEffect(() => {
    const fileCount = Object.values(selectedFiles).reduce(
      (acc, files) => acc + files.length,
      0
    );
    setTotalFiles(fileCount + enteredUrls.length);
  }, [selectedFiles, enteredUrls]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), ...newFiles],
      }));
    }
  };

  const removeFile = (type: string, index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev[type]];
      newFiles.splice(index, 1);
      return {
        ...prev,
        [type]: newFiles,
      };
    });
  };

  const handleAddUrl = () => {
    const isValidUrl = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(urlInput.trim());
    if (!isValidUrl) {
      setUploadStatus('Please enter a valid URL.');
      return;
    }
    if (totalFiles >= 3) {
      setUploadStatus('You can upload a maximum of 3 items in total.');
      return;
    }
    setEnteredUrls((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
    setUploadStatus(null);
  };

  const removeUrl = (index: number) => {
    setEnteredUrls((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // This function is called by the parent component
  const getFormData = () => {
    const formData = new FormData();
    
    // Add files to formData
    for (const [type, files] of Object.entries(selectedFiles)) {
      files.forEach((file) => formData.append(type, file));
    }
    
    // Add URLs to formData
    enteredUrls.forEach((url) => formData.append('urls', url));
    
    return formData;
  };

  return (
    <div className="bg-white rounded-lg p-8 max-w-5xl mx-auto">
      <p className="text-gray-500 mb-6">Upload a file (PDF, DOCX, TXT, CSV, Excel, PowerPoint) to generate exam questions</p>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3 flex items-center text-gray-700">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Document Upload
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 flex flex-col items-center justify-center text-center">
          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="text-gray-600 mb-2 font-medium">Drag files</p>
          <p className="text-gray-500 text-sm mb-4">Click to upload files (PDF, DOCX, TXT, CSV, Excel, PowerPoint)</p>
          
          <div className="flex space-x-3">
            {Object.keys(selectedFiles).map((type) => (
              <div key={type} className="flex-1">
                <label className="px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-sm shadow-sm flex items-center justify-center">
                  <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                  </svg>
                  {type.toUpperCase()}
                  <input
                    type="file"
                    name={type}
                    accept={`.${type}`}
                    multiple
                    onChange={(e) => handleFileChange(e, type)}
                    className="hidden"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {Object.values(selectedFiles).some(files => files.length > 0) && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3 flex items-center text-gray-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Uploaded Files
          </h3>
          
          <div className="space-y-3">
            {Object.entries(selectedFiles).map(([type, files]) => 
              files.map((file, index) => (
                <div 
                  key={`${type}-${index}`}
                  className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-md border border-blue-100"
                >
                  <div className="flex items-center">
                    <div className="bg-blue-500 rounded-md p-2 mr-3">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-gray-800 font-medium">{file.name}</span>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span className="mr-2">{Math.round(file.size / 1024)} KB</span>
                        <span className="flex items-center bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          Ready
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(type, index)}
                    className="text-gray-500 hover:text-red-500 transition-colors p-1"
                    aria-label="Remove file"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* URL Input Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3 flex items-center text-gray-700">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 010 5.656m1.414-1.414a6 6 0 000-8.485l-3.535 3.535a2 2 0 010 2.828l3.535 3.536a6 6 0 000-8.485m-8.485 8.485a4 4 0 015.656 0"></path>
          </svg>
          URL Input
        </h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
            placeholder="Enter a valid URL (e.g., https://example.com)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button
            type="button"
            className="px-5 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
            onClick={handleAddUrl}
          >
            Add URL
          </button>
        </div>

        {enteredUrls.length > 0 && (
          <div className="space-y-3">
            {enteredUrls.map((url, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-md border border-gray-200"
              >
                <div className="flex items-center truncate w-4/5">
                  <div className="bg-gray-200 rounded-md p-2 mr-3">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656m1.414-1.414a6 6 0 000-8.485l-3.535 3.535a2 2 0 010 2.828l3.535 3.536a6 6 0 000-8.485m-8.485 8.485a4 4 0 015.656 0" />
                    </svg>
                  </div>
                  <span className="truncate text-gray-700">{url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeUrl(index)}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1"
                  aria-label="Remove URL"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Counter */}
      <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
        <div className="flex items-center mb-2">
          <span className="font-medium text-gray-700 mr-2">Items uploaded:</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">{totalFiles}/3</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-500 h-2.5 rounded-full" 
            style={{ width: `${Math.min(100, (totalFiles / 3) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Additional Options */}


      {/* Status Messages */}
      {uploadStatus && (
        <div
          className={`mt-4 p-4 rounded-md ${
            uploadStatus.includes('failed')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}
        >
          <div className="flex items-center">
            {uploadStatus.includes('failed') ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {uploadStatus}
          </div>
        </div>
      )}

      {/* Add hidden inputs for URLs */}
      {enteredUrls.map((url, index) => (
        <input key={index} type="hidden" name="urls" value={url} />
      ))}
    </div>
  );
};

export default FileUploader;
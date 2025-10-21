import React, { useState } from 'react';

const ImageTestPage: React.FC = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [result, setResult] = useState<string>('');

  const testImage = async () => {
    try {
      const fullUrl = `http://localhost:5000${imageUrl}`;
      setResult(`Testing: ${fullUrl}`);
      
      // Test with HEAD request
      const headResponse = await fetch(fullUrl, { method: 'HEAD' });
      setResult(prev => prev + `\nHEAD Status: ${headResponse.status}`);
      
      if (headResponse.ok) {
        // Test with GET request
        const getResponse = await fetch(fullUrl);
        setResult(prev => prev + `\nGET Status: ${getResponse.status}`);
        
        if (getResponse.ok) {
          setResult(prev => prev + '\n✅ Image is accessible');
        } else {
          setResult(prev => prev + '\n❌ GET request failed');
        }
      } else {
        setResult(prev => prev + '\n❌ HEAD request failed');
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Image Debug Tool</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Image Path (e.g., /uploads/filename.png):</label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="/uploads/deposit-12345.png"
        />
      </div>
      
      <button
        onClick={testImage}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Image
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">Results:</h2>
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default ImageTestPage;
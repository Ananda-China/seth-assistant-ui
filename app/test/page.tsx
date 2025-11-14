'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testEndpoints = [
    { name: 'Ping', url: '/api/ping' },
    { name: 'Health Check', url: '/api/health-check' },
    { name: 'Environment Test', url: '/api/env-test' },
    { name: 'Conversations Simple', url: '/api/conversations-simple' },
    { name: 'Conversations (Auth Required)', url: '/api/conversations' }
  ];

  const testEndpoint = async (url: string) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return {
        status: response.status,
        ok: response.ok,
        data
      };
    } catch (error) {
      return {
        status: 'error',
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    const testResults: any = {};
    
    for (const endpoint of testEndpoints) {
      console.log(`Testing ${endpoint.name}...`);
      testResults[endpoint.name] = await testEndpoint(endpoint.url);
    }
    
    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
      
      <button 
        onClick={runAllTests}
        disabled={loading}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Tests'}
      </button>

      <div className="space-y-4">
        {testEndpoints.map((endpoint) => {
          const result = results[endpoint.name];
          return (
            <div key={endpoint.name} className="border p-4 rounded">
              <h3 className="font-semibold text-lg">{endpoint.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{endpoint.url}</p>
              
              {result ? (
                <div>
                  <div className={`inline-block px-2 py-1 rounded text-sm ${
                    result.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    Status: {result.status}
                  </div>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-gray-500">Not tested yet</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

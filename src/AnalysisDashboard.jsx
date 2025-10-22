import React, { useState, useEffect } from 'react';
import axios from 'axios';  
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './AnalysisDashboardStyles.js';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/';
const getClusterChartData = (results) => {
  if (!results?.clustering?.year_clusters) return [];
  return Object.entries(results.clustering.year_clusters).map(([year, cluster]) => ({
    year,
    cluster,
  }));
};

const formatKpiData = (results) => [
  { label: "Predicted Tomorrow's Temp (°C)", value: results?.forecast?.next_day_predicted_temp || 'N/A', color: '#107a8b' },
  { label: "Annual Warming Trend Slope", value: results?.trend_detection?.long_term_trend_slope || 'N/A', color: '#169950' },
  { label: "Overall Climate Summary", value: results?.trend_detection?.trend_summary || 'N/A', color: '#d9534f' },
];

function AnalysisDashboard() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('IDLE');
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState('Select a data file (CSV/XLSX) and click Analyze.');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setJobId(null);
    setStatus('IDLE');
    setResults(null);
    setMessage(`Ready to upload file: ${e.target.files[0].name}`);
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('UPLOADING');
    setMessage(`Uploading ${file.name} to backend...`);

    const formData = new FormData();
    formData.append('file', file); 

    try {
      const uploadResponse = await axios.post(`${API_BASE_URL}upload/`, formData);
      const uploadData = uploadResponse.data;
      const newJobId = uploadData.job_id; 
      setJobId(newJobId);


      if (uploadResponse.status === 200) {
        setStatus('COMPLETED');
        setResults(uploadData.results);
        setMessage(uploadData.message);
      } else if (uploadResponse.status === 202) {
        setStatus('PENDING');
        setMessage(uploadData.message);
        await fetchFinalResult(newJobId);
      }

    } catch (error) {
      console.error('Upload Error:', error.response || error);
      setStatus('FAILED');
      setMessage(
        `Upload failed: ${error.response?.data?.error || error.message || 'Network error'}`
      );
    }
  };

  const fetchFinalResult = async (currentJobId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}status/${currentJobId}/`);
        const data = response.data;
        
        setStatus(data.status);

        if (response.status === 200 || data.status === 'SUCCESS') {
            setResults(data.results);
            setMessage('Analysis completed successfully! Results displayed.');
            setStatus('COMPLETED');
        } else if (response.status === 500 || data.status === 'FAILURE') {
            setMessage(`Analysis failed: ${data.error || 'Unknown error'}`);
            setStatus('FAILED');
        } else {
            setMessage("Backend did not block. Status remains PENDING/RUNNING.");
        }

    } catch (error) {
        console.error('Single GET Error:', error.response || error);
        setStatus('FAILED');
        setMessage(`Error during result fetch: ${error.message}.`);
    }
  }
 
  const clusterData = results ? getClusterChartData(results) : [];
  const kpiData = results ? formatKpiData(results) : [];
  const isProcessing = status === 'UPLOADING' || status === 'PENDING' || status === 'RUNNING';

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Weather Data Analysis Engine</h1>
      </header>

      <div style={styles.mainContent}>
        <div style={styles.inputCard}>
          <h3 style={styles.cardTitle}>1. Upload & Start Analysis</h3>

          <div style={styles.formContainer}>
            <label style={styles.label}>
              Selected File: <span style={{fontWeight: 'bold', color: file ? '#107a8b' : '#d9534f'}}>{file ? file.name : 'No file selected'}</span>
            </label>
            <input 
              type="file" 
              onChange={handleFileChange} 
              accept=".csv, .xlsx, .xls" 
              style={styles.fileInput} 
            />

            <button
              type="button"           
              onClick={handleUpload}  
              disabled={!file || isProcessing}
              style={{...styles.button, ...styles.primaryButton}}
            >
              {status === 'UPLOADING' ? 'Uploading...' : status === 'PENDING' || status === 'RUNNING' ? 'Running Analysis...' : 'Analyze Data'}
            </button>
          </div>

          <div style={styles.statusBox}>
            <p><strong>Job Status:</strong> <span style={{color: status === 'COMPLETED' ? '#169950' : status.includes('FAIL') ? '#d9534f' : '#107a8b'}}>{status}</span></p>
            <p style={{fontSize: '0.9em', color: '#555', marginTop: '5px'}}>{message}</p>
          </div>

          {jobId && (
            <div style={styles.sideInfo}>
              <p>Job ID: {jobId}</p>
              <p>{'Backend Pipeline: S3 Upload -> Celery ML -> DynamoDB Storage'}</p>
            </div>
          )}
        </div>

        {(status === 'COMPLETED') && results ? (
          <div style={styles.resultsPanel}>
            <h2 style={styles.resultsTitle}>2. Analysis Results Overview</h2>

            <div style={styles.kpiContainer}>
              {kpiData.map((kpi, index) => (
                <div key={index} style={styles.kpiCard}>
                  <p style={styles.kpiLabel}>{kpi.label}</p>
                  <h4 style={{...styles.kpiValue, color: kpi.color}}>{kpi.value}</h4>
                </div>
              ))}
            </div>

            <div style={styles.chartSection}>
              <h3 style={styles.chartTitle}>Annual Weather Pattern Clustering</h3>
              {clusterData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={clusterData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="year" stroke="#555" />
                    <YAxis label={{ value: 'Cluster ID', angle: -90, position: 'insideLeft', fill: '#555' }} allowDecimals={false} />
                    <Tooltip contentStyle={styles.tooltip} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="cluster" fill="#00bcd4" name="Pattern Group ID" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p>Insufficient data to generate clustering chart.</p>}
            </div>

          </div>
        ) : (
          <div style={{...styles.resultsPanel, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <p style={{fontSize: '1.2em', color: '#777'}}>
              {status === 'IDLE' ? 'Upload a data file to start the analysis.' : 
               isProcessing ? `Analysis in progress (${jobId}). Please wait...` :
               status === 'FAILED' ? 'Analysis failed. Check the status box for details.' :
               'Awaiting analysis results...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalysisDashboard;

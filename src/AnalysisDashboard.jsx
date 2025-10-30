import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Input,
  FormControl,
  List, 
  ListItem, 
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/';
const POLL_INTERVAL = 10000; // Poll job status every 10 seconds
const PRIMARY_COLOR = '#107a8b';
const ACCENT_COLOR = '#0a3d62';
const SUCCESS_COLOR = '#169950';
const FAILURE_COLOR = '#d9534f';
const SIDEBAR_WIDTH = '350px';

const PAPER_COMMON_STYLES = {
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

const HeaderBox = styled(Box)(({ theme }) => ({
  backgroundColor: ACCENT_COLOR,
  color: 'white',
  padding: theme.spacing(2.5, 5),
  boxShadow: theme.shadows[2],
}));

const InputPaper = styled(Paper)(({ theme }) => ({
  ...PAPER_COMMON_STYLES,
  padding: theme.spacing(3),
  height: 'fit-content',
  borderTop: `5px solid ${PRIMARY_COLOR}`,
}));

const ResultsPaper = styled(Paper)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(4),
  borderRadius: '8px',
  boxShadow: theme.shadows[3],
}));


const getTempChartData = (results) => {
  if (!results?.time_series_data || results.time_series_data.length === 0) return [];

  return results.time_series_data.map(item => ({
    date: item.date,
    // Ensure data is numeric and formatted
    temperature: Number(item.mean_temp_C).toFixed(2), 
  }));
};

const formatKpiData = (results) => [
  { 
    label: "REPORT SUMMARY", 
    value: results?.report_summary || 'Analysis summary is not available.', 
    color: PRIMARY_COLOR,
    isSummary: true
  },
  { 
    label: "TEMP VS HUMIDITY CORRELATION (R²)", 
    value: results?.regression_analysis?.temp_humidity_r2 || 'N/A', 
    color: SUCCESS_COLOR 
  },
];

const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

const getXAxisInterval = (dataLength) => {
  if (dataLength <= 5) {
    return 0; // Show all points
  } else {
    // Calculate interval to ensure 5 labels are displayed (including first and last)
    return Math.max(0, Math.floor((dataLength - 1) / 4));
  }
};


function AnalysisDashboard() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null); 
  const [status, setStatus] = useState('IDLE');
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState('Select a data file (CSV/XLSX) and click Analyze.');
  const [pastJobs, setPastJobs] = useState([]); 
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getJobStats = () => {
    const stats = {
      SUCCESS: 0,
      FAILURE: 0,
      PENDING: 0,
      RUNNING: 0,
      total: pastJobs.length
    };
    
    pastJobs.forEach(job => {
      if (job.status === 'SUCCESS' || job.status === 'COMPLETED') {
        stats.SUCCESS++;
      } else if (job.status === 'FAILURE' || job.status === 'FAILED') {
        stats.FAILURE++;
      } else if (job.status === 'PENDING') {
        stats.PENDING++;
      } else if (job.status === 'RUNNING' || job.status === 'STARTED') {
        stats.RUNNING++;
      }
    });
    
    return stats;
  }; 


  const getStatusColor = (currentStatus) => {
    if (currentStatus === 'SUCCESS' || currentStatus === 'COMPLETED') return SUCCESS_COLOR;
    if (currentStatus.includes('FAIL') || currentStatus.includes('FAILURE')) return FAILURE_COLOR;
    return PRIMARY_COLOR;
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setJobId(null);
    setSelectedJobId(null);
    setStatus('IDLE');
    setResults(null);
    setMessage(`Ready to upload file: ${e.target.files[0].name}`);
  };

  const fetchFinalResult = async (currentJobId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}status/${currentJobId}/`);
        const data = response.data;
        
        setStatus(data.status);

        if (data.status === 'SUCCESS' && data.results) {
            setResults(data.results);
            setMessage('Analysis completed successfully! Results displayed.');
        } else if (data.status === 'FAILURE') {
             setMessage(`Analysis failed: ${data.error || 'Unknown error'}`);
             setResults(null);
        } else {
            setMessage(`Job ID ${currentJobId.substring(0, 10)}... status: ${data.status}. This state should be short-lived.`);
        }

    } catch (error) {
        console.error('Single GET Error:', error.response || error);
        setStatus('FAILED');
        setMessage(`Error during result fetch: ${error.response?.data?.error || error.message}.`);
    } finally {
        fetchJobStatuses();
    }
  }

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
      setSelectedJobId(newJobId); 
      setStatus(uploadData.status); 
      setMessage(uploadData.message);
      
      if (uploadData.from_cache) {
        setResults(uploadData.results);
        toast.success("📋 File already analyzed! Results loaded from cache.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        setResults(null);
        await fetchFinalResult(newJobId);
      }
      
      fetchJobStatuses(); 

    } catch (error) {
      console.error('Upload Error:', error.response || error);
      setStatus('FAILED');
      setMessage(
        `Upload failed: ${error.response?.data?.error || error.message || 'Network error'}`
      );
      fetchJobStatuses();
    }
  };

  const fetchJobStatuses = async (showLoading = false) => {
    if (showLoading) setIsLoadingJobs(true);
    try {
        const response = await axios.get(`${API_BASE_URL}job-statuses/`); 
        setPastJobs(response.data);
    } catch (error) {
        console.warn('Failed to fetch job statuses:', error.response || error);
    } finally {
        if (showLoading) setIsLoadingJobs(false);
    }
  };

  const handleJobSelect = (id, currentStatus) => {
      setSelectedJobId(id);
      setJobId(id);
      setResults(null); 
      
      setStatus(currentStatus);
      if (currentStatus === 'SUCCESS' || currentStatus === 'COMPLETED') {
          setMessage(`Fetching completed results for Job ID: ${id.substring(0, 10)}...`);
          fetchFinalResult(id); 
      } else {
          setMessage(`Job ID ${id.substring(0, 10)}... is currently ${currentStatus}. Status list will update automatically.`);
      }
  };

  const handleDeleteClick = (jobId, event) => {
      event.stopPropagation();
      setJobToDelete(jobId);
      setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
      if (!jobToDelete) return;
      
      setIsDeleting(true);
      try {
          await axios.delete(`${API_BASE_URL}delete/${jobToDelete}/`);
          
          toast.success("Job deleted successfully!", {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
          });
          
          if (selectedJobId === jobToDelete) {
              setSelectedJobId(null);
              setJobId(null);
              setResults(null);
              setStatus('IDLE');
              setMessage('Select a data file (CSV/XLSX) and click Analyze.');
          }
          
          await fetchJobStatuses();
          
      } catch (error) {
          console.error('Delete Error:', error.response || error);
          toast.error(`Failed to delete job: ${error.response?.data?.error || error.message}`, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
          });
      } finally {
          setIsDeleting(false);
          setDeleteDialogOpen(false);
          setJobToDelete(null);
      }
  };

  const handleDeleteCancel = () => {
      setDeleteDialogOpen(false);
      setJobToDelete(null);
  };


  useEffect(() => {
    fetchJobStatuses();
    const intervalId = setInterval(fetchJobStatuses, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, []); 

  
  const tempChartData = results ? getTempChartData(results) : [];
  const kpiData = results ? formatKpiData(results) : [];
  const isProcessing = status === 'UPLOADING' || status === 'PENDING' || status === 'RUNNING';


  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#ebf1f5',
        fontFamily: 'Roboto, Segoe UI, Arial, sans-serif',
      }}
    >
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <HeaderBox>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 300 }}>
          Weather Data Analysis Engine
        </Typography>
      </HeaderBox>

      <Box
        sx={{
          display: 'flex',
          padding: '30px',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* === 左侧垂直容器 (Upload + List) === */}
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '30px',
            width: SIDEBAR_WIDTH,
            minWidth: '300px',
            maxWidth: SIDEBAR_WIDTH,
            alignItems: 'stretch',
        }}>
        
          {/* === Upload & Status Card === */}
          <InputPaper elevation={3}>
            <Typography variant="h6" component="h3" sx={{
              color: PRIMARY_COLOR,
              borderBottom: '1px solid #eee',
              paddingBottom: '10px',
              marginBottom: '20px',
            }}>
              Upload & Start Analysis
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <Typography variant="body2" component="label" sx={{ fontWeight: 600, color: '#333' }}>
                Selected File:{' '}
                <Box component="span" sx={{ fontWeight: 'bold', color: file ? PRIMARY_COLOR : FAILURE_COLOR }}>
                  {file ? file.name : 'No file selected'}
                </Box>
              </Typography>

              <FormControl fullWidth>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  inputProps={{ accept: ".csv, .xlsx, .xls" }}
                  sx={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}
                />
              </FormControl>

              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!file || isProcessing}
                sx={{
                  marginTop: '15px',
                  padding: '12px 15px',
                  fontWeight: 600,
                  backgroundColor: PRIMARY_COLOR,
                  '&:hover': {
                    backgroundColor: '#0c5c6b',
                  },
                }}
                endIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {status === 'UPLOADING' ? 'Uploading...' : status === 'PENDING' || status === 'RUNNING' ? 'Running Analysis...' : 'Analyze Data'}
              </Button>
            </Box>

            {/* Status Box */}
            <Box sx={{
              marginTop: '25px',
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              borderLeft: `4px solid ${getStatusColor(status)}`,
            }}>
              <Typography variant="body1">
                <strong>Current Status:</strong>{' '}
                <Box component="span" sx={{ color: getStatusColor(status), fontWeight: 'bold' }}>
                  {status}
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: '#555', marginTop: '5px' }}>
                {message}
              </Typography>
            </Box>

            {/* Job ID Info */}
            {jobId && (
              <Box sx={{
                marginTop: '20px',
                padding: '10px 0',
                borderTop: '1px dotted #ccc',
                fontSize: '0.8em',
                color: '#777',
              }}>
                <Typography variant="caption" display="block">Current Job Hash (PK): {jobId.substring(0, 15)}...</Typography>
              </Box>
            )}
          </InputPaper>

          {/* === Job Status List View (Scrollable) === */}
          <Paper elevation={3} sx={{ 
              ...PAPER_COMMON_STYLES,
              maxHeight: pastJobs.length > 3 ? '400px' : '350px', 
              display: 'flex', 
              flexDirection: 'column', 
              borderTop: `5px solid ${ACCENT_COLOR}`,
              overflow: 'hidden',
              padding: 0,
          }}>
              <Box sx={{
                  padding: (theme) => theme.spacing(3),
                  color: ACCENT_COLOR,
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
              }}>
                  <Typography variant="h6" component="h3">
                      Past 24H Job History
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Typography variant="caption" sx={{ 
                          color: '#666',
                          backgroundColor: '#f0f0f0',
                          padding: '2px 8px',
                          borderRadius: '12px',
                      }}>
                          {pastJobs.length} jobs
                          {pastJobs.length > 3 && (
                              <Box component="span" sx={{ 
                                  marginLeft: '5px',
                                  fontSize: '0.7rem',
                                  color: '#999',
                              }}>
                                  📜
                              </Box>
                          )}
                      </Typography>
                      <Button
                          size="small"
                          onClick={() => fetchJobStatuses(true)}
                          disabled={isLoadingJobs}
                          sx={{
                              minWidth: 'auto',
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              color: ACCENT_COLOR,
                              '&:hover': {
                                  backgroundColor: '#f0f0f0',
                              },
                          }}
                      >
                          {isLoadingJobs ? <CircularProgress size={12} /> : '🔄'}
                      </Button>
                  </Box>
              </Box>

              {/* 状态统计指示器 */}
              {pastJobs.length > 0 && (
                  <Box sx={{
                      padding: (theme) => `${theme.spacing(1.5)} ${theme.spacing(3)}`,
                      backgroundColor: '#f8f9fa',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      gap: '15px',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                  }}>
                      <Box sx={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                          {(() => {
                              const stats = getJobStats();
                              return [
                                  { label: 'Success', count: stats.SUCCESS, color: SUCCESS_COLOR },
                                  { label: 'Failed', count: stats.FAILURE, color: FAILURE_COLOR },
                                  { label: 'Running', count: stats.RUNNING, color: PRIMARY_COLOR },
                                  { label: 'Pending', count: stats.PENDING, color: '#ff9800' },
                              ].filter(item => item.count > 0).map((item, index) => (
                                  <Box key={index} sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '4px',
                                      fontSize: '0.75rem',
                                  }}>
                                      <Box sx={{
                                          width: '8px',
                                          height: '8px',
                                          borderRadius: '50%',
                                          backgroundColor: item.color,
                                      }} />
                                      <Typography variant="caption" sx={{ color: '#666' }}>
                                          {item.label}: {item.count}
                                      </Typography>
                                  </Box>
                              ));
                          })()}
                      </Box>
                      {pastJobs.length > 3 && (
                          <Typography variant="caption" sx={{ 
                              color: '#999',
                              fontSize: '0.7rem',
                              fontStyle: 'italic',
                          }}>
                              Showing first 3, scroll for more
                          </Typography>
                      )}
                  </Box>
              )}

              <List sx={{ 
                  overflowY: 'auto', 
                  flexGrow: 1, 
                  padding: 0,
                  maxHeight: pastJobs.length > 3 ? '240px' : 'auto',
                  '&::-webkit-scrollbar': {
                      width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                      backgroundColor: '#f1f1f1',
                      borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#c1c1c1',
                      borderRadius: '3px',
                      '&:hover': {
                          backgroundColor: '#a8a8a8',
                      },
                  },
              }}>
                  {pastJobs.length > 0 ? (
                      pastJobs.map((job, index) => {
                          const jobDate = job.timestamp ? new Date(job.timestamp * 1000) : null;
                          const timeAgo = jobDate ? getTimeAgo(jobDate) : 'Unknown time';
                          const isSelected = selectedJobId === job.job_id;
                          
                          return (
                              <ListItem 
                                  key={job.job_id} 
                                  button 
                                  onClick={() => handleJobSelect(job.job_id, job.status)}
                                  sx={{
                                      borderLeft: `5px solid ${getStatusColor(job.status)}`,
                                      marginBottom: '1px',
                                      backgroundColor: isSelected ? '#e3f2fd' : 'white',
                                      '&:hover': {
                                          backgroundColor: isSelected ? '#e3f2fd' : '#f5f5f5',
                                      },
                                      transition: 'all 0.2s ease',
                                      paddingRight: '8px',
                                  }}
                              >
                                  <ListItemText
                                      primary={
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <Typography variant="body2" sx={{ fontWeight: 600, color: isSelected ? ACCENT_COLOR : '#333' }}>
                                                  #{index + 1} - {job.job_id.substring(0, 8)}...
                                              </Typography>
                                              <Box sx={{ 
                                                  display: 'flex', 
                                                  alignItems: 'center', 
                                                  gap: '8px',
                                              }}>
                                                  <Box sx={{
                                                      width: '8px',
                                                      height: '8px',
                                                      borderRadius: '50%',
                                                      backgroundColor: getStatusColor(job.status),
                                                  }} />
                                                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem' }}>
                                                      {timeAgo}
                                                  </Typography>
                                              </Box>
                                          </Box>
                                      }
                                      secondary={
                                          <Box sx={{ 
                                              display: 'flex', 
                                              justifyContent: 'space-between', 
                                              alignItems: 'center',
                                              marginTop: '4px',
                                          }}>
                                              <Box component="span" sx={{ 
                                                  color: getStatusColor(job.status), 
                                                  fontWeight: 'bold',
                                                  fontSize: '0.85rem',
                                                  textTransform: 'uppercase',
                                                  letterSpacing: '0.5px',
                                              }}>
                                                  {job.status}
                                              </Box>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                  {jobDate && (
                                                      <Typography variant="caption" sx={{ 
                                                          color: '#999',
                                                          fontSize: '0.7rem',
                                                      }}>
                                                          {jobDate.toLocaleDateString()}
                                                      </Typography>
                                                  )}
                                                  <IconButton
                                                      size="small"
                                                      onClick={(e) => handleDeleteClick(job.job_id, e)}
                                                      sx={{
                                                          color: FAILURE_COLOR,
                                                          padding: '4px',
                                                          '&:hover': {
                                                              backgroundColor: 'rgba(217, 83, 79, 0.1)',
                                                          },
                                                      }}
                                                      title="Delete job"
                                                  >
                                                      🗑️
                                                  </IconButton>
                                              </Box>
                                          </Box>
                                      }
                                  />
                              </ListItem>
                          );
                      })
                  ) : (
                      <Box sx={{ 
                          padding: (theme) => `${theme.spacing(5)} ${theme.spacing(3)}`, 
                          textAlign: 'center',
                          color: '#666',
                      }}>
                          <Typography variant="body2" sx={{ marginBottom: '10px' }}>
                              📊 No jobs found in the past 24 hours
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#999' }}>
                              Upload a file to start your first analysis
                          </Typography>
                      </Box>
                  )}
              </List>
          </Paper>

        </Box> 


        {/* === Results Panel === */}
        {jobId && results && (status === 'COMPLETED' || status === 'SUCCESS') ? (
          <ResultsPaper elevation={3}>
            <Typography variant="h5" component="h2" sx={{
              color: ACCENT_COLOR,
              borderBottom: '2px solid #ddd',
              paddingBottom: '10px',
              marginBottom: '30px',
            }}>
              Analysis Results Overview (Job: {jobId.substring(0, 10)}...)
            </Typography>

            {/* KPI Container */}
            <Grid container spacing={3} sx={{ marginBottom: '40px' }}>
              {kpiData.map((kpi, index) => (
                <Grid item xs={12} sm={kpi.isSummary ? 12 : 6} key={index}>
                  <Paper
                    sx={{
                      padding: '20px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '6px',
                      textAlign: kpi.isSummary ? 'left' : 'center',
                      backgroundColor: '#fafafa',
                      minHeight: kpi.isSummary ? 'auto' : '100px',
                    }}
                  >
                    <Typography variant="caption" display="block" sx={{
                      color: '#777',
                      textTransform: 'uppercase',
                      marginBottom: '5px',
                      fontWeight: 600,
                    }}>
                      {kpi.label}
                    </Typography>
                    {kpi.isSummary ? (
                      <Typography variant="body1" component="p" sx={{
                        color: '#333',
                        marginTop: '5px',
                      }}>
                        {kpi.value}
                      </Typography>
                    ) : (
                      <Typography variant="h4" component="h4" sx={{
                        color: kpi.color,
                        marginTop: '5px',
                      }}>
                        {kpi.value}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Chart Section */}
            <Box sx={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
              <Typography variant="h6" component="h3" sx={{ color: '#333', marginBottom: '20px' }}>
                Mean Temperature Over Time
              </Typography>
              {tempChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart 
                    data={tempChartData} 
                    margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    
                    <XAxis 
                        dataKey="date" 
                        stroke="#555" 
                        angle={-15} 
                        textAnchor="end" 
                        type="category"
                        height={50}
                        interval={getXAxisInterval(tempChartData.length)}
                    />
                    
                    <YAxis 
                        label={{ 
                            value: 'Mean Temp (°C)', 
                            angle: -90, 
                            position: 'insideLeft', 
                            fill: '#555' 
                        }}
                    />
                    <Tooltip
                      labelFormatter={(label) => `Date: ${label}`}
                      formatter={(value, name) => [value + ' °C', 'Temperature']}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', padding: '10px' }}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke={ACCENT_COLOR} 
                      dot={false}
                      name="Mean Temperature" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Typography>Insufficient data to generate the temperature chart.</Typography>}
            </Box>    
          </ResultsPaper>
        ) : (
          /* Placeholder/Loading Panel */
          <ResultsPaper elevation={3} sx={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
          }}>
            {isProcessing && <CircularProgress size={50} sx={{ mb: 2, color: PRIMARY_COLOR }} />}
            <Typography variant="h6" sx={{ color: '#777' }}>
              {status === 'IDLE' ? 'Upload a data file to start the analysis or select a job from the history list.' :
               isProcessing ? `Analysis in progress (Job: ${jobId ? jobId.substring(0, 10) : ''}...). Please wait...` :
               status === 'FAILED' ? 'Analysis failed. Check the status box for details.' :
               'Select a completed job from the history list or start a new analysis.'}
            </Typography>
          </ResultsPaper>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: FAILURE_COLOR, fontWeight: 600 }}>
          🗑️ Delete Job
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ marginBottom: 2 }}>
            Are you sure you want to delete this job?
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', fontFamily: 'monospace' }}>
            Job ID: {jobToDelete ? jobToDelete.substring(0, 16) + '...' : ''}
          </Typography>
          <Typography variant="body2" sx={{ color: '#d32f2f', marginTop: 1, fontWeight: 500 }}>
            ⚠️ This action cannot be undone. The job and its results will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={isDeleting}
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            variant="contained"
            sx={{
              backgroundColor: FAILURE_COLOR,
              '&:hover': {
                backgroundColor: '#c62828',
              },
            }}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AnalysisDashboard;
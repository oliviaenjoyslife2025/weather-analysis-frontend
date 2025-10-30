# Weather Data Analysis Frontend

A modern React-based dashboard for weather data analysis, featuring real-time job monitoring, interactive charts, and comprehensive data visualization.

## 🚀 Technology Stack

### Core Framework
- **React 18+** - Modern React with hooks and functional components
- **JavaScript ES6+** - Modern JavaScript features and syntax

### UI Framework & Styling
- **Material-UI (MUI) v5** - Complete UI component library
  - `@mui/material` - Core components (Box, Typography, Button, Paper, etc.)
  - `@mui/material/styles` - Theming and styled components
- **Styled Components** - Custom styled components using MUI's styled API

### Data Visualization
- **Recharts** - React charting library for data visualization
  - LineChart for temperature trends
  - ResponsiveContainer for adaptive layouts
  - Custom tooltips and axis formatting

### HTTP Client & State Management
- **Axios** - Promise-based HTTP client for API communication
- **React Hooks** - Built-in state management
  - `useState` for component state
  - `useEffect` for side effects and lifecycle management

### Notifications & User Feedback
- **React Toastify** - Toast notification system
  - Success/error notifications
  - Customizable positioning and styling
  - Auto-dismiss functionality

### File Handling
- **HTML5 File API** - Native file upload and processing
- **FormData** - Multipart form data for file uploads

## 📁 Project Structure

```
src/
├── AnalysisDashboard.jsx    # Main dashboard component
└── README.md               # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** or **yarn** package manager
- **Backend API** running on `http://127.0.0.1:8000`

### Installation Steps

1. **Navigate to the project directory**
   ```bash
   cd "Certificate/Frontend Project/weather-analysis-frontend"
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - The dashboard should load automatically

## 🔧 Configuration

### API Configuration
The frontend is configured to communicate with the backend API:

```javascript
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/';
```

### Polling Configuration
Job status is polled every 10 seconds:

```javascript
const POLL_INTERVAL = 10000; // Poll job status every 10 seconds
```

## 🎨 Features

### 📊 Dashboard Components

#### 1. **File Upload & Analysis**
- Drag-and-drop file upload
- Support for CSV, XLSX, XLS formats
- Real-time upload progress
- File validation and error handling

#### 2. **Job Status Monitoring**
- Real-time job status updates
- Visual status indicators (PENDING, RUNNING, SUCCESS, FAILURE)
- Automatic polling every 10 seconds
- Manual refresh capability

#### 3. **Past 24H Job History**
- List of recent analysis jobs
- Job statistics and counts
- Interactive job selection
- Delete functionality with confirmation
- Scrollable list (shows first 3, scroll for more)

#### 4. **Data Visualization**
- **Mean Temperature Over Time** - Interactive line chart
- **KPI Cards** - Key performance indicators
- **Regression Analysis** - Statistical insights
- **Time Series Data** - Historical trends

#### 5. **Interactive Features**
- Job selection and result viewing
- Delete jobs with confirmation dialog
- Toast notifications for user feedback
- Responsive design for different screen sizes

### 🎯 Key Functionalities

#### **File Upload Process**
1. User selects a weather data file
2. File is validated (size, type, content)
3. File is uploaded to backend via multipart form data
4. Backend processes file and returns job ID
5. Frontend polls for completion status
6. Results are displayed when analysis completes

#### **Job Management**
- **View Jobs**: Browse past 24 hours of analysis jobs
- **Select Jobs**: Click to view results of completed jobs
- **Delete Jobs**: Remove jobs with confirmation dialog
- **Status Tracking**: Real-time status updates

#### **Data Display**
- **Charts**: Interactive temperature trend visualization
- **KPIs**: Key metrics in card format
- **Statistics**: Comprehensive analysis results
- **Time Series**: Historical data visualization

## 🎨 UI/UX Design

### Color Scheme
```javascript
const PRIMARY_COLOR = '#107a8b';    // Teal blue
const ACCENT_COLOR = '#0a3d62';     // Dark blue
const SUCCESS_COLOR = '#169950';    // Green
const FAILURE_COLOR = '#d9534f';    // Red
```

### Layout Structure
- **Header**: Application title and branding
- **Left Sidebar**: Upload form and job history (350px width)
- **Main Content**: Results display and charts
- **Responsive**: Adapts to different screen sizes

### Component Styling
- **Material Design**: Following MUI design principles
- **Custom Styling**: Styled components for specific needs
- **Consistent Spacing**: Using MUI theme spacing system
- **Visual Hierarchy**: Clear information architecture

## 🔄 State Management

### Component State
```javascript
// File and upload state
const [file, setFile] = useState(null);
const [jobId, setJobId] = useState(null);
const [status, setStatus] = useState('IDLE');

// Results and data state
const [results, setResults] = useState(null);
const [message, setMessage] = useState('...');

// Job history state
const [pastJobs, setPastJobs] = useState([]);
const [selectedJobId, setSelectedJobId] = useState(null);

// UI state
const [isLoadingJobs, setIsLoadingJobs] = useState(false);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
```

## 🌐 API Integration

### Endpoints Used
- `POST /api/v1/upload/` - File upload and job creation
- `GET /api/v1/status/{job_id}/` - Job status and results
- `GET /api/v1/job-statuses/` - List of recent jobs
- `DELETE /api/v1/delete/{job_id}/` - Delete specific job

### Error Handling
- Network error handling
- API error responses
- User-friendly error messages
- Toast notifications for feedback

## 🚀 Development

### Available Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

### Development Server
- Runs on `http://localhost:3000`
- Hot reload enabled
- Automatic browser refresh on changes

## 📱 Browser Support

- **Chrome** (recommended)
- **Firefox**
- **Safari**
- **Edge**

## 🔧 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure backend server is running on port 8000
   - Check CORS settings in backend
   - Verify API_BASE_URL configuration

2. **File Upload Issues**
   - Check file format (CSV, XLSX, XLS only)
   - Verify file size (max 50MB)
   - Ensure file is not empty

3. **Charts Not Displaying**
   - Check if results data is properly formatted
   - Verify Recharts library is installed
   - Check browser console for errors

## 📄 License

This project is part of a weather data analysis system for educational purposes.

## 👥 Support

For technical support or questions, please refer to the project documentation or contact the development team.
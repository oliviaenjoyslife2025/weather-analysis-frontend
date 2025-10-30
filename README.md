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


## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** or **yarn** package manager
- **Backend API** running on `http://127.0.0.1:8000`

### Installation Steps

1. **Navigate to the project directory**

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev 
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173/`
   - The dashboard should load automatically

## 🔧 Configuration

### API Configuration
The frontend is configured to communicate with the backend API:

```javascript
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/';
```

### Polling Configuration
Job status is polled every 10 seconds:

## Features

### Dashboard Components

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

### Key Functionalities

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


## API Integration

### Endpoints Used
- `POST /api/v1/upload/` - File upload and job creation
- `GET /api/v1/status/{job_id}/` - Job status and results
- `GET /api/v1/job-statuses/` - List of recent jobs
- `DELETE /api/v1/delete/{job_id}/` - Delete specific job


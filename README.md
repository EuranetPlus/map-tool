# EU Map Visualization Application

## Overview

This is a SvelteKit-powered interactive map visualization application specifically designed for European Union country data. The application provides a comprehensive control panel for configuring and customizing map visualizations, with a unique one-click deployment feature.

<img width="1552" alt="Bildschirmfoto 2025-01-17 um 09 47 40" src="https://github.com/user-attachments/assets/9d7ffc73-a758-48b4-99e0-4ee6326e836d" />

## Key Features

### Data Visualization

- Interactive map of European Union countries
- Supports various dataset types (values, binary)
- Flexible data input via CSV
- Multiple color scheme options

### Deployment Capabilities

- One-click repository creation and deployment
- Automatic GitHub repository setup
- Instant Vercel deployment
- Batch translation file processing
- Embed code generation for easy sharing

### Customization Options

- Configurable title and subtitle
- Customizable data sources and notes
- Multiple display options:
  - Tooltips
  - Legend
  - Scale bar
- Color scheme selection:
  - Sequential and diverging color schemes
  - Color scheme reversal
  - Custom number of color classes

### Translation Workflow

- Automatic translation of map text to 24 languages
- Translation progress tracking
- Google Cloud Translation API integration
- Vercel Blob Storage preservation

## Prerequisites

- Node.js (version 16 or later)
- npm or pnpm
- GitHub account
- Vercel account
- Google Cloud Translation API key
- A modern web browser

## Technologies Used

- SvelteKit
- Tailwind CSS
- D3.js (for CSV parsing)
- Google Cloud Translation API
- GitHub API
- Vercel Deployment API
- Vercel Blob Storage
- Responsive design

## Environment Variables

To run and deploy the application, you'll need to configure the following environment variables:

### Required Environment Variables

1. **GitHub Integration**

   - `GITHUB_TOKEN`: Personal access token for GitHub repository creation and management
   - `GITHUB_USERNAME`: GitHub username used for repository operations

2. **Vercel Deployment**

   - `DEPLOY_VERCEL_TOKEN`: Authentication token for Vercel deployment

3. **Translation Service**

   - `TRANSLATE_ENGINE`: Translation service to use (e.g., "google")
   - `GOOGLE_API_KEY`: API key for Google Cloud Translation service

4. **Vercel Blob Storage**
   - `BLOB_READ_WRITE_TOKEN`: Token for reading and writing to Vercel Blob storage

### Example .env File

```plaintext
# GitHub Configuration
GITHUB_TOKEN=ghp_your_github_personal_access_token
GITHUB_USERNAME=your_github_username

# Vercel Deployment
DEPLOY_VERCEL_TOKEN=your_vercel_deployment_token

# Translation Configuration
TRANSLATE_ENGINE=google
GOOGLE_API_KEY=your_google_cloud_translation_api_key

# Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_read_write_token
```

### Security Recommendations

- Never commit your `.env` file to version control
- Use environment-specific `.env` files (e.g., `.env.development`, `.env.production`)
- Rotate tokens and keys periodically
- Limit token permissions to only necessary scopes

### Configuration Steps

1. Create a `.env` file in the project root
2. Copy the example variables above
3. Replace placeholder values with your actual tokens and keys
4. Ensure the `.env` file is added to `.gitignore`

### Obtaining Tokens

- **GitHub Token**: [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- **Vercel Token**: [Vercel Account Tokens](https://vercel.com/account/tokens)
- **Google Cloud Translation API Key**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### Troubleshooting

- Verify all tokens have the necessary permissions
- Check that API keys are correctly configured
- Ensure environment variables are not exposed publicly

## Translation Workflow: From Input to Multilingual Map

### Comprehensive Translation Process

The application provides a seamless, automated translation workflow that transforms user-input text into a fully multilingual map experience:

#### 1. Source Content Input

- Users input original text through the control panel
- Translatable content includes:
  - Map title
  - Subtitle
  - Data source description
  - Notes
  - Additional metadata

#### 2. Translation Generation

- Utilizes Google Cloud Translate API
- Supports 24 European languages (Bulgarian, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, German, Greek, Hungarian, Irish, Italian, Latvian, Lithuanian, Maltese, Polish, Portuguese, Romanian, Slovak, Slovenian, Spanish, Swedish)

#### 3. Translation Batch Processing

- Translations generated in batches of 4 languages
- Handles potential translation errors gracefully
- Provides detailed progress tracking

#### 4. Blob Storage Preservation

- Translated content saved to Vercel Blob Storage
- Each language gets a dedicated JSON file
- Public URLs generated for easy access
- Ensures translation persistence and retrieval

#### 5. Repository Commitment

- Translated JSON files committed to GitHub repository
- Enables version control of translations
- Provides backup and historical tracking

#### 6. Map Interface Integration

- Translated files populate language dropdown
- Allows users to switch between languages dynamically
- Seamless user experience across multiple languages

### Technical Translation Workflow Diagram

```
User Input Text
    ↓
Google Cloud Translation API
    ↓
24 Language Translations
    ↓
Vercel Blob Storage (language_code.json)
    ↓
GitHub Repository Commit
    ↓
Map Interface Language Selector
```

### Error Handling and Resilience

- Partial translation support
- Fallback to original text if translation fails
- Detailed error logging
- Batch processing with retry mechanisms

### Performance Considerations

- Batch processing minimizes API calls
- Caching of translation results
- Efficient storage and retrieval mechanisms

### Privacy and Compliance

- Utilizes secure Google Cloud Translation API
- Temporary storage with controlled access
- Complies with EU multilingual requirements

## Deployment Workflow and API Sequence

### API Call Sequence

The deployment process involves a carefully orchestrated sequence of API calls, each handling a specific phase of the map creation and deployment:

#### 1. Translation API `/api/translate`

- **Purpose**: Generate multilingual translations for map content
- **Input**:
  - `sourceObject`: Original text content to translate
  - `batchIndex`: Current processing batch
- **Processing Strategy**:
  - Supports 24 languages
  - Batch-based translation processing
  - Incremental translation generation
- **Features**:
  - Translates map title, subtitle, descriptions
  - Handles text content, source information, notes
  - Provides progress tracking
- **Output**:
  - `translations`: Object containing translations for multiple languages
  - `completedLanguages`: List of languages processed in current batch
  - `hasMore`: Indicates if more batches remain
  - `success`: Translation process status

#### 2. Repository Initialization `/api/init-repository`

- **Purpose**: Create a new GitHub repository
- **Input**:
  - `repoName`: Chosen repository name
  - `mapConfig`: Current map configuration
- **Actions**:
  - Validate repository name
  - Create GitHub repository
  - Prepare initial project structure
- **Output**:
  - `repoUrl`: URL of the created GitHub repository

#### 3. Translation File Commitment `/api/commit-files`

- **Purpose**: Commit translation files to the repository
- **Input**:
  - `repoName`: Repository name
  - `translations`: Batch of language translations
  - `isLastBatch`: Flag for final batch
- **Processing Strategy**:
  - Batch processing (6 languages per batch)
  - Fallback to single file processing if batch fails
- **Features**:
  - Tracks translation progress
  - Handles partial success scenarios
  - Provides retry mechanism

#### 4. Storage Cleanup `/api/cleanup-storage`

- **Purpose**: Remove temporary files and manage storage
- **Input**: None
- **Actions**:
  - Clear temporary translation and configuration files
  - Report remaining storage blobs
- **Output**:
  - `remainingBlobs`: Number of files left in storage

#### 5. Vercel Deployment `/api/deploy-vercel`

- **Purpose**: Deploy the repository to Vercel
- **Input**:
  - `repoName`: Repository to deploy
- **Actions**:
  - Connect GitHub repository to Vercel
  - Configure project settings
  - Trigger deployment
- **Output**:
  - `projectUrl`: Deployed project URL
  - Generates embed code

### Comprehensive Workflow

1. **Translation Generation**

   - Collect all translatable content
   - Generate translations across 24 languages
   - Batch-process translations

2. **Repository Preparation**

   - Create GitHub repository
   - Validate project structure

3. **Translation File Management**

   - Commit translation files
   - Handle batch processing
   - Manage translation progress

4. **Storage Optimization**

   - Clean up temporary files
   - Manage storage resources

5. **Deployment**
   - Deploy to Vercel
   - Generate project URL
   - Create embed code

### Deployment Resilience

- Robust retry mechanism (up to 3 attempts)
- Detailed error tracking
- Partial success support for translations
- Graceful fallback strategies

### Error Handling Capabilities

- Retry mechanism for each API call
- Exponential backoff between retries
- Detailed error logging
- Ability to resume from last successful step

## Data Input Format

The application requires a CSV with the following columns:

- `country`: Full country name
- `id`: Two-letter EU country code
- `value`: Numerical value (can be null)
- `extraInfo`: Boolean indicator

### Example CSV

```csv
country,id,value,extraInfo
Austria,AT,0.035,FALSE
Belgium,BE,0.083,FALSE
```

## Map Configuration Options

### Dataset Types

- **Values**: Numerical data visualization
- **Binary**: Binary (true/false) data representation

### Display Options

- Tooltips toggle
- Legend visibility
- Scale bar display
- Custom unit labels
- Override scale bar values

### Color Scheme Configuration

#### Scheme Types

- **Sequential**: Single-hue color gradients
- **Diverging**: Contrasting color schemes

#### Color Customization

- Choose from multiple predefined color schemes
- Reverse color order
- Select number of color classes (3-9)

### Deployment Considerations

#### GitHub Repository

- Automatically creates a new repository
- Supports repository names with letters, numbers, hyphens, and underscores

#### Vercel Deployment

- Automatic project setup
- Generates project URL
- Provides embed code for easy integration
- Seamless GitHub repository integration

## Troubleshooting

- Ensure CSV data matches required format
- Check browser console for any runtime errors
- Verify GitHub and Vercel account connections
- Review deployment step messages
- Confirm Google Cloud Translation API key is valid

## Error Handling

- Robust retry mechanism for API requests
- Detailed error messages
- Partial success tracking for translations
- Fallback to original text if translation fails

## Getting Started

### Local Development

1. Clone the repository:

   ```bash
   git clone https://your-repository-url.git
   cd your-project-directory
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Contact

Alsino Skowronnek: https://github.com/alsino/

## Additional Resources

- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Vercel Deployment Documentation](https://vercel.com/docs/concepts/deployments/overview)
- [Google Cloud Translation API Documentation](https://cloud.google.com/translate/docs)

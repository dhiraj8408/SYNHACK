# Google Drive Integration Setup

This document explains how to set up Google Drive integration for file uploads in the VNIT-LMS.

## Prerequisites

1. A Google Cloud Project
2. Google Drive API enabled
3. Service Account credentials

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

## Step 2: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `vnit-lms-drive-service`
   - Description: `Service account for VNIT LMS file uploads`
4. Click "Create and Continue"
5. Skip role assignment (optional)
6. Click "Done"

## Step 3: Generate Service Account Key

1. Click on the created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file
6. Save it as `credentials.json` in the `backend/` directory

**⚠️ IMPORTANT:** Add `credentials.json` to `.gitignore` to prevent committing credentials!

## Step 4: Create Google Drive Folders (REQUIRED)

**IMPORTANT:** Service accounts don't have storage quota. You MUST create folders in **YOUR personal Google Drive** and share them with the service account.

### Create Folders in Your Personal Google Drive:

1. **Materials Folder**: For course materials
   - Go to your personal Google Drive (drive.google.com)
   - Create a new folder (e.g., "VNIT-LMS Materials")
   - Right-click the folder > "Share"
   - Add the service account email (from `credentials.json` - the `client_email` field)
   - Give "Editor" permission
   - Click "Send"
   - Copy the folder ID from the URL (the long string after `/folders/` in the URL)

2. **Assignments Folder**: For assignment files
   - Create another folder in your personal Google Drive (e.g., "VNIT-LMS Assignments")
   - Share it with the service account email with "Editor" permission
   - Copy the folder ID

3. **Submissions Folder**: For student submissions
   - Create another folder in your personal Google Drive (e.g., "VNIT-LMS Submissions")
   - Share it with the service account email with "Editor" permission
   - Copy the folder ID

**Why this is necessary:** Service accounts cannot store files in their own drive. Files must be uploaded to folders in your personal drive that are shared with the service account.

## Step 5: Configure Environment Variables

Add the following to your `.env` file in the `backend/` directory:

```env
# Google Drive Configuration
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
GOOGLE_DRIVE_FOLDER_ID=your_default_folder_id_here

# Optional: Specific folder IDs for different file types
GOOGLE_DRIVE_MATERIALS_FOLDER_ID=your_materials_folder_id_here
GOOGLE_DRIVE_ASSIGNMENTS_FOLDER_ID=your_assignments_folder_id_here
GOOGLE_DRIVE_SUBMISSIONS_FOLDER_ID=your_submissions_folder_id_here
```

## Step 6: Share Folders with Service Account

For each folder you created:

1. Open the folder in Google Drive
2. Click "Share"
3. Add the service account email (found in `credentials.json` as `client_email`)
4. Give "Editor" permission
5. Click "Send"

## How It Works

1. **File Upload Flow**:
   - User uploads a file through the frontend
   - Backend receives the file via Multer
   - Google Drive service uploads the file to Google Drive
   - Returns a shareable Google Drive link
   - Link is stored in the database

2. **Fallback Mechanism**:
   - If Google Drive is not configured or upload fails
   - System automatically falls back to local file storage
   - Files are stored in `backend/uploads/` directory

3. **Link Handling**:
   - If a Google Drive link is provided directly, it's stored as-is
   - The system detects Google Drive links automatically

## Testing

1. Start the backend server
2. Upload a file through the application
3. Check the database - the `fileUrl` should be a Google Drive link
4. Verify the file is accessible via the link

## Troubleshooting

### Error: "Google Drive is not configured"
- Check that `GOOGLE_APPLICATION_CREDENTIALS` points to the correct file
- Verify `credentials.json` exists and is valid
- Check that the file path is correct (use `./credentials.json` for same directory)

### Error: "Failed to upload file to Google Drive"
- Check service account permissions on the folder
- Verify the folder ID is correct (should be just the ID, not the full URL)
- Check Google Drive API is enabled in Google Cloud Console
- Run the test utility: `node src/utils/driveTest.js`

### Error: "Service Accounts do not have storage quota"
**This is the most common error!** Service accounts cannot store files in their own drive.

**Solution:** You MUST create folders in **YOUR personal Google Drive** and share them with the service account:

1. Create folders in your personal Google Drive (not in the service account's drive)
2. Share each folder with the service account email (from `credentials.json`)
3. Give "Editor" permission to the service account
4. Use the folder IDs from your personal drive folders

**Files will appear in your personal Google Drive folders** - exactly where you created them!

### Files not visible in Google Drive
If you followed Step 4 correctly, files should appear in the folders you created in your personal Google Drive. If not:

1. Verify the folder IDs in `.env` are correct (from your personal drive, not service account)
2. Check that folders are shared with the service account email
3. Verify the service account has "Editor" permission (not just "Viewer")
4. Make sure you're looking in your personal Google Drive, not the service account's drive

### Files not accessible (403/404 errors)
- Ensure folders are shared with the service account email
- Verify the service account has "Editor" permission on the folder
- Check that files have "Anyone with the link can view" permission (set automatically)
- Verify the file URL in database is a Google Drive link (starts with `https://drive.google.com`)

### Testing Google Drive Setup
Run the test utility to verify everything is working:
```bash
node src/utils/driveTest.js
```

This will:
- Test authentication
- Verify folder access
- Test file upload
- Check permissions

## Security Notes

1. **Never commit `credentials.json` to version control**
2. **Use environment variables for sensitive data**
3. **Rotate service account keys periodically**
4. **Limit service account permissions to only what's needed**
5. **Monitor Google Drive API usage**

## File Organization

Files are organized in Google Drive as follows:
- **Materials**: `/Materials/` folder (or custom folder)
- **Assignments**: `/Assignments/` folder (or custom folder)
- **Submissions**: `/Submissions/` folder (or custom folder)

You can customize folder structure by setting the respective environment variables.


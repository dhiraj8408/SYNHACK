# Cloudinary Setup Guide

Cloudinary is a cloud-based media management platform that provides file storage, optimization, and preview capabilities.

## Why Cloudinary?

- ✅ **Easy Setup**: Simple API key configuration
- ✅ **Built-in Previews**: Automatic thumbnail and preview generation
- ✅ **Multiple File Types**: Supports images, videos, PDFs, documents
- ✅ **Free Tier**: 25GB storage, 25GB bandwidth per month
- ✅ **No Complex Permissions**: Unlike Google Drive service accounts
- ✅ **Direct URLs**: Files accessible via direct links
- ✅ **Optimization**: Automatic image/video optimization

## Step 1: Create Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account (no credit card required)
3. Verify your email

## Step 2: Get API Credentials

1. After logging in, go to your [Dashboard](https://console.cloudinary.com/console)
2. You'll see your **Cloud Name**, **API Key**, and **API Secret**
3. Copy these values (you'll need them for `.env`)

## Step 3: Configure Environment Variables

Add the following to your `backend/.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dhiraj-vnit-lms
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## Step 4: Test the Setup

Restart your backend server. You should see:
```
Cloudinary service initialized successfully
```

## How It Works

1. **File Upload**: Files are uploaded to Cloudinary
2. **Automatic Processing**: Cloudinary generates:
   - Direct download URL
   - Preview URL (optimized for viewing)
   - Thumbnail URL (for previews)
3. **Storage**: Files are organized in folders:
   - `materials/` - Course materials
   - `assignments/` - Assignment files
   - `submissions/` - Student submissions

## File Preview Support

Cloudinary automatically generates previews for:

- **Images**: Thumbnails and optimized previews
- **Videos**: Video thumbnails and optimized playback
- **PDFs**: First page preview as image
- **Documents**: Direct download links

## Free Tier Limits

- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month
- **Uploads**: Unlimited

For most LMS use cases, the free tier is sufficient.

## Security

- API Secret should be kept secure (never commit to git)
- Files are stored securely in Cloudinary's infrastructure
- URLs are signed and secure by default

## Troubleshooting

### Error: "Cloudinary is not configured"
- Check that all three environment variables are set
- Verify the values are correct (no extra spaces)
- Restart the server after adding environment variables

### Upload Fails
- Check your API credentials
- Verify you haven't exceeded free tier limits
- Check Cloudinary dashboard for error messages

### Files Not Accessible
- Check the URL format in the database
- Verify Cloudinary account is active
- Check file permissions in Cloudinary dashboard

## Migration from Google Drive

If you were using Google Drive:
1. Old files will continue to work (local storage fallback)
2. New uploads will use Cloudinary
3. No need to migrate existing files unless desired


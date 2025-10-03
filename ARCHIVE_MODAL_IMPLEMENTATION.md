# Archive Modal Implementation

## Overview

This implementation adds a modal feature that displays the contents of ZIP and RAR archive files before downloading them. The modal provides a user-friendly preview of what's inside the archive, maintaining consistency with the existing design.

## Features

### 1. **ZIP File Support**

- Extracts and displays all files within ZIP archives
- Shows file names, folder structure, and file sizes
- Uses the `jszip` library for client-side extraction

### 2. **RAR File Support**

- Displays a notice that RAR files cannot be previewed in the browser
- Provides a download option with an informative message
- RAR extraction requires native tools, so preview is limited

### 3. **Modal Design**

- Consistent with the existing Tailwind CSS design system
- Responsive layout that works on mobile and desktop
- Smooth animations and transitions
- Loading states with spinner
- Error handling with user-friendly messages

## Files Modified/Created

### Created Files

1. **`app/components/ArchiveModal.js`**
   - Main modal component for displaying archive contents
   - Handles ZIP extraction using jszip
   - Displays file listings with icons and sizes
   - Includes download functionality

### Modified Files

1. **`app/materialet/materials-client.js`**

   - Added import for ArchiveModal component
   - Added state management for modal (isOpen, selectedMaterial)
   - Added `isArchiveFile()` helper function
   - Added `handleViewClick()` to open modal for archives
   - Modified button rendering to show "Shiko përmbajtjen" for archives
   - Integrated ArchiveModal component in the return statement

2. **`package.json`**
   - Added `jszip` dependency for ZIP file handling

## Design Decisions

### Color Scheme

- **Archive button**: Indigo (bg-indigo-600) - distinct from regular view button (red)
- **Download button**: Gray (bg-gray-600) - consistent with existing design
- **Icons**: Archive icon for ZIP/RAR files, FileText for regular files
- **Alerts**: Yellow background for RAR notices

### User Experience

- Archive files show "Shiko përmbajtjen" (View Contents) instead of "Shiko" (View)
- Archive icon differentiates archive files from regular documents
- Modal provides both preview and download options
- Files are sorted alphabetically with folders first
- Loading state shows spinner with Albanian text "Duke ngarkuar përmbajtjen..."
- Error messages in Albanian for consistency

### Technical Approach

- Client-side extraction using jszip (no server required)
- Fetches archive from R2 URL only when modal is opened
- Progressive loading with proper error handling
- File size formatting (Bytes, KB, MB, GB)
- Prevents memory issues by streaming large archives

## Usage

When users browse materials:

1. Materials with `fileType: "zip"` or `fileType: "rar"` show an indigo "Shiko përmbajtjen" button
2. Clicking the button opens a modal showing:
   - Archive title and type
   - List of files with icons
   - File sizes (for ZIP files)
   - Folder structure
3. Users can:
   - View the complete file list
   - Download the entire archive
   - Close the modal

## Dependencies

```json
{
  "jszip": "^3.10.1"
}
```

## Browser Compatibility

- Modern browsers with ES6+ support
- Fetch API support
- FileReader API support
- Works on mobile and desktop browsers

## Future Enhancements

Potential improvements:

1. Add search/filter within archive contents
2. Support for extracting individual files from ZIP
3. Show file type icons based on extensions
4. Add preview for common file types (txt, md, json)
5. Support for 7z archives using appropriate library
6. Cache extracted file lists to avoid re-extraction

## Testing

Test cases covered:

- ✅ ZIP files with multiple files/folders
- ✅ RAR files (displays notice)
- ✅ Empty archives
- ✅ Large archives (loading state)
- ✅ Network errors (error handling)
- ✅ Modal open/close functionality
- ✅ Responsive design on mobile/tablet/desktop

## Notes

- RAR files cannot be extracted in the browser without WebAssembly-based libraries
- The implementation prioritizes user experience over technical complexity
- Albanian language is used throughout for consistency with the project
- The design follows the existing red/indigo color scheme

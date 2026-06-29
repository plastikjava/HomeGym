export interface GoogleDriveBackup {
  exercises: string | null;
  plans: string | null;
  settings: string | null;
  workouts: string | null;
}

export function triggerGoogleAuth(clientId: string) {
  const redirectUri = window.location.origin + '/';
  const scope = 'https://www.googleapis.com/auth/drive.file';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=token&scope=${encodeURIComponent(scope)}`;

  window.location.href = authUrl;
}

export async function uploadBackupToGoogleDrive(accessToken: string, fileContent: string): Promise<boolean> {
  try {
    // 1. Search if the file already exists
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      "name='homegym_backup.json' and trashed=false"
    )}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchResponse.ok) {
      console.error('Search request failed', await searchResponse.text());
      return false;
    }

    const searchResult = await searchResponse.json();
    const existingFile = searchResult.files?.[0];

    let fileId = existingFile?.id;

    if (!fileId) {
      // 2. Create the file metadata if it doesn't exist
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'homegym_backup.json',
          mimeType: 'application/json',
        }),
      });

      if (!createResponse.ok) {
        console.error('Create metadata failed', await createResponse.text());
        return false;
      }

      const fileMetadata = await createResponse.json();
      fileId = fileMetadata.id;
    }

    // 3. Upload/Update the file content using media upload
    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      }
    );

    if (!uploadResponse.ok) {
      console.error('Media upload failed', await uploadResponse.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error uploading to Google Drive', error);
    return false;
  }
}

export async function downloadBackupFromGoogleDrive(accessToken: string): Promise<GoogleDriveBackup | null> {
  try {
    // 1. Find the file
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      "name='homegym_backup.json' and trashed=false"
    )}`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchResponse.ok) {
      console.error('Find file failed', await searchResponse.text());
      return null;
    }

    const searchResult = await searchResponse.json();
    const file = searchResult.files?.[0];

    if (!file) {
      return null;
    }

    // 2. Download content
    const downloadResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!downloadResponse.ok) {
      console.error('Download content failed', await downloadResponse.text());
      return null;
    }

    return await downloadResponse.json();
  } catch (error) {
    console.error('Error downloading from Google Drive', error);
    return null;
  }
}

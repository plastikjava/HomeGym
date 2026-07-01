export interface GoogleFitSession {
  id: string;
  name: string;
  description: string;
  startTimeMillis: string;
  endTimeMillis: string;
  application: {
    name: string;
  };
  activityType: number; // 97 is strength training
}

async function getOrCreateDataSource(accessToken: string): Promise<string | null> {
  try {
    const dsBody = {
      dataStreamName: "HomeGymActivities",
      type: "raw",
      dataType: {
        name: "com.google.activity.segment"
      },
      application: {
        name: "HomeGym"
      }
    };

    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataSources', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dsBody),
    });

    const data = await response.json();
    if (response.ok || response.status === 409) {
      return data.dataStreamId;
    }

    // Fallback: list and search
    const listResponse = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataSources', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (listResponse.ok) {
      const list = await listResponse.json();
      const found = list.dataSource?.find((ds: any) => ds.dataStreamName === "HomeGymActivities");
      if (found) return found.dataStreamId;
    }

    return null;
  } catch (err) {
    console.error("Failed to get/create Google Fit DataSource:", err);
    return null;
  }
}

export async function syncWorkoutsToGoogleFit(accessToken: string, workouts: any[]): Promise<boolean> {
  try {
    if (!workouts || !Array.isArray(workouts) || workouts.length === 0) return true;

    // 1. Get or create a custom data source for our app activity segments
    const dataStreamId = await getOrCreateDataSource(accessToken);
    if (!dataStreamId) {
      console.warn("Could not retrieve or create Google Fit DataSource. Synced sessions might be invisible.");
    }

    for (const workout of workouts) {
      if (!workout.completedAt) continue;

      const startTimeMillis = new Date(workout.startedAt).getTime();
      const endTimeMillis = new Date(workout.completedAt).getTime();
      const sessionId = `homegym_${workout.id}`;

      // Convert timestamps to string nanoseconds (required by Google Fit datasets API)
      const startTimeNanos = String(startTimeMillis) + "000000";
      const endTimeNanos = String(endTimeMillis) + "000000";
      const datasetId = `${startTimeNanos}-${endTimeNanos}`;

      // 2. If we have a data stream, write the activity segment dataset first
      // (This is required so Google Fit shows the activity session in the journal/timeline!)
      if (dataStreamId) {
        const datasetBody = {
          dataSourceId: dataStreamId,
          minStartTimeNs: startTimeNanos,
          maxEndTimeNs: endTimeNanos,
          point: [
            {
              startTimeNanos: startTimeNanos,
              endTimeNanos: endTimeNanos,
              dataTypeName: "com.google.activity.segment",
              value: [
                {
                  intVal: 97 // 97 = Weightlifting / Strength Training in Google Fit
                }
              ]
            }
          ]
        };

        const datasetResponse = await fetch(
          `https://www.googleapis.com/fitness/v1/users/me/dataSources/${encodeURIComponent(dataStreamId)}/datasets/${datasetId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(datasetBody),
          }
        );

        if (!datasetResponse.ok) {
          console.error(`Failed to patch activity segment dataset for workout ${workout.id}:`, await datasetResponse.text());
          // We continue anyway, trying to write the session shell
        }
      }

      // 3. Write session metadata container
      const sessionData: GoogleFitSession = {
        id: sessionId,
        name: `HomeGym: ${workout.notes || 'Training'}`,
        description: `HomeGym Trainingseinheit. Dauer: ${Math.round((endTimeMillis - startTimeMillis) / 60000)} Min.`,
        startTimeMillis: String(startTimeMillis),
        endTimeMillis: String(endTimeMillis),
        application: {
          name: "HomeGym"
        },
        activityType: 97 // Weightlifting
      };

      const sessionResponse = await fetch(`https://www.googleapis.com/fitness/v1/users/me/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!sessionResponse.ok) {
        console.error(`Failed to write Google Fit session metadata for workout ${workout.id}:`, await sessionResponse.text());
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("Error syncing workouts to Google Fit:", err);
    return false;
  }
}

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

export async function syncWorkoutsToGoogleFit(accessToken: string, workouts: any[]): Promise<boolean> {
  try {
    if (!workouts || !Array.isArray(workouts) || workouts.length === 0) return true;

    for (const workout of workouts) {
      if (!workout.completedAt) continue;

      const startTimeMillis = new Date(workout.startedAt).getTime();
      const endTimeMillis = new Date(workout.completedAt).getTime();
      const sessionId = `homegym_${workout.id}`;

      // Build session data
      const sessionData: GoogleFitSession = {
        id: sessionId,
        name: `HomeGym: ${workout.notes || 'Training'}`,
        description: `HomeGym Trainingseinheit. Dauer: ${Math.round((endTimeMillis - startTimeMillis) / 60000)} Min.`,
        startTimeMillis: String(startTimeMillis),
        endTimeMillis: String(endTimeMillis),
        application: {
          name: "HomeGym"
        },
        activityType: 97 // Weightlifting / Strength training in Google Fit
      };

      // Write session using Google Fit REST API
      const response = await fetch(`https://www.googleapis.com/fitness/v1/users/me/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        console.error(`Failed to sync workout ${workout.id} to Google Fit:`, await response.text());
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("Error syncing workouts to Google Fit:", err);
    return false;
  }
}

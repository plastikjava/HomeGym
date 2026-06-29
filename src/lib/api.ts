import { Exercise, ExerciseCategory, EquipmentType } from "@/types";

const WGER_BASE_URL = "https://wger.de/api/v2";

// Map wger category IDs to our ExerciseCategory
const categoryMap: Record<number, ExerciseCategory> = {
  10: "core",       // Abs
  8: "arms",        // Arms
  12: "back",       // Back
  14: "legs",       // Calves -> Legs
  15: "cardio",     // Cardio
  11: "chest",      // Chest
  9: "legs",        // Legs
  13: "shoulders",  // Shoulders
};

// Map wger equipment IDs to our EquipmentType
const equipmentMap: Record<number, EquipmentType> = {
  1: "barbell",
  3: "adjustable_dumbbells",
  6: "pull_up_bar",
  7: "bodyweight",
  8: "bench",
  9: "bench", // Incline bench
  10: "kettlebell",
  11: "resistance_bands",
};

export interface WgerExerciseInfo {
  id: number;
  uuid: string;
  category: {
    id: number;
    name: string;
  };
  muscles: Array<{
    id: number;
    name: string;
    name_en: string;
  }>;
  muscles_secondary: Array<{
    id: number;
    name: string;
    name_en: string;
  }>;
  equipment: Array<{
    id: number;
    name: string;
  }>;
  images: Array<{
    id: number;
    image: string;
    thumbnails: {
      small: string;
      medium: string;
    };
    is_main: boolean;
  }>;
  translations: Array<{
    language: number; // 2 = English, 1 = German
    name: string;
    description: string;
  }>;
}

export async function fetchWgerExercises(limit = 40, offset = 0): Promise<Exercise[]> {
  try {
    // language=2 fetches items with English translations, which gives us English names.
    // We can then extract German translations from the translations array.
    const response = await fetch(
      `${WGER_BASE_URL}/exerciseinfo/?language=2&limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch from wger API: ${response.statusText}`);
    }

    const data = await response.json();
    const results: WgerExerciseInfo[] = data.results || [];

    return results.map((item) => {
      // Find English translation
      const translationEn = item.translations.find((t) => t.language === 2);
      // Find German translation
      const translationDe = item.translations.find((t) => t.language === 1);

      const nameEn = translationEn?.name || `Exercise #${item.id}`;
      const nameDe = translationDe?.name || undefined;
      const description = translationDe?.description || translationEn?.description || "";

      // Clean HTML tags from description if present
      const cleanDescription = description.replace(/<[^>]*>/g, "");

      const category = categoryMap[item.category.id] || "full_body";
      
      const equipment = item.equipment
        .map((eq) => equipmentMap[eq.id])
        .filter((eq): eq is EquipmentType => !!eq);

      // Default to bodyweight if no equipment mapped
      if (equipment.length === 0) {
        equipment.push("bodyweight");
      }

      const primaryMuscles = item.muscles.map((m) => m.name_en || m.name);
      const secondaryMuscles = item.muscles_secondary.map((m) => m.name_en || m.name);

      // Extract main image
      const mainImage = item.images.find((img) => img.is_main) || item.images[0];
      const imageUrl = mainImage?.thumbnails?.medium || mainImage?.image || undefined;

      return {
        id: `wger-${item.id}`,
        nameEn,
        nameDe,
        description: cleanDescription,
        category,
        primaryMuscles,
        secondaryMuscles,
        equipment,
        imageUrl,
        isCustom: false,
        wgerId: item.id,
      };
    });
  } catch (error) {
    console.error("Error fetching wger exercises:", error);
    return [];
  }
}

export async function fetchExerciseGif(nameEn: string): Promise<string | null> {
  try {
    const cleanName = nameEn.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    if (!cleanName) return null;

    const words = cleanName.split(/\s+/).filter(Boolean);
    if (words.length === 0) return null;

    // Common stop words and modifiers to help find the core action noun
    const stopWords = new Set([
      "dumbbell", "dumbbells", "barbell", "barbells", "lying", "standing", 
      "assisted", "single", "one", "two", "arm", "arms", "exercise", 
      "demonstration", "with", "on", "in", "of", "and", "the", "a", "an", "side"
    ]);

    // Find the most specific search term
    const specificWords = words.filter(w => !stopWords.has(w));
    
    // Choose search word: use first specific word if available, otherwise first word
    let searchWord = specificWords[0] || words[0];
    
    // Core action word normalization for better API matching
    // e.g. "flys" -> "fly", "curls" -> "curl", "raises" -> "raise"
    if (searchWord && searchWord.endsWith("s") && searchWord.length > 3) {
      if (searchWord.endsWith("flys")) {
        searchWord = "fly";
      } else if (searchWord.endsWith("es")) {
        searchWord = searchWord.slice(0, -2); // raises -> raise, presses -> press
      } else {
        searchWord = searchWord.slice(0, -1); // curls -> curl
      }
    }

    if (!searchWord) return null;

    // Fetch exercises containing this specific search word
    // We increase limit to 100 to get a wide pool of candidates for client-side filtering
    const response = await fetch(
      `https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(searchWord)}&limit=100`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch from ExerciseDB: ${response.statusText}`);
    }

    const json = await response.json();
    if (!json.success || !json.data || json.data.length === 0) {
      return null;
    }

    const candidates: any[] = json.data;

    // Helper to check if a candidate matches a keyword (handles basic singular/plural)
    const matchesKeyword = (candName: string, kw: string) => {
      const name = candName.toLowerCase();
      const word = kw.toLowerCase();
      const baseWord = word.endsWith("s") ? word.slice(0, -1) : word;
      
      // Special mappings
      if (baseWord === "fly" && name.includes("fli")) return true;
      if (baseWord === "crunch" && name.includes("crunches")) return true;

      return name.includes(baseWord);
    };

    // 1. Exact Match of full cleaned name
    const exactMatch = candidates.find(
      (item: any) => item.name.toLowerCase() === cleanName
    );
    if (exactMatch) return exactMatch.gifUrl;

    // 2. Candidate contains ALL words of our query (e.g. "dumbbell", "floor", "press")
    const matchAll = candidates.find((item: any) =>
      words.every(w => matchesKeyword(item.name, w))
    );
    if (matchAll) return matchAll.gifUrl;

    // 3. Candidate contains all SPECIFIC words (e.g. "floor", "press")
    if (specificWords.length > 0) {
      const matchAllSpecific = candidates.find((item: any) =>
        specificWords.every(w => matchesKeyword(item.name, w))
      );
      if (matchAllSpecific) return matchAllSpecific.gifUrl;
    }

    // 4. Candidate contains the core searchWord + at least one other word
    if (words.length > 1) {
      const matchPartial = candidates.find((item: any) =>
        matchesKeyword(item.name, searchWord) && 
        words.some(w => w !== searchWord && matchesKeyword(item.name, w))
      );
      if (matchPartial) return matchPartial.gifUrl;
    }

    // 5. If it's a single word query, exact or prefix match
    if (words.length === 1) {
      const matchSingle = candidates.find((item: any) => 
        matchesKeyword(item.name, searchWord)
      );
      if (matchSingle) return matchSingle.gifUrl;
    }

    // Crucial: If no high-quality match is found, do NOT show a random mismatch.
    // Return null so the UI can fall back to the static image or YouTube search.
    return null;
  } catch (error) {
    console.error("Error fetching ExerciseDB GIF:", error);
    return null;
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  const cleanUrl = url.trim();
  
  // Match youtube shorts (e.g., https://youtube.com/shorts/VIDEO_ID or https://www.youtube.com/shorts/VIDEO_ID)
  const shortsMatch = cleanUrl.match(/(?:youtube\.com\/shorts\/|youtu\.be\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${shortsMatch[1]}&controls=0&modestbranding=1&rel=0`;
  }
  
  // Match standard watch links (e.g., https://youtube.com/watch?v=VIDEO_ID) or shares (https://youtu.be/VIDEO_ID)
  const videoMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i);
  if (videoMatch && videoMatch[1]) {
    return `https://www.youtube.com/embed/${videoMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${videoMatch[1]}&controls=0&modestbranding=1&rel=0`;
  }
  
  return null;
}

export function getEstimatedWorkoutDuration(exercises: { exerciseId: string; targetSets: number }[]): number {
  let totalSeconds = 0;
  exercises.forEach((item) => {
    const isCompound = [
      'floor-press', 'overhead-press', 'pull-up', 
      'glute-bridge', 'hip-thrust', 'single-arm-row'
    ].includes(item.exerciseId);
    
    // Warmup sets (2 sets recommended for compounds)
    if (isCompound) {
      const numWarmupSets = 2;
      const warmupSetDuration = 45;
      const warmupRestDuration = 60; // 60s rest between warmup sets
      totalSeconds += numWarmupSets * (warmupSetDuration + warmupRestDuration);
    }
    
    // Working sets
    const restSeconds = isCompound ? 120 : 90;
    const setDurationSeconds = 45; // 45 seconds per set of work/logging
    totalSeconds += item.targetSets * (setDurationSeconds + restSeconds);
  });
  return Math.round(totalSeconds / 60);
}

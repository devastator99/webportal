
export interface HealthPlanItem {
  id?: string;
  type: 'food' | 'exercise' | 'medication' | 'sleep' | 'mindfulness' | 'water';
  scheduled_time: string;
  description: string;
  frequency: string;
  duration: string | null;
  patient_id?: string;
  nutritionist_id?: string;
  created_at?: string;
}

export interface ProgressLog {
  id: string;
  habit_id: string | null;
  habit_type: string;
  value: number;
  date: string;
  notes: string | null;
  created_at: string;
}

// Helper function to convert database habit type to UI type
export const mapHabitTypeToUIType = (habitType: string): 'food' | 'exercise' | 'mindfulness' | 'sleep' | 'water' => {
  switch (habitType) {
    case 'nutrition':
      return 'food';
    case 'physical':
      return 'exercise';
    case 'sleep':
      return 'sleep';
    case 'mindfulness':
      return 'mindfulness';
    case 'water':
      return 'water';
    default:
      return 'exercise';
  }
};

// Helper function to convert UI habit type to database type
export const mapUITypeToHabitType = (uiType: string): string => {
  switch (uiType) {
    case 'food':
      return 'nutrition';
    case 'exercise':
      return 'physical';
    case 'sleep':
      return 'sleep';
    case 'mindfulness':
      return 'mindfulness';
    case 'water':
      return 'water';
    default:
      return uiType;
  }
};

// Get color based on habit type
export const getHabitTypeColor = (type: string): string => {
  switch (type) {
    case 'food':
      return 'bg-red-50';
    case 'exercise':
      return 'bg-green-50';
    case 'sleep':
      return 'bg-blue-50';
    case 'mindfulness':
      return 'bg-purple-50';
    case 'water':
      return 'bg-blue-50';
    case 'medication':
      return 'bg-yellow-50';
    default:
      return 'bg-gray-50';
  }
};

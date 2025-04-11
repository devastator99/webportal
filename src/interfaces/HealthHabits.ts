
export interface HealthPlanItem {
  id?: string;
  type: 'food' | 'exercise' | 'medication' | 'sleep' | 'mindfulness';
  scheduled_time: string;
  description: string;
  frequency: string;
  duration: string | null;
  patient_id?: string;
  nutritionist_id?: string;
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
export const mapHabitTypeToUIType = (habitType: string): 'food' | 'exercise' | 'meditation' | 'sleep' => {
  switch (habitType) {
    case 'nutrition':
      return 'food';
    case 'physical':
      return 'exercise';
    case 'sleep':
      return 'sleep';
    case 'mindfulness':
      return 'meditation';
    default:
      return 'exercise';
  }
};

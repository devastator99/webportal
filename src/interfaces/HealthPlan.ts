
export interface HealthPlanItem {
  id?: string;
  type: 'food' | 'exercise' | 'medication';
  scheduled_time: string;
  description: string;
  frequency: string;
  duration: string | null;
  patient_id?: string;
  nutritionist_id?: string;
}

export interface PatientNutritionAssignment {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  doctor_id: string;
  created_at: string;
  updated_at: string;
}

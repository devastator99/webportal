
export async function fetchKnowledgeForQuery(
  userQuery: string, 
  supabaseAdmin: any, 
  patientId?: string
) {
  let context = "";
  
  try {
    // First try to get knowledge from chatbot_knowledge table
    const { data: knowledgeData, error: knowledgeError } = await supabaseAdmin
      .rpc('search_chatbot_knowledge', { 
        search_term: userQuery.toLowerCase()
      });
      
    if (knowledgeError) {
      console.error('Error fetching knowledge:', knowledgeError);
    } else if (knowledgeData && knowledgeData.length > 0) {
      for (const item of knowledgeData) {
        context += `Topic: ${item.topic}\n${JSON.stringify(item.content)}\n\n`;
      }
    }
    
    // If patient ID is provided, try to fetch patient-specific data
    if (patientId) {
      try {
        console.log(`Fetching patient data for ID: ${patientId}`);
        
        // Get the doctor assigned to this patient
        const { data: assignment, error: assignmentError } = await supabaseAdmin
          .from('patient_assignments')
          .select('doctor_id')
          .eq('patient_id', patientId)
          .single();
        
        if (!assignmentError && assignment?.doctor_id) {
          // Get medical records/prescriptions
          const { data: prescriptions, error: prescriptionsError } = await supabaseAdmin
            .rpc('get_patient_prescriptions', {
              p_patient_id: patientId,
              p_doctor_id: assignment.doctor_id
            });
          
          if (!prescriptionsError && prescriptions && prescriptions.length > 0) {
            context += "\nPatient Prescriptions:\n";
            for (const prescription of prescriptions) {
              context += `- Date: ${new Date(prescription.created_at).toLocaleDateString()}\n`;
              context += `  Diagnosis: ${prescription.diagnosis}\n`;
              context += `  Prescription: ${prescription.prescription}\n`;
              if (prescription.notes) {
                context += `  Notes: ${prescription.notes}\n`;
              }
              context += "\n";
            }
          }
          
          // Get health plan
          const { data: healthPlan, error: healthPlanError } = await supabaseAdmin
            .rpc('get_patient_health_plan', {
              p_patient_id: patientId
            });
          
          if (!healthPlanError && healthPlan && healthPlan.length > 0) {
            context += "\nPatient Health Plan:\n";
            
            // Group by type
            const groupedItems: Record<string, any[]> = {};
            healthPlan.forEach(item => {
              if (!groupedItems[item.type]) {
                groupedItems[item.type] = [];
              }
              groupedItems[item.type].push(item);
            });
            
            for (const [type, items] of Object.entries(groupedItems)) {
              context += `- ${type.charAt(0).toUpperCase() + type.slice(1)} Plan:\n`;
              for (const item of items) {
                context += `  * ${item.description} - ${item.scheduled_time} (${item.frequency})\n`;
                if (item.duration) {
                  context += `    Duration: ${item.duration}\n`;
                }
              }
              context += "\n";
            }
          }
          
          // Get appointments
          const { data: appointments, error: appointmentsError } = await supabaseAdmin
            .rpc('get_patient_appointments', {
              p_patient_id: patientId
            });
            
          if (!appointmentsError && appointments && appointments.length > 0) {
            context += "\nUpcoming Appointments:\n";
            for (const appt of appointments) {
              context += `- ${new Date(appt.scheduled_at).toLocaleDateString()} at ${new Date(appt.scheduled_at).toLocaleTimeString()} with Dr. ${appt.doctor_first_name} ${appt.doctor_last_name}\n`;
              context += `  Status: ${appt.status}\n`;
            }
            context += "\n";
          }
          
          // Get medical reports
          const { data: reports, error: reportsError } = await supabaseAdmin
            .rpc('get_patient_medical_reports', {
              p_patient_id: patientId
            });
            
          if (!reportsError && reports && reports.length > 0) {
            context += "\nMedical Reports:\n";
            for (const report of reports) {
              context += `- ${report.file_name} (uploaded ${new Date(report.uploaded_at).toLocaleDateString()})\n`;
            }
            context += "\n";
          }
        }
      } catch (patientDataError) {
        console.error('Error fetching patient data:', patientDataError);
      }
    }
    
    // Add doctors data for general questions
    if (userQuery.toLowerCase().includes('doctor') || 
        userQuery.toLowerCase().includes('specialist') || 
        userQuery.toLowerCase().includes('clinic')) {
      const { data } = await supabaseAdmin.rpc('get_doctors_for_chatbot');
      if (data) {
        context += "\nDoctors Information:\n" + JSON.stringify(data) + "\n\n";
      }
    }
    
    console.log("Context length:", context.length);
    return context;
  } catch (error) {
    console.error('Error in fetchKnowledgeForQuery:', error);
    return "";
  }
}

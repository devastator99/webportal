
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export async function fetchKnowledgeForQuery(
  lastUserMessage: string,
  supabaseAdmin: ReturnType<typeof createClient>,
  patientId?: string
) {
  // Preprocess the user's last message to identify if they're asking about specific topics
  let isPackageQuery = lastUserMessage.toLowerCase().includes('package') || 
                        lastUserMessage.toLowerCase().includes('cost') || 
                        lastUserMessage.toLowerCase().includes('price') ||
                        lastUserMessage.toLowerCase().includes('fee');
                        
  let isDoctorQuery = lastUserMessage.toLowerCase().includes('doctor') || 
                       lastUserMessage.toLowerCase().includes('physician') || 
                       lastUserMessage.toLowerCase().includes('specialist') ||
                       lastUserMessage.toLowerCase().includes('ayurvedic');
                       
  let isClinicQuery = lastUserMessage.toLowerCase().includes('clinic') || 
                       lastUserMessage.toLowerCase().includes('location') || 
                       lastUserMessage.toLowerCase().includes('timing') || 
                       lastUserMessage.toLowerCase().includes('contact') ||
                       lastUserMessage.toLowerCase().includes('address');
                       
  let isFaqQuery = lastUserMessage.toLowerCase().includes('faq') || 
                    lastUserMessage.toLowerCase().includes('question');
                    
  let isInsuranceQuery = lastUserMessage.toLowerCase().includes('insurance') || 
                         lastUserMessage.toLowerCase().includes('cover') || 
                         lastUserMessage.toLowerCase().includes('ayushman') ||
                         lastUserMessage.toLowerCase().includes('cghs') ||
                         lastUserMessage.toLowerCase().includes('policy');
  
  // Check if query might be related to medical documents
  let isDocumentQuery = lastUserMessage.toLowerCase().includes('document') ||
                         lastUserMessage.toLowerCase().includes('report') ||
                         lastUserMessage.toLowerCase().includes('lab') ||
                         lastUserMessage.toLowerCase().includes('test') ||
                         lastUserMessage.toLowerCase().includes('analysis') ||
                         lastUserMessage.toLowerCase().includes('diagnosis') ||
                         lastUserMessage.toLowerCase().includes('medical record');
  
  // Check if query is related to prescriptions or health plans
  let isPrescriptionQuery = lastUserMessage.toLowerCase().includes('prescription') ||
                           lastUserMessage.toLowerCase().includes('medicine') ||
                           lastUserMessage.toLowerCase().includes('drug') ||
                           lastUserMessage.toLowerCase().includes('medication') ||
                           lastUserMessage.toLowerCase().includes('treatment');
                          
  let isHealthPlanQuery = lastUserMessage.toLowerCase().includes('health plan') ||
                         lastUserMessage.toLowerCase().includes('plan') ||
                         lastUserMessage.toLowerCase().includes('diet') ||
                         lastUserMessage.toLowerCase().includes('exercise') ||
                         lastUserMessage.toLowerCase().includes('routine') ||
                         lastUserMessage.toLowerCase().includes('schedule') ||
                         lastUserMessage.toLowerCase().includes('program') ||
                         lastUserMessage.toLowerCase().includes('nutrition');
  
  // Check if query is about care team
  let isCareTeamQuery = lastUserMessage.toLowerCase().includes('care team') ||
                       lastUserMessage.toLowerCase().includes('my doctor') ||
                       lastUserMessage.toLowerCase().includes('my nutritionist') ||
                       lastUserMessage.toLowerCase().includes('who is my doctor') ||
                       lastUserMessage.toLowerCase().includes('who is my nutritionist');
  
  // Check if query is about appointments
  let isAppointmentQuery = lastUserMessage.toLowerCase().includes('appointment') ||
                           lastUserMessage.toLowerCase().includes('schedule') ||
                           lastUserMessage.toLowerCase().includes('booking') ||
                           lastUserMessage.toLowerCase().includes('visit') ||
                           lastUserMessage.toLowerCase().includes('meeting') ||
                           lastUserMessage.toLowerCase().includes('consultation');
  
  // Prepare knowledge context from database based on query
  let knowledgeContext = "";
  
  // If a patient ID is provided, fetch patient-specific information
  if (patientId) {
    console.log("Fetching patient-specific information for patient ID:", patientId);
    
    // If care team query, fetch patient's assigned doctor and nutritionist
    if (isCareTeamQuery) {
      try {
        // Call the get_patient_care_team function
        const { data: careTeam, error: careTeamError } = await supabaseAdmin.rpc('get_patient_care_team', {
          p_patient_id: patientId
        });
        
        if (careTeamError) {
          console.error('Error fetching care team:', careTeamError);
        } else if (careTeam && careTeam.length > 0) {
          knowledgeContext += "Here is information about your care team:\n\n";
          
          // Filter out AI bot from the response
          const actualCareTeam = careTeam.filter(member => member.role !== 'aibot');
          
          for (const member of actualCareTeam) {
            knowledgeContext += `${member.role.charAt(0).toUpperCase() + member.role.slice(1)}: Dr. ${member.first_name} ${member.last_name}\n`;
          }
          knowledgeContext += "\n";
        }
      } catch (err) {
        console.error('Error processing care team query:', err);
      }
    }
    
    // Fetch patient profile information
    try {
      const { data: patientProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();
        
      if (profileError) {
        console.error('Error fetching patient profile:', profileError);
      } else if (patientProfile) {
        knowledgeContext += "Your profile information:\n";
        knowledgeContext += `Name: ${patientProfile.first_name || ''} ${patientProfile.last_name || ''}\n`;
        if (patientProfile.phone) knowledgeContext += `Phone: ${patientProfile.phone}\n`;
        knowledgeContext += "\n";
      }
    } catch (err) {
      console.error('Error processing patient profile:', err);
    }
    
    // If prescription query, fetch patient's prescriptions
    if (isPrescriptionQuery) {
      try {
        // First we need to get the patient's doctor
        const { data: doctorData, error: doctorError } = await supabaseAdmin
          .from('patient_doctor_assignments')
          .select('doctor_id')
          .eq('patient_id', patientId)
          .maybeSingle();
        
        if (doctorError) {
          console.error('Error fetching patient doctor:', doctorError);
        } else if (doctorData && doctorData.doctor_id) {
          // Fetch prescriptions using the RPC function
          const { data: prescriptions, error: prescriptionsError } = await supabaseAdmin.rpc(
            'get_patient_prescriptions',
            {
              p_patient_id: patientId,
              p_doctor_id: doctorData.doctor_id
            }
          );
          
          if (prescriptionsError) {
            console.error('Error fetching prescriptions:', prescriptionsError);
          } else if (prescriptions && prescriptions.length > 0) {
            knowledgeContext += "Here are your recent prescriptions:\n\n";
            
            // Sort prescriptions by date (newest first)
            const sortedPrescriptions = prescriptions.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            
            // Take only the most recent 3 prescriptions to avoid information overload
            const recentPrescriptions = sortedPrescriptions.slice(0, 3);
            
            for (const rx of recentPrescriptions) {
              const date = new Date(rx.created_at).toLocaleDateString();
              knowledgeContext += `Date: ${date}\n`;
              knowledgeContext += `Diagnosis: ${rx.diagnosis || 'None provided'}\n`;
              knowledgeContext += `Prescription: ${rx.prescription || 'None provided'}\n`;
              knowledgeContext += `Notes: ${rx.notes || 'None provided'}\n\n`;
            }
          } else {
            knowledgeContext += "You don't have any prescriptions recorded in our system yet.\n\n";
          }
        }
      } catch (err) {
        console.error('Error processing prescription query:', err);
      }
    }
    
    // If health plan query, fetch patient's health plan
    if (isHealthPlanQuery) {
      try {
        // Fetch health plan items using the RPC function
        const { data: healthPlanItems, error: healthPlanError } = await supabaseAdmin.rpc(
          'get_patient_health_plan',
          { p_patient_id: patientId }
        );
        
        if (healthPlanError) {
          console.error('Error fetching health plan:', healthPlanError);
        } else if (healthPlanItems && healthPlanItems.length > 0) {
          knowledgeContext += "Here is your current health plan:\n\n";
          
          // Group items by type
          const foodItems = healthPlanItems.filter(item => item.type === 'food');
          const exerciseItems = healthPlanItems.filter(item => item.type === 'exercise');
          const medicationItems = healthPlanItems.filter(item => item.type === 'medication');
          
          if (foodItems.length > 0) {
            knowledgeContext += "Diet Plan:\n";
            for (const item of foodItems) {
              knowledgeContext += `- ${item.scheduled_time}: ${item.description} (${item.frequency})\n`;
            }
            knowledgeContext += "\n";
          }
          
          if (exerciseItems.length > 0) {
            knowledgeContext += "Exercise Plan:\n";
            for (const item of exerciseItems) {
              knowledgeContext += `- ${item.description} (${item.frequency}`;
              if (item.duration) knowledgeContext += `, Duration: ${item.duration}`;
              knowledgeContext += ")\n";
            }
            knowledgeContext += "\n";
          }
          
          if (medicationItems.length > 0) {
            knowledgeContext += "Medication Schedule:\n";
            for (const item of medicationItems) {
              knowledgeContext += `- ${item.scheduled_time}: ${item.description} (${item.frequency})\n`;
            }
            knowledgeContext += "\n";
          }
        } else {
          knowledgeContext += "You don't have any health plan items recorded in our system yet.\n\n";
        }
      } catch (err) {
        console.error('Error processing health plan query:', err);
      }
    }
    
    // If appointment query, fetch patient's appointments
    if (isAppointmentQuery) {
      try {
        const { data: appointments, error: appointmentError } = await supabaseAdmin.rpc(
          'get_patient_appointments',
          { p_patient_id: patientId }
        );
        
        if (appointmentError) {
          console.error('Error fetching appointments:', appointmentError);
        } else if (appointments && appointments.length > 0) {
          knowledgeContext += "Here are your upcoming appointments:\n\n";
          
          // Sort appointments by date (soonest first)
          const sortedAppointments = appointments.sort((a, b) => 
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
          );
          
          for (const appt of sortedAppointments) {
            const date = new Date(appt.scheduled_at).toLocaleDateString();
            const time = new Date(appt.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            knowledgeContext += `Date: ${date} at ${time}\n`;
            knowledgeContext += `Doctor: Dr. ${appt.doctor_first_name} ${appt.doctor_last_name}\n`;
            knowledgeContext += `Status: ${appt.status}\n\n`;
          }
        } else {
          knowledgeContext += "You don't have any upcoming appointments scheduled.\n\n";
        }
      } catch (err) {
        console.error('Error processing appointment query:', err);
      }
    }
  }
  
  // If document related query, search analyzed documents
  if (isDocumentQuery) {
    try {
      // Search in the analyzed documents for relevant information
      const { data: documents, error } = await supabaseAdmin
        .from('analyzed_documents')
        .select('original_filename, analysis_text, created_at')
        .order('created_at', { ascending: false })
        .limit(3); // Limit to recent documents
      
      if (error) {
        console.error('Error fetching analyzed documents:', error);
      } else if (documents && documents.length > 0) {
        knowledgeContext += "Here is information from recently analyzed medical documents:\n\n";
        
        documents.forEach((doc) => {
          knowledgeContext += `Document: ${doc.original_filename}\n`;
          knowledgeContext += `Analysis: ${doc.analysis_text}\n\n`;
        });
      }
    } catch (err) {
      console.error('Error in document query:', err);
    }
  }
  
  if (isPackageQuery) {
    const { data: packagesData } = await supabaseAdmin.rpc('get_chatbot_knowledge', { topic_filter: 'packages' });
    if (packagesData && packagesData.length > 0) {
      const packages = packagesData[0].content;
      knowledgeContext += "Here is information about our packages:\n";
      packages.forEach((pkg: any) => {
        knowledgeContext += `- ${pkg.name}: ₹${pkg.price} - ${pkg.description}\n`;
      });
    }
  }
  
  if (isDoctorQuery) {
    // Get doctor information from the database using the RPC function
    const { data: doctorsData, error: doctorsError } = await supabaseAdmin.rpc('get_doctors_for_chatbot');
    
    if (doctorsError) {
      console.error('Error fetching doctors:', doctorsError);
    }
    
    if (doctorsData && doctorsData.doctors && doctorsData.doctors.length > 0) {
      knowledgeContext += "Here is information about our doctors:\n";
      doctorsData.doctors.forEach((doc: any) => {
        knowledgeContext += `- Dr. ${doc.name}`;
        if (doc.specialty) knowledgeContext += `, ${doc.specialty}`;
        if (doc.consultation_fee) knowledgeContext += `, Consultation Fee: ₹${doc.consultation_fee}`;
        knowledgeContext += `\n`;
        
        if (doc.visiting_hours) knowledgeContext += `  Visiting Hours: ${doc.visiting_hours}\n`;
        if (doc.clinic_location) knowledgeContext += `  Location: ${doc.clinic_location}\n`;
      });
    } else {
      // Fallback to the chatbot knowledge table if no doctors found in profiles
      const { data: oldDoctorsData } = await supabaseAdmin.rpc('get_chatbot_knowledge', { topic_filter: 'doctors' });
      if (oldDoctorsData && oldDoctorsData.length > 0) {
        const doctors = oldDoctorsData[0].content;
        knowledgeContext += "Here is information about our doctors:\n";
        doctors.forEach((doc: any) => {
          knowledgeContext += `- ${doc.name}, ${doc.specialty}, ${doc.experience} experience, ${doc.qualifications}\n`;
        });
      }
    }
  }
  
  if (isClinicQuery) {
    const { data: clinicData } = await supabaseAdmin.rpc('get_chatbot_knowledge', { topic_filter: 'clinic' });
    if (clinicData && clinicData.length > 0) {
      const clinic = clinicData[0].content;
      knowledgeContext += `Our clinic ${clinic.name} is located at ${clinic.address}. `;
      knowledgeContext += `We are open weekdays ${clinic.hours.weekdays}, Saturday ${clinic.hours.saturday}, and ${clinic.hours.sunday} on Sunday. `;
      knowledgeContext += `Contact: Phone ${clinic.phone}, Email ${clinic.email}\n`;
    }
  }
  
  if (isFaqQuery) {
    const { data: faqsData } = await supabaseAdmin.rpc('get_chatbot_knowledge', { topic_filter: 'faqs' });
    if (faqsData && faqsData.length > 0) {
      const faqs = faqsData[0].content;
      knowledgeContext += "Here are frequently asked questions:\n";
      faqs.forEach((faq: any) => {
        knowledgeContext += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
      });
    }
  }
  
  if (isInsuranceQuery) {
    knowledgeContext += "Here is information about insurance and payment options:\n";
    knowledgeContext += "- We accept most major health insurance providers in India including Star Health, HDFC ERGO, and Bajaj Allianz.\n";
    knowledgeContext += "- We are empanelled with Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY).\n";
    knowledgeContext += "- Central Government Health Scheme (CGHS) coverage is available for eligible patients.\n";
    knowledgeContext += "- We also accept cash, UPI payments (PhonePe, Google Pay, Paytm), credit cards, and debit cards.\n";
    knowledgeContext += "- EMI options are available for treatment packages above ₹10,000.\n";
  }
  
  // Add information about traditional medicine integration
  knowledgeContext += "\nOur clinic combines modern endocrinology with traditional Indian medicine approaches when appropriate. ";
  knowledgeContext += "We offer lifestyle modification programs based on Ayurvedic principles alongside conventional treatments. ";
  knowledgeContext += "Our dieticians are familiar with regional Indian diets and can provide culturally appropriate nutrition advice. ";

  return knowledgeContext;
}


/**
 * Feature flags configuration to control which features are enabled in the application
 */
export const featureFlags = {
  // Set to true to enable chat functionality across the application
  enableChat: true,
  
  // Set to true to enable the AI chatbot widget specifically
  enableChatbotWidget: true,
  
  // Individual dashboard chat controls
  patientDashboardChat: true,
  doctorDashboardChat: true,
  receptionDashboardChat: true,
  
  // Set to true to enable Indian language support in chat
  enableIndianLanguageSupport: true,

  // Set to false by default to hide the video uploader component in the doctor dashboard
  enableDoctorVideoUploader: false
};

// Try to load saved feature flags from localStorage
try {
  const savedFlags = localStorage.getItem('featureFlags');
  if (savedFlags) {
    const parsedFlags = JSON.parse(savedFlags);
    Object.assign(featureFlags, parsedFlags);
  }
} catch (error) {
  console.error("Error loading feature flags from localStorage:", error);
}

/**
 * Updates the feature flags and dispatches an event to notify other components
 * @param newFlags Updated feature flags
 */
export const updateFeatureFlags = (newFlags: Partial<typeof featureFlags>) => {
  Object.assign(featureFlags, newFlags);
  localStorage.setItem('featureFlags', JSON.stringify(featureFlags));
  
  // Dispatch a custom event so other components in the same window can react
  window.dispatchEvent(new CustomEvent('featureFlagsChanged'));
};

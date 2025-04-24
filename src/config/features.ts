/**
 * Feature flags configuration to control which features are enabled in the application
 */
export const featureFlags = {
  // Set to false to disable chat functionality across the application
  enableChat: false,
  
  // Set to false to disable the AI chatbot widget
  enableChatbotWidget: false,
  
  // Disable individual dashboard chat controls
  patientDashboardChat: false,
  doctorDashboardChat: false,
  receptionDashboardChat: false,
  
  // Disable Indian language support in chat
  enableIndianLanguageSupport: false,

  // Disable voice responses from the chatbot
  enableChatbotVoice: false,

  // Keep existing configuration for other features
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

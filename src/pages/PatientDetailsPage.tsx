
import React from "react";
import { useParams } from "react-router-dom";
import { PatientDetails } from "@/components/dashboard/doctor/PatientDetails";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { PatientDetailsMeta } from "@/components/doctor/PatientDetailsMeta";

const PatientDetailsPage = () => {
  const { patientId } = useParams();
  const { isMobile, isTablet } = useResponsive();

  if (!patientId) {
    return <div>Patient ID is required</div>;
  }

  // Set full width for all devices, especially important for iPad
  const containerStyle = {
    width: "100%",
    maxWidth: "100%",
    margin: "0 auto",
    padding: isMobile ? "0.5rem" : isTablet ? "1rem" : "1.5rem",
  };

  return (
    <>
      <PatientDetailsMeta />
      <div style={containerStyle} className="animate-fade-up">
        <PatientDetails patientId={patientId} />
      </div>
    </>
  );
};

export default PatientDetailsPage;


import React from "react";
import { useParams } from "react-router-dom";
import { PatientDetails } from "@/components/dashboard/doctor/PatientDetails";

const PatientDetailsPage = () => {
  const { patientId } = useParams();

  if (!patientId) {
    return <div>Patient ID is required</div>;
  }

  return <PatientDetails patientId={patientId} />;
};

export default PatientDetailsPage;

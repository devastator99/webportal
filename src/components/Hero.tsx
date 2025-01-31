import { Button } from "@/components/ui/button";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { useState } from "react";

export const Hero = () => {
  const [showSchedule, setShowSchedule] = useState(false);

  return (
    <div className="pt-32 pb-20 px-4 bg-white">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-[#7E69AB] mb-6 animate-fade-up">
          Expert Endocrinology Care for Your Health
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-up [animation-delay:200ms]">
          Specialized care for hormonal health, diabetes management, and thyroid disorders with our experienced endocrinologists.
        </p>
        <div className="flex justify-center gap-4 animate-fade-up [animation-delay:400ms]">
          <ScheduleAppointment>
            <Button className="bg-[#9b87f5] hover:bg-[#7E69AB] text-lg px-8 py-6">
              Book Appointment
            </Button>
          </ScheduleAppointment>
          <Button variant="outline" className="text-lg px-8 py-6 border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};
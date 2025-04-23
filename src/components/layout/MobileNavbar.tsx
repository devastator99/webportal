
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, ListChecks, CalendarDays } from "lucide-react";

export const MobileNavbar = () => {
  const location = useLocation();
  // Define navigation items  
  const navItems = [
    {
      label: "My Prescriptions",
      path: "/prescriptions",
      icon: <FileText className="h-6 w-6" />,
      testid: "nav-prescriptions"
    },
    {
      label: "My Habits",
      path: "/habits",
      icon: <ListChecks className="h-6 w-6" />,
      testid: "nav-habits"
    },
    // Add additional nav items as needed
    {
      label: "Appointments",
      path: "/book-appointment",
      icon: <CalendarDays className="h-6 w-6" />,
      testid: "nav-appointments"
    },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 bg-background border-t flex justify-around px-2 py-1 sm:hidden">
      {navItems.map((item) => (
        <Link
          to={item.path}
          key={item.label}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors duration-150 ${
            location.pathname === item.path
              ? "text-primary font-semibold"
              : "text-muted-foreground"
          }`}
          aria-label={item.label}
          data-testid={item.testid}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};


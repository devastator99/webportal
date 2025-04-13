
import React from 'react';
import { Input } from '@/components/ui/input';

interface TimePickerInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export const TimePickerInput: React.FC<TimePickerInputProps> = ({ id, value, onChange }) => {
  // Check if the browser supports time input
  const supportsTimeInput = () => {
    const input = document.createElement('input');
    input.type = 'time';
    return input.type === 'time';
  };

  if (supportsTimeInput()) {
    // Use native time input if supported
    return (
      <Input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    );
  }

  // Fallback for browsers that don't support time input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const val = e.target.value;
    
    if (val === '' || timePattern.test(val)) {
      onChange(val);
    }
  };

  return (
    <Input
      id={id}
      type="text"
      placeholder="HH:MM"
      value={value}
      onChange={handleChange}
      className="w-full"
    />
  );
};

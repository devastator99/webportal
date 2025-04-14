
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  label?: string;
}

export function TimePicker({ id, value, onChange, className, label }: TimePickerProps) {
  const [hours, setHours] = useState<number>(() => {
    const parts = value.split(':');
    if (parts.length >= 1) {
      const hourPart = parts[0].trim();
      if (/^\d+$/.test(hourPart)) {
        return parseInt(hourPart, 10);
      }
    }
    return 9; // Default hour
  });
  
  const [minutes, setMinutes] = useState<number>(() => {
    const parts = value.split(':');
    if (parts.length >= 2) {
      const minutePart = parts[1].trim();
      if (/^\d+$/.test(minutePart)) {
        return parseInt(minutePart, 10);
      }
    }
    return 0; // Default minute
  });
  
  const [period, setPeriod] = useState<'AM' | 'PM'>(() => {
    // Check if the value contains AM/PM
    if (value.toUpperCase().includes('AM')) return 'AM';
    if (value.toUpperCase().includes('PM')) return 'PM';
    
    // If value is in 24-hour format
    const parts = value.split(':');
    if (parts.length >= 1) {
      const hourPart = parts[0].trim();
      if (/^\d+$/.test(hourPart)) {
        const hour = parseInt(hourPart, 10);
        return hour >= 12 ? 'PM' : 'AM';
      }
    }
    
    return 'AM'; // Default period
  });

  const handleHourChange = (newHour: number) => {
    setHours(newHour);
    updateTimeValue(newHour, minutes, period);
  };

  const handleMinuteChange = (newMinute: number) => {
    setMinutes(newMinute);
    updateTimeValue(hours, newMinute, period);
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    setPeriod(newPeriod);
    updateTimeValue(hours, minutes, newPeriod);
  };

  const updateTimeValue = (h: number, m: number, p: 'AM' | 'PM') => {
    const formattedHour = h % 12;
    const hour12 = formattedHour === 0 ? 12 : formattedHour;
    const hourDisplay = p === 'PM' && h < 12 ? h + 12 : hour12;
    const timeString = `${hourDisplay}:${m.toString().padStart(2, '0')} ${p}`;
    onChange(timeString);
  };

  const timeDisplay = value || `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${period}`;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            {timeDisplay}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-4" align="start">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Hour</Label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5, 6].map((hour) => (
                    <Button
                      key={hour}
                      variant={hours % 12 === hour || (hours % 12 === 0 && hour === 12) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleHourChange(hour)}
                      className="w-9 h-9 p-0"
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
                <div className="flex space-x-1 mt-1">
                  {[7, 8, 9, 10, 11, 12].map((hour) => (
                    <Button
                      key={hour}
                      variant={hours % 12 === hour || (hours % 12 === 0 && hour === 12) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleHourChange(hour)}
                      className="w-9 h-9 p-0"
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label>Minute</Label>
              <div className="grid grid-cols-4 gap-1">
                {[0, 15, 30, 45].map((minute) => (
                  <Button
                    key={minute}
                    variant={minutes === minute ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMinuteChange(minute)}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-1">
              <Label>Period</Label>
              <div className="flex space-x-2">
                <Button
                  variant={period === 'AM' ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePeriodChange('AM')}
                >
                  AM
                </Button>
                <Button
                  variant={period === 'PM' ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePeriodChange('PM')}
                >
                  PM
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

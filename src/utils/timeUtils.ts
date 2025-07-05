
// Convert time format - handle both HH:MM:SS and HH:MM AM/PM formats
export const convertTimeToInput = (timeString: string) => {
  if (!timeString) return '';
  
  // If it's already in AM/PM format, return as is
  if (timeString.match(/^\d{1,2}:\d{2}\s*(AM|PM)$/i)) {
    return timeString;
  }
  
  // If it's in HH:MM:SS format, strip seconds and convert to AM/PM
  if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
    const timePart = timeString.substring(0, 5);
    return convertTo12Hour(timePart);
  }
  
  // If it's in HH:MM format (24-hour), convert to AM/PM
  if (timeString.match(/^\d{1,2}:\d{2}$/)) {
    return convertTo12Hour(timeString);
  }
  
  return timeString;
};

// Convert 24-hour time to 12-hour AM/PM format
export const convertTo12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Convert 12-hour AM/PM format to 24-hour format for database storage
export const convertTo24Hour = (time12: string) => {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12;
  
  let [, hours, minutes, ampm] = match;
  let hour24 = parseInt(hours);
  
  if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
};

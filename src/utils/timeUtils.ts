
// Convert time format - handle both HH:MM:SS and HH:MM AM/PM formats
export const convertTimeToInput = (timeString: string) => {
  if (!timeString) return '';
  
  // If it's already in HH:MM format, return as is
  if (timeString.match(/^\d{2}:\d{2}$/)) {
    return timeString;
  }
  
  // If it's in HH:MM:SS format, strip seconds
  if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return timeString.substring(0, 5);
  }
  
  // If it's in AM/PM format, convert to 24-hour
  const ampmMatch = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let [, hours, minutes, ampm] = ampmMatch;
    let hour24 = parseInt(hours);
    
    if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  }
  
  return timeString;
};

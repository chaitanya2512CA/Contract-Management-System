/**
 * Converts a time string (e.g. "09:30 AM", "2:15 PM", "14:30") into minutes from midnight (0-1439).
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toUpperCase();

  // Check 12-hour AM/PM format
  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridian = match12[3];

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Fallback to basic hour:minute
  const parts = cleaned.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }

  return 0;
};

/**
 * Checks whether two events overlap in calendar date and time.
 */
export const doEventsOverlap = (eventA, eventB) => {
  // Compare date (year, month, day)
  const dateA = new Date(eventA.eventDate).toISOString().split('T')[0];
  const dateB = new Date(eventB.eventDate).toISOString().split('T')[0];

  if (dateA !== dateB) {
    return false;
  }

  const startA = parseTimeToMinutes(eventA.startTime);
  const endA = parseTimeToMinutes(eventA.endTime);
  const startB = parseTimeToMinutes(eventB.startTime);
  const endB = parseTimeToMinutes(eventB.endTime);

  // Time overlap logic: StartA < EndB and EndA > StartB
  return startA < endB && endA > startB;
};

/**
 * Scans an array of existing registered events against a candidate event to find conflicts.
 */
export const findScheduleConflict = (candidateEvent, registeredEvents) => {
  for (const existingEvent of registeredEvents) {
    if (!existingEvent || String(existingEvent._id) === String(candidateEvent._id)) {
      continue;
    }

    if (doEventsOverlap(candidateEvent, existingEvent)) {
      return {
        hasConflict: true,
        conflictingEvent: {
          _id: existingEvent._id,
          title: existingEvent.title,
          eventDate: existingEvent.eventDate,
          startTime: existingEvent.startTime,
          endTime: existingEvent.endTime,
          venue: existingEvent.venue,
        },
      };
    }
  }

  return { hasConflict: false, conflictingEvent: null };
};

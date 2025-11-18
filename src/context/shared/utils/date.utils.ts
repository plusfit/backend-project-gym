/**
 * Get current date and time in Uruguay timezone (UTC-3)
 * This ensures consistent timezone handling across the application
 * @returns Date object representing the current time in Uruguay timezone
 */
export function getUruguayTime(): Date {
    const now = new Date();
    const uruguayTime = new Date(now.toLocaleString('en-US', {
        timeZone: 'America/Montevideo'
    }));
    return uruguayTime;
}

/**
 * Format date as access day in YYYY-MM-DD format
 * @param date - Date to format
 * @returns String in YYYY-MM-DD format for local date
 */
export function formatDateAsAccessDay(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get current day name in Spanish
 * @returns String with day name (Lunes, Martes, etc.)
 */
export function getCurrentDayName(): string {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const localTime = getUruguayTime();
    return days[localTime.getDay()];
}

/**
 * Get current time as string in HH:MM format
 * @returns String in HH:MM format
 */
export function getCurrentTimeString(): string {
    const localTime = getUruguayTime();
    return `${localTime.getHours().toString().padStart(2, '0')}:${localTime.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Normalize time format to HH:MM
 * Converts "6" to "06:00", "19" to "19:00", keeps "19:30" as "19:30"
 * @param time - Time string to normalize
 * @returns Normalized time string in HH:MM format
 */
export function normalizeTimeFormat(time: string): string {
    if (!time) return time;

    // If already in HH:MM format, return as is
    if (time.includes(':')) {
        return time;
    }

    // If it's just a number (hour), add :00 for minutes
    const hour = parseInt(time, 10);
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
        return `${hour.toString().padStart(2, '0')}:00`;
    }

    // Return original if can't normalize
    return time;
}

// will use a fixed hr_HR format for consistency
export const toCroatianLocale = (date: Date) => date.toLocaleString("hr-HR", { timeZone: "CET" });

export const parseTime = (timeInMillis: number) => {
    let timeLeft = Math.floor(timeInMillis / 1000);
    let timeString = "";

    const days = Math.floor(timeLeft / (3600 * 24));

    timeLeft -= days * 3600 * 24;

    if (days) {
        timeString += days + "d ";
    }

    const hours = Math.floor(timeLeft / 3600);

    timeLeft -= hours * 3600;

    if (hours) {
        timeString += hours + "h ";
    }

    const minutes = Math.floor(timeLeft / 60);

    timeLeft -= minutes * 60;

    if (minutes) {
        timeString += minutes + "m ";
    }

    if (timeLeft) {
        timeString += timeLeft + "s";
    }

    return timeString;
};

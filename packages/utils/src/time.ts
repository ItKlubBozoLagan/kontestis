// will use a fixed hr_HR format for consistency
export const toCroatianLocale = (date: Date, onlyDate = false) =>
    onlyDate
        ? date.toLocaleDateString("hr-HR", { timeZone: "CET" })
        : date.toLocaleString("hr-HR", { timeZone: "CET" });

export const formatDuration = (durationMillis: number) => {
    let secondsLeft = Math.floor(durationMillis / 1000);
    let timeFormatted = "";

    const days = Math.floor(secondsLeft / (3600 * 24));

    secondsLeft -= days * 3600 * 24;

    if (days > 0) {
        timeFormatted += days + "d ";
    }

    const hours = Math.floor(secondsLeft / 3600);

    secondsLeft -= hours * 3600;

    if (hours > 0) {
        timeFormatted += hours + "h ";
    }

    const minutes = Math.floor(secondsLeft / 60);

    secondsLeft -= minutes * 60;

    if (minutes > 0) {
        timeFormatted += minutes + "m ";
    }

    if (secondsLeft > 0) {
        timeFormatted += secondsLeft + "s ";
    }

    return timeFormatted.trim();
};

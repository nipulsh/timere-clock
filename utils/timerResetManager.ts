import timeSlot from "@/constants/timeSlot";
export class TimerResetManager {
  static checkAndResetTimer(timer: timeSlot): timeSlot {
    if (!timer.resetIntervals || timer.resetIntervals <= 0) {
      return timer; // No reset needed
    }

    const createdDate = new Date(timer.dateCreated);
    const currentDate = new Date();

    // Calculate days difference
    const timeDiff = currentDate.getTime() - createdDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

    // Check if we need to reset
    if (daysDiff >= timer.resetIntervals) {
      // Calculate how many reset cycles have passed
      const resetCycles = Math.floor(daysDiff / timer.resetIntervals);

      // Create new date for the timer (move forward by completed cycles)
      const newCreatedDate = new Date(createdDate);
      newCreatedDate.setDate(
        createdDate.getDate() + resetCycles * timer.resetIntervals
      );

      // Reset the timer
      return {
        ...timer,
        dateCreated: newCreatedDate.toISOString(),
        timer: {
          ...timer.timer,
          isRunning: false,
          secondsLeft: timer.timer.initialSeconds,
          hoursLeft: timer.timer.initialHours,
          minutesLeft: timer.timer.initialMinutes,
          timesStopped: 0,
        },
      };
    }

    return timer; // No reset needed
  }

  static processAllTimers(timers: timeSlot[]) {
    if (!timers || !Array.isArray(timers)) {
      return [];
    }

    let hasChanges = false;
    const processedTimers = timers.map((timer) => {
      const processedTimer = this.checkAndResetTimer(timer);
      if (processedTimer !== timer) {
        hasChanges = true;
      }
      return processedTimer;
    });

    return { timers: processedTimers, hasChanges };
  }
}

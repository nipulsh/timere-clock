type Timer = {
  initialSeconds: number;
  initialHours: number;
  initialMinutes: number;
  id: string;
  isRunning: boolean;
  secondsLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  timesStopped: number;
};

export default Timer;

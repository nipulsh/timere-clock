import { tasks } from "./tasks";
import timer from "./timer";

type timeSlot = {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  color: string;
  dateCreated: string;
  resetIntervals: number;
  timer: timer;
  tasks: tasks;
};

export default timeSlot;

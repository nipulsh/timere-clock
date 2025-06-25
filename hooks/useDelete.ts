import timeSlot from "@/constants/timeSlot";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useDelete = () => {
  const deleteTimer = async (timerId: string): Promise<void> => {
    try {
      // Get current timers from AsyncStorage
      const jsonValue = await AsyncStorage.getItem("timers");
      if (jsonValue) {
        const currentTimers: timeSlot[] = JSON.parse(jsonValue);

        // Filter out the timer to be deleted
        const updatedTimers = currentTimers.filter(
          (timer) => timer.id !== timerId
        );

        // Save updated timers back to AsyncStorage
        await AsyncStorage.setItem("timers", JSON.stringify(updatedTimers));

        console.log(`Timer with id ${timerId} deleted successfully`);
      } else {
        console.log("No timers found in storage");
      }
    } catch (error) {
      console.error("Error deleting timer:", error);
      throw error; // Re-throw so the component can handle it
    }
  };

  return deleteTimer;
};

export default useDelete;

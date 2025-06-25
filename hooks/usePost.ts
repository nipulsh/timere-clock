import timeSlot from "@/constants/timeSlot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";

const STORAGE_KEY = "timers";

interface UsePostReturn {
  saveTimer: (timerToSave: timeSlot) => Promise<boolean>;
  saveAllTimers: (timers: timeSlot[]) => Promise<boolean>;
  deleteTimer: (timerId: string) => Promise<boolean>;
  updateTimer: (
    timerId: string,
    updates: Partial<timeSlot>
  ) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const usePost = (): UsePostReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper function to get all timers
  const getAllTimers = useCallback(async (): Promise<timeSlot[]> => {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      console.error("Error getting timers:", error);
      throw new Error("Failed to retrieve timers from storage");
    }
  }, []);

  const saveTimer = useCallback(
    async (timerToSave: timeSlot): Promise<boolean> => {
      if (!timerToSave || !timerToSave.id) {
        const errorMsg = "Invalid timer data: timer must have an id";
        setError(errorMsg);
        console.error(errorMsg);
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const timers = await getAllTimers();

        // Check if this timer already exists (update) or is new (create)
        const existingTimerIndex = timers.findIndex(
          (timer) => timer.id === timerToSave.id
        );

        if (existingTimerIndex !== -1) {
          // Update existing timer
          timers[existingTimerIndex] = {
            ...timers[existingTimerIndex],
            ...timerToSave,
          };
          console.log(`Updated existing timer with id: ${timerToSave.id}`);
        } else {
          // Add new timer
          timers.push(timerToSave);
          console.log(`Added new timer with id: ${timerToSave.id}`);
        }

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
        return true;
      } catch (error) {
        const errorMsg = `Error saving timer: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        setError(errorMsg);
        console.error(errorMsg, error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getAllTimers]
  );

  const saveAllTimers = useCallback(
    async (timers: timeSlot[]): Promise<boolean> => {
      if (!Array.isArray(timers)) {
        const errorMsg = "Invalid input: timers must be an array";
        setError(errorMsg);
        console.error(errorMsg);
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
        console.log(`Saved ${timers.length} timers`);
        return true;
      } catch (error) {
        const errorMsg = `Error saving all timers: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        setError(errorMsg);
        console.error(errorMsg, error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteTimer = useCallback(
    async (timerId: string): Promise<boolean> => {
      if (!timerId) {
        const errorMsg = "Timer ID is required for deletion";
        setError(errorMsg);
        console.error(errorMsg);
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const timers = await getAllTimers();
        const filteredTimers = timers.filter((timer) => timer.id !== timerId);

        if (filteredTimers.length === timers.length) {
          console.warn(`Timer with id ${timerId} not found`);
          return false;
        }

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredTimers));
        console.log(`Deleted timer with id: ${timerId}`);
        return true;
      } catch (error) {
        const errorMsg = `Error deleting timer: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        setError(errorMsg);
        console.error(errorMsg, error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getAllTimers]
  );

  const updateTimer = useCallback(
    async (timerId: string, updates: Partial<timeSlot>): Promise<boolean> => {
      if (!timerId || !updates) {
        const errorMsg = "Timer ID and updates are required";
        setError(errorMsg);
        console.error(errorMsg);
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const timers = await getAllTimers();
        const timerIndex = timers.findIndex((timer) => timer.id === timerId);

        if (timerIndex === -1) {
          const errorMsg = `Timer with id ${timerId} not found`;
          setError(errorMsg);
          console.error(errorMsg);
          return false;
        }

        // Merge updates with existing timer data
        timers[timerIndex] = { ...timers[timerIndex], ...updates };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
        console.log(`Updated timer with id: ${timerId}`);
        return true;
      } catch (error) {
        const errorMsg = `Error updating timer: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        setError(errorMsg);
        console.error(errorMsg, error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getAllTimers]
  );

  return {
    saveTimer,
    saveAllTimers,
    deleteTimer,
    updateTimer,
    loading,
    error,
    clearError,
  };
};

export default usePost;

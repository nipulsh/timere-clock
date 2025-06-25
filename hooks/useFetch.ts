import timeSlot from "@/constants/timeSlot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const useFetch = () => {
  const [timers, setTimers] = useState<timeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimers = useCallback(async () => {
    try {
      setLoading(true);
      const jsonValue = await AsyncStorage.getItem("timers");
      if (jsonValue) {
        const parsed: timeSlot[] = JSON.parse(jsonValue);
        const hydrated = parsed.map((slot) => ({
          ...slot,
          start: new Date(slot.start),
          end: new Date(slot.end),
        }));

        setTimers(hydrated);
        console.log("Fetched timers:", hydrated);
      } else {
        setTimers([]);
        console.log("No timers found in storage");
      }
    } catch (error) {
      console.error("Error fetching timers:", error);
      setTimers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchTimers();
  }, [fetchTimers]);

  useEffect(() => {
    fetchTimers();
  }, [fetchTimers]);

  return { timers, loading, refetch };
};

export default useFetch;

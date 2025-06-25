import TimerCard from "@/components/timerCard";
import timeSlot from "@/constants/timeSlot";
import useFetch from "@/hooks/useFetch";
import usePost from "@/hooks/usePost";
import { TimerResetManager } from "@/utils/timerResetManager";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const { timers, loading, refetch } = useFetch();
  const [refreshing, setRefreshing] = useState(false);
  const [processedTimers, setProcessedTimers] = useState<timeSlot[]>([]);
  const [isProcessingResets, setIsProcessingResets] = useState(false);
  const router = useRouter();
  const { saveAllTimers, loading: saveLoading, error: saveError } = usePost();

  const navigateTimerPage = () => {
    router.push("/new/create");
  };

  const checkForResets = useCallback(async () => {
    if (!timers || timers.length === 0) {
      setProcessedTimers([]);
      return;
    }

    setIsProcessingResets(true);

    try {
      const result = TimerResetManager.processAllTimers(timers);

      if (Array.isArray(result)) {
        // result is an empty array, no changes needed
        setProcessedTimers([]);
      } else if (result.hasChanges) {
        console.log("Timer resets detected, updating storage...");

        // Use saveAllTimers for batch update - more efficient
        const success = await saveAllTimers(result.timers);

        if (success) {
          console.log("Successfully saved updated timers");
          // Refresh the data from storage to get the latest state
          await refetch();
        } else {
          console.error("Failed to save updated timers");
          // Show error to user
          Alert.alert(
            "Update Failed",
            "Failed to update timer resets. Please try refreshing.",
            [{ text: "OK" }]
          );
          // Still use processed timers for display
          setProcessedTimers(result.timers);
        }
      } else {
        // No changes needed, just update display
        setProcessedTimers(result.timers);
      }
    } catch (error) {
      console.error("Error processing timer resets:", error);
      Alert.alert(
        "Processing Error",
        "An error occurred while checking timer resets.",
        [{ text: "OK" }]
      );
      // Fallback to original timers
      setProcessedTimers(timers);
    } finally {
      setIsProcessingResets(false);
    }
  }, [timers, saveAllTimers, refetch]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      // Check for resets after refresh
      await checkForResets();
    } catch (error) {
      console.error("Error refreshing timers:", error);
      Alert.alert(
        "Refresh Failed",
        "Failed to refresh timers. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleTimerDelete = useCallback(async () => {
    // Refresh data after deletion
    await refetch();
    // Process resets for remaining timers
    await checkForResets();
  }, [refetch, checkForResets]);

  const handleTimerUpdate = useCallback(async () => {
    // Refresh data after any timer update
    await refetch();
    // Process resets for updated timers
    await checkForResets();
  }, [refetch, checkForResets]);

  // Check for resets when timers change
  useEffect(() => {
    if (timers && timers.length > 0 && !loading && !refreshing) {
      checkForResets();
    }
  }, [checkForResets, timers, loading, refreshing]);

  // Check when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active" && !loading && !refreshing) {
        console.log("App became active, checking for timer resets...");
        checkForResets();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [checkForResets, loading, refreshing]);

  // Check when screen focuses
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Show save error if exists
  useEffect(() => {
    if (saveError) {
      Alert.alert("Save Error", `Failed to save timer updates: ${saveError}`, [
        { text: "OK" },
      ]);
    }
  }, [saveError]);

  const displayTimers = processedTimers.length > 0 ? processedTimers : timers;
  const isLoading = loading || isProcessingResets || saveLoading;

  if (loading && !refreshing && !processedTimers.length) {
    return (
      <View className="flex-1 bg-neutral-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-neutral-600 mt-4 text-lg">
          Loading your timers...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="bg-white shadow-sm border-b border-neutral-200">
        <View className="px-6 pt-16 pb-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-3xl font-bold text-neutral-800 mb-1">
                Your Timers
              </Text>
              <View className="flex-row items-center">
                <Text className="text-neutral-500">
                  {displayTimers?.length || 0} timer
                  {(displayTimers?.length || 0) !== 1 ? "s" : ""} created
                </Text>
                {isProcessingResets && (
                  <View className="flex-row items-center ml-3">
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text className="text-blue-500 ml-1 text-sm">
                      Updating...
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={navigateTimerPage}
              className="bg-blue-500 p-4 rounded-2xl shadow-lg"
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Timer List */}
      <View className="flex-1 px-2">
        {displayTimers && displayTimers.length > 0 ? (
          <FlatList
            data={displayTimers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TimerCard
                timer={item}
                onDelete={handleTimerDelete}
                onUpdate={handleTimerUpdate}
              />
            )}
            contentContainerStyle={{
              paddingTop: 20,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#3b82f6"]}
                tintColor="#3b82f6"
              />
            }
          />
        ) : (
          <View className="flex-1 justify-center items-center px-8">
            <View className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-200 items-center">
              <View className="w-20 h-20 bg-neutral-100 rounded-full items-center justify-center mb-6">
                <Ionicons name="timer-outline" size={40} color="#6b7280" />
              </View>

              <Text className="text-2xl font-bold text-neutral-800 mb-3 text-center">
                No Timers Yet
              </Text>
              <Text className="text-neutral-500 text-center mb-6 leading-6">
                Create your first timer to get started with organized time
                management
              </Text>

              <TouchableOpacity
                onPress={navigateTimerPage}
                className="bg-blue-500 px-8 py-4 rounded-2xl flex-row items-center shadow-lg"
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Ionicons name="add-circle" size={24} color="white" />
                <Text className="text-white font-semibold ml-2 text-lg">
                  Create Timer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

import { Link } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AuthLayout from "./_layout";

const LoginScreen = () => {
  console.log("LoginScreen mounted");
  const [currentStep, setCurrentStep] = useState<"method" | "input" | "otp">(
    "method"
  );
  const [authMethod, setAuthMethod] = useState<"mobile" | "email" | "">("");
  const [formData, setFormData] = useState({
    mobile: "",
    email: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [, setOtpSent] = useState(false);

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOTP = async () => {
    if (authMethod === "mobile" && !validateMobile(formData.mobile)) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number");
      return;
    }

    if (authMethod === "email" && !validateEmail(formData.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setOtpSent(true);
      setCurrentStep("otp");
      const contact =
        authMethod === "mobile" ? formData.mobile : formData.email;
      Alert.alert("Success", `OTP sent to ${contact}`);
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP. Please try again.");
      console.error("Error sending OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert("Success", "Login successful!");
      // Navigate to main app or dashboard
      // router.replace('/(tabs)') or your main screen
    } catch (error) {
      Alert.alert("Error", "Invalid OTP. Please try again.");
      console.error("Error sending OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);

    try {
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const contact =
        authMethod === "mobile" ? formData.mobile : formData.email;
      Alert.alert("Success", `OTP resent to ${contact}`);
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
      console.error("Error sending OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  const MethodSelection = () => (
    <View className="flex-1 justify-center">
      <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
        Welcome Back
      </Text>
      <Text className="text-base text-center mb-10 text-gray-600 leading-6">
        Choose your login method
      </Text>

      <TouchableOpacity
        className="bg-white py-5 px-5 rounded-xl mb-4 flex-row items-center border border-gray-200 shadow-sm"
        onPress={() => {
          setAuthMethod("mobile");
          setCurrentStep("input");
        }}
      >
        <Text className="text-2xl mr-4">📱</Text>
        <Text className="text-base font-medium text-gray-900">
          Continue with Mobile Number
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-white py-5 px-5 rounded-xl mb-4 flex-row items-center border border-gray-200 shadow-sm"
        onPress={() => {
          setAuthMethod("email");
          setCurrentStep("input");
        }}
      >
        <Text className="text-2xl mr-4">📧</Text>
        <Text className="text-base font-medium text-gray-900">
          Continue with Email
        </Text>
      </TouchableOpacity>

      <View className="flex-row justify-center mt-8">
        <Text className="text-base text-gray-600">Don t have an account? </Text>
        <Link href="../signup" className="no-underline">
          <Text className="text-base font-medium text-blue-600">Sign Up</Text>
        </Link>
      </View>
    </View>
  );

  const InputForm = () => (
    <View className="flex-1 justify-center">
      <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
        Login
      </Text>
      <Text className="text-base text-center mb-10 text-gray-600 leading-6">
        Enter your {authMethod === "mobile" ? "mobile number" : "email address"}
      </Text>

      <View className="mb-6">
        <Text className="text-base font-medium mb-2 text-gray-900">
          {authMethod === "mobile" ? "Mobile Number" : "Email Address"}
        </Text>
        <TextInput
          className="bg-white py-4 px-4 rounded-xl border border-gray-200 text-base text-gray-900"
          placeholder={
            authMethod === "mobile"
              ? "Enter 10-digit mobile number"
              : "Enter your email address"
          }
          keyboardType={authMethod === "mobile" ? "numeric" : "email-address"}
          autoCapitalize="none"
          maxLength={authMethod === "mobile" ? 10 : undefined}
          value={authMethod === "mobile" ? formData.mobile : formData.email}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              [authMethod]: text,
            })
          }
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        className={`py-4 px-8 rounded-xl items-center mb-4 ${
          loading ? "bg-gray-400" : "bg-blue-600 shadow-lg"
        }`}
        onPress={handleSendOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base font-semibold">Send OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="self-start mt-4 py-2"
        onPress={() => {
          setCurrentStep("method");
          setAuthMethod("");
        }}
      >
        <Text className="text-blue-600 text-base font-medium">← Back</Text>
      </TouchableOpacity>
    </View>
  );

  const OTPVerification = () => (
    <View className="flex-1 justify-center">
      <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
        Enter OTP
      </Text>
      <Text className="text-base text-center mb-10 text-gray-600 leading-6">
        We have sent a 6-digit code to{"\n"}
        {authMethod === "mobile" ? formData.mobile : formData.email}
      </Text>

      <View className="mb-6">
        <Text className="text-base font-medium mb-2 text-gray-900">OTP</Text>
        <TextInput
          className="bg-white py-4 px-4 rounded-xl border border-gray-200 text-base text-gray-900"
          placeholder="Enter 6-digit OTP"
          keyboardType="numeric"
          maxLength={6}
          value={formData.otp}
          onChangeText={(text) => setFormData({ ...formData, otp: text })}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        className={`py-4 px-8 rounded-xl items-center mb-4 ${
          loading ? "bg-gray-400" : "bg-blue-600 shadow-lg"
        }`}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base font-semibold">
            Verify & Login
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center py-3"
        onPress={handleResendOTP}
        disabled={loading}
      >
        <Text className="text-blue-600 text-base font-medium">Resend OTP</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="self-start mt-4 py-2"
        onPress={() => {
          setCurrentStep("input");
          setFormData({ ...formData, otp: "" });
        }}
      >
        <Text className="text-blue-600 text-base font-medium">← Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (currentStep) {
      case "method":
        return <MethodSelection />;
      case "input":
        return <InputForm />;
      case "otp":
        return <OTPVerification />;
      default:
        return <MethodSelection />;
    }
  };
  console.log("Current step:", currentStep);
  return <AuthLayout>{renderContent()}</AuthLayout>;
};

export default LoginScreen;

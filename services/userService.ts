import { supabase } from "./supabaseClient";

const signUpUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) console.error("Error:", error.message);
  else console.log("User created:", data);
};

const LogIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) console.error("Error:", error.message);
  else console.log("User signed in:", data);
};

export { LogIn, signUpUser };

// Sign Up Page
// Displays the user registration form for new account creation
// Handles form submission and new user registration

import AuthForm from "@/components/AuthForm";

/**
 * Sign up page component
 * Shows signup form that submits to /api/auth/register
 */
export default function SignupPage() {
  return <AuthForm mode="signup" />;
}

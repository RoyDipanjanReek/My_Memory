// Login Page
// Displays the user login form
// Handles authentication with email and password

import AuthForm from "@/components/AuthForm";

/**
 * Login page component
 * Shows login form that submits to /api/auth/login
 */
export default function LoginPage() {
  return <AuthForm mode="login" />;
}

import { useState } from "react";

import LoginForm from "../../components/LoginForm";
import AuthSimpleLayout from "../../layouts/Auth/AuthSimpleLayout";

const LOGIN_SUCCESS_TRANSITION_MS = 850;

const Login = () => {
  const [step, setStep] = useState(1);
  

  const handleLoginSuccess = async () => {
   
    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), LOGIN_SUCCESS_TRANSITION_MS);
    });
  };

  return (
    <AuthSimpleLayout >
      
      <LoginForm setStep={setStep} step={step} onLoginSuccess={handleLoginSuccess} />
    </AuthSimpleLayout>
  );
};

export default Login;

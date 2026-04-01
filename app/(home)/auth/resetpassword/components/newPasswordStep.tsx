import { useState } from "react";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";

interface NewPasswordStepProps {
  email: string;
  onSubmit: (newPassword: string, confirmPassword: string) => void;
  isLoading: boolean;
  error: string;
  setError: (error: string) => void;
}

export default function NewPasswordStep({
  email,
  onSubmit,
  isLoading,
  error,
  setError,
}: NewPasswordStepProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const hasError = Boolean(error || localError);

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    
    // Clear errors when user starts typing
    if (error) {
      setError('');
    }
    if (localError) {
      setLocalError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    
    // Clear errors when user starts typing
    if (error) {
      setError('');
    }
    if (localError) {
      setLocalError('');
    }
  };

  const handleInputFocus = () => {
    // Clear errors when input is focused
    if (error) {
      setError('');
    }
    if (localError) {
      setLocalError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLocalError('');

    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    onSubmit(newPassword, confirmPassword);
  };

  return (
    <>
      <h1 className="mb-3 text-left text-[48px] font-[Poppins] font-semibold leading-[60px] text-white">
        Reset Your Password
      </h1>

      {hasError && (
        <div className="mb-3 text-sm text-red-500">{error || localError}</div>
      )}

      <p className="md:mb-6 mb-7 text-left text-sm text-white/90">
        Enter new password for{" "}
        <span className="text-tunga-yellow">{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="md:space-y-5 space-y-6">
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={handleNewPasswordChange}
          onFocus={handleInputFocus}
          placeholder="New password *"
          required
          className="w-full"
          hasError={hasError}
        />

        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          onFocus={handleInputFocus}
          placeholder="Confirm new password *"
          required
          className="w-full"
          hasError={hasError}
        />

        <Button
          variant="secondary"
          type="submit"
          className="w-full"
          loading={isLoading}
          disabled={isLoading}
       
        >
          Reset Password
        </Button>

        <div className="text-white text-[12px] leading-[20px]">
          Your password should contain a mix of numbers, special characters,
          uppercase, and lowercase letters.
        </div>
      </form>
    </>
  );
}
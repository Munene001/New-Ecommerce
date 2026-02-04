import { useState } from "react";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import Link from "next/link";

interface RequestStepProps {
  onSubmit: (email: string) => void;
  isLoading: boolean;
  error: string;
  setError: (error: string) => void;
}

export default function RequestStep({ 
  onSubmit, 
  isLoading, 
  error, 
  setError 
}: RequestStepProps) {
  const [email, setEmail] = useState("");
  const hasFormValue = email.length > 0;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleInputFocus = () => {
    // Clear error when input is focused
    if (error) {
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear any existing errors before submitting
    onSubmit(email);
  };

  return (
    <>
      <h1 className="mb-2 text-left  text-[48px] font-semibold font-[caveat] leading-[60px] text-white">
        Reset Password
      </h1>
      {error && <div className="text-sm text-red-500 mb-3">{error}</div>}
      <p className="mb-6 text-left text-xs text-[#A0AEC0] leading-[20px]">
        Enter your email address to receive a password reset link
      </p>
      
     
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          onFocus={handleInputFocus}
          placeholder="Enter your email *"
          required
          className="w-full"
          hasError={!!error}
          autoComplete="email"
        />
        
        <Button 
          type="submit" 
          className="w-full"
          loading={isLoading}
          disabled={isLoading}
          variant="secondary"
         
        >
          SUBMIT
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-300">
          <Link href="/login" className="text-tunga-yellow hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </>
  );
}
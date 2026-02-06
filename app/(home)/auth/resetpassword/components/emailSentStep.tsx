import Button from "@/app/components/ui/button";
import Link from "next/link";
import { ResetPasswordStep } from "../page";

interface EmailSentStepProps {
  email: string;
  onChangeEmail: () => void;
  isLoading: boolean;
  success: string;
  setStep: (step: ResetPasswordStep) => void;
  setError: (error: string) => void;
}

export default function EmailSentStep({
  email,
  onChangeEmail,
  isLoading,
  success,
  setStep,
  setError
}: EmailSentStepProps) {
  void onChangeEmail;
  void setStep;
  void setError;

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="mb-2 text-left  text-[48px] font-[Poppins] font-semibold leading-[60px] text-white">
        Email Sent
      </h1>

      {success && (
        <div className="text-sm text-white/90 mb-4 leading-[20px]">
          A password reset link has been sent to{" "}
          <span className="text-tunga-yellow">{email}</span>
          . Check your inbox for further instructions.
        </div>
      )}
      <Button className="w-full text-sm" loading={isLoading} variant="secondary">
        <Link href="/auth/login">Back to Login</Link>
      </Button>
    </div>
  );
}
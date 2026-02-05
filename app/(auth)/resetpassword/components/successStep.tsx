import Button from "@/app/components/ui/button";
import Link from "next/link";

interface SuccessStepProps {
  success: string;
}

export default function SuccessStep({ success }: SuccessStepProps) {
  return (
    <div className="md:space-y-3 space-y-4 ">
      <h1 className=" text-left  text-[48px] font-[Poppins] font-semibold leading-[60px] text-white">
        Password Reset
      </h1>

      {success && (
        <div className="text-xs text-white">
          {success}
        </div>
      )}

      <Button className="w-full mt-1 " variant="secondary">
        <Link href="/login">Proceed to Login</Link>
      </Button>
    </div>
  );
}
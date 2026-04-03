import Step from "./step";

export default function FourStepProcess() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
      {/* Step 1 */}
      <Step
        stepNumber={1}
        imageSrc="/images/home/signup.svg"
        imageAlt="Register your business"
        headline="Register Your Shop"
        description="Sign up quickly and create your online shop in minutes. No design skills needed."
        Features={[
          "Enter business name and contact info",
          "Secure login with email or phone",
          "Instantly create your shop URL",
        ]}
      />

      {/* Step 2 */}
      <Step
        stepNumber={2}
        imageSrc="/images/home/supermarket.svg"
        imageAlt="Choose shop type"
        headline="Choose a Shop Type"
        description="Pick a shop template that matches your business style. Each template is ready-to-go."
        Features={[
          "Pre-made shop templates",
          "Templates designed for instant selling",
          "Optimized for MPesa payments",
        ]}
      />

      {/* Step 3 */}
      <Step
        stepNumber={3}
        imageSrc="/images/home/web-design.svg"
        imageAlt="Customize shop"
        headline="Customize Your Shop"
        description="Make simple tweaks like changing colors, logo, and brand name to match your identity."
        Features={[
          "Adjust primary colors and fonts",
          "Add your logo",
          "Minor layout tweaks only — no design headaches",
        ]}
      />

      {/* Step 4 */}
      <Step
        stepNumber={4}
        imageSrc="/images/home/payment-method.svg"
        imageAlt="Post products and start selling"
        headline="Add Products & Start Selling"
        description="Upload your products, share your shop link, and start accepting payments immediately via MPesa."
        Features={[
          "Add product images, descriptions, and prices",
          "Share your shop link anywhere",
          "Receive payments instantly via MPesa",
        ]}
      />
    </div>
  );
}

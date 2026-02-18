export default function DashCard({
    title,
    value,
    icon: Icon,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    subtitle?: string;
  }) {
    return (
      <div className="dash-summary-card border  rounded-lg p-4 bg-black bg-[url('/assets/mazehex4.svg')] font-[Poppins]">
        <div className="flex justify-between mb-5">
          <span className="text-[16px] text-white">{title}</span>
          <Icon size={16} className="h-6 w-6 text-three" />
        </div>
        <div>
          <h3 className="text-white text-[24px] font-bold">{value}</h3>
          {subtitle && <p className="text-xs text-[#CECFD2] mt-1">{subtitle}</p>}
        </div>
      </div>
    );
  }
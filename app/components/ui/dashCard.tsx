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
      <div className="dash-summary-card border  rounded-lg md:p-4 p-6 bg-black bg-[url('/assets/mazehex4.svg')] font-[Poppins]">
        <div className="flex justify-between mb-5">
          <span className="md:text-[16px] text-[18px] text-white">{title}</span>
          <Icon size={16} className="md:h-6 md:w-6 h-8 w-8 text-three" />
        </div>
        <div>
          <h3 className="text-white text-[24px] font-bold">{value}</h3>
          {subtitle && <p className="md:text-xs  text-sm text-[#CECFD2] mt-1">{subtitle}</p>}
        </div>
      </div>
    );
  }
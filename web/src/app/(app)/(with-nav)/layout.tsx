import { BottomNav } from "@/components/layout/BottomNav";

export default function WithNavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-24">
      {children}
      <BottomNav />
    </div>
  );
}

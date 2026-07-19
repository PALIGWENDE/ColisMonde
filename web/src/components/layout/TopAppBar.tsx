"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  actions?: React.ReactNode;
}

export function TopAppBar({ title, showBack, showLogo, actions }: TopAppBarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-surface px-container-padding-mobile py-4 shadow-soft-glow">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="text-primary transition-transform active:scale-95"
            aria-label="Retour"
          >
            <Icon name="arrow_back" />
          </button>
        )}
        {showLogo && (
          <Link href="/accueil" className="flex items-center gap-2">
            <Icon name="language" className="text-primary" />
            <span className="font-headline-md text-headline-md font-bold text-primary">ColisMonde</span>
          </Link>
        )}
        {title && <h1 className="font-headline-md text-headline-md font-bold text-primary">{title}</h1>}
      </div>
      <div className="flex items-center gap-4">{actions}</div>
    </header>
  );
}

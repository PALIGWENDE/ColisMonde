"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";

const TABS = [
  { href: "/accueil", icon: "home", label: "Accueil" },
  { href: "/recherche", icon: "search", label: "Rechercher" },
  { href: "/messages", icon: "chat_bubble", label: "Messages" },
  { href: "/profil", icon: "person", label: "Profil" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around bg-surface px-4 py-2 pb-safe shadow-[0px_-4px_20px_rgba(0,158,73,0.08)] md:hidden">
      {TABS.slice(0, 2).map((tab) => (
        <NavItem key={tab.href} tab={tab} active={pathname.startsWith(tab.href)} />
      ))}

      <div className="relative -top-6">
        <Link
          href="/annonce/nouvelle"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-on-primary shadow-lg transition-transform active:scale-90"
          aria-label="Créer une annonce"
        >
          <Icon name="add" size={30} />
        </Link>
      </div>

      {TABS.slice(2).map((tab) => (
        <NavItem key={tab.href} tab={tab} active={pathname.startsWith(tab.href)} />
      ))}
    </nav>
  );
}

function NavItem({ tab, active }: { tab: (typeof TABS)[number]; active: boolean }) {
  return (
    <Link
      href={tab.href}
      className={clsx(
        "flex flex-col items-center justify-center rounded-xl px-3 py-1 transition-transform active:scale-90",
        active ? "bg-primary-container/10 text-primary" : "text-on-surface-variant hover:bg-surface-container-high",
      )}
    >
      <Icon name={tab.icon} filled={active} />
      <span className="font-label-sm text-label-sm">{tab.label}</span>
    </Link>
  );
}

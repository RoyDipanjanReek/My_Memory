import Link from "next/link";

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "#faq", label: "FAQ" }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Start free trial" },
      { href: "/workspace", label: "Workspace" }
    ]
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
      { href: "#", label: "Security" }
    ]
  },
  {
    title: "Social",
    links: [
      { href: "#", label: "X" },
      { href: "#", label: "LinkedIn" },
      { href: "#", label: "GitHub" }
    ]
  }
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-pink-400 to-fuchsia-400 text-sm font-bold text-slate-950">
              M
            </span>
            <div>
              <p className="font-semibold text-white">MemoryOS</p>
              <p className="text-sm text-slate-400">The developer memory layer for modern teams.</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Built to help teams capture what works, retrieve it quickly, and stop paying the
            cost of repeated effort.
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold text-white">{column.title}</p>
            <div className="mt-4 space-y-3">
              {column.links.map((link) => (
                <Link
                  className="block text-sm text-slate-400 transition hover:text-white"
                  href={link.href}
                  key={link.label}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}

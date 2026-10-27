import {
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  Menu,
  Route,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { landingContent } from "@/content/landing";

const icons = { boxes: Boxes, route: Route, "shield-check": ShieldCheck } as const;

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { hero, proofPoints, workflow, painPoints, security, cta, footer } = landingContent;

  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f0e8] text-[#17252a]">
      <header className="border-b border-[#ddd8ce] bg-[#f5f0e8]/95">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Beranda Jejakstok">
            <img className="size-9 rounded-lg object-cover" src="/assets/image/icon/icon.jpg" alt="" />
            <span className="text-sm font-bold tracking-[0.14em] uppercase">{footer.productName}</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#4e5e5d] md:flex" aria-label="Navigasi landing page">
            <a href="#workflow" className="transition-colors hover:text-[#2f7a68]">Alur kerja</a>
            <a href="#control" className="transition-colors hover:text-[#2f7a68]">Pengendalian</a>
            <Link to="/login" className="rounded-md border border-[#c7c1b6] px-4 py-2.5 text-[#17252a] transition-colors hover:border-[#2f7a68] hover:text-[#2f7a68]">Masuk</Link>
          </nav>
          <button type="button" className="grid size-11 place-items-center rounded-md border border-[#c7c1b6] md:hidden" aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-[#ddd8ce] px-5 py-4 md:hidden" aria-label="Navigasi landing page pada perangkat seluler">
            <div className="mx-auto flex max-w-[1200px] flex-col gap-4 text-sm font-medium">
              <a href="#workflow" onClick={() => setMenuOpen(false)}>Alur kerja</a>
              <a href="#control" onClick={() => setMenuOpen(false)}>Pengendalian</a>
              <Link to="/login" className="text-[#2f7a68]">Masuk ke ruang kerja</Link>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section className="bg-[#17252a] text-[#f5f0e8]">
          <div className="mx-auto grid max-w-[1200px] gap-14 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-28">
            <div>
              <p className="mb-6 text-xs font-bold tracking-[0.18em] text-[#e78652] uppercase">{hero.eyebrow}</p>
              <h1 className="max-w-2xl text-4xl leading-[1.12] font-bold tracking-[-0.025em] sm:text-5xl lg:text-[52px]">{hero.title}</h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#d3d5ca] sm:text-lg">{hero.description}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href={hero.primaryCta.href} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2f7a68] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#3b8f79]">
                  {hero.primaryCta.label}<ArrowRight size={17} />
                </a>
                <Link to={hero.secondaryCta.href} className="inline-flex items-center justify-center rounded-md border border-[#64726c] px-5 py-3.5 text-sm font-bold text-[#f5f0e8] transition-colors hover:border-[#e78652] hover:text-[#f1ad88]">{hero.secondaryCta.label}</Link>
              </div>
            </div>
            <div className="relative rounded-2xl border border-[#40504d] bg-[#293b3d] p-5 shadow-[0_20px_50px_rgb(0_0_0_/_0.2)] sm:p-7">
              <img className="mb-6 aspect-[16/8] w-full rounded-xl object-cover object-center opacity-90" src={hero.image.src} alt={hero.image.alt} />
              <div className="flex items-center justify-between border-b border-[#40504d] pb-5">
                <div><p className="text-xs font-bold tracking-[0.14em] text-[#a6c7b5] uppercase">{hero.visualLabel}</p><p className="mt-1 text-sm text-[#d3d5ca]">Peta serah terima gudang</p></div>
                <span className="rounded-full bg-[#e78652]/15 px-3 py-1 text-xs font-bold text-[#f1ad88]">Alur contoh</span>
              </div>
              <div className="my-9 flex items-center justify-between gap-2">
                {workflow.steps.map((step, index) => (
                  <div className="flex min-w-0 flex-1 items-center gap-2" key={step.number}>
                    <div className="min-w-0"><span className="text-[11px] font-bold text-[#a6c7b5]">{step.number}</span><p className="mt-1 truncate text-sm font-bold">{step.label}</p></div>
                    {index < workflow.steps.length - 1 && <ChevronRight className="shrink-0 text-[#e78652]" size={17} />}
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-[#64726c] bg-[#17252a] p-4">
                <div className="flex items-center gap-3"><span className="size-2 rounded-full bg-[#74b99b]" /><span className="text-sm font-bold">Pergerakan terlacak</span></div>
                <p className="mt-2 text-sm leading-6 text-[#c0c9bd]">{hero.visualCaption}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#ddd8ce] bg-white">
          <div className="mx-auto grid max-w-[1200px] gap-0 px-5 py-6 sm:grid-cols-3 lg:px-8">
            {proofPoints.map((point, index) => {
              const Icon = icons[point.icon];
              return <div className={`flex gap-4 py-5 sm:px-6 ${index > 0 ? "border-t border-[#ddd8ce] sm:border-t-0 sm:border-l" : ""}`} key={point.label}><Icon className="mt-1 shrink-0 text-[#2f7a68]" size={22} /><div><h2 className="text-sm font-bold">{point.label}</h2><p className="mt-1 text-sm leading-6 text-[#4e5e5d]">{point.description}</p></div></div>;
            })}
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-[1200px] px-5 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl"><p className="text-xs font-bold tracking-[0.14em] text-[#2f7a68] uppercase">{workflow.eyebrow}</p><h2 className="mt-4 text-3xl leading-[1.2] font-bold tracking-[-0.02em] sm:text-4xl">{workflow.title}</h2><p className="mt-5 text-base leading-8 text-[#4e5e5d] sm:text-lg">{workflow.description}</p></div>
          <div className="mt-14 grid gap-4 md:grid-cols-4">
            {workflow.steps.map((step) => <article className="overflow-hidden rounded-lg border border-[#ddd8ce] bg-white shadow-[0_1px_2px_rgb(23_37_42_/_0.06)]" key={step.number}><img className="aspect-[4/3] w-full object-cover" src={step.image.src} alt={step.image.alt} /><div className="p-5"><span className="text-sm font-bold text-[#d96b3b]">{step.number}</span><h3 className="mt-8 text-xl font-bold">{step.label}</h3><p className="mt-3 text-sm leading-6 text-[#4e5e5d]">{step.description}</p></div></article>)}
          </div>
        </section>

        <section id="control" className="bg-[#e3ebe3]">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8 lg:py-28">
            <div><p className="text-xs font-bold tracking-[0.14em] text-[#2f7a68] uppercase">Sumber friksi operasional</p><h2 className="mt-4 text-3xl leading-[1.2] font-bold tracking-[-0.02em] sm:text-4xl">Ubah ketidakpastian operasional menjadi keputusan yang terlihat.</h2></div>
            <div className="grid gap-4">
              {painPoints.map((point) => <article className="flex gap-4 rounded-lg border border-[#cbd8cc] bg-[#f5f0e8] p-5" key={point.problem}><span className={`mt-1 size-2.5 shrink-0 rounded-full ${point.accent === "teal" ? "bg-[#2f7a68]" : point.accent === "amber" ? "bg-[#d96b3b]" : "bg-[#416a8a]"}`} /><div><h3 className="font-bold">{point.problem}</h3><p className="mt-2 text-sm leading-6 text-[#4e5e5d]">{point.answer}</p></div></article>)}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1200px] gap-12 px-5 py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div><p className="text-xs font-bold tracking-[0.14em] text-[#2f7a68] uppercase">{security.eyebrow}</p><h2 className="mt-4 text-3xl leading-[1.2] font-bold tracking-[-0.02em] sm:text-4xl">{security.title}</h2><p className="mt-5 text-base leading-8 text-[#4e5e5d] sm:text-lg">{security.description}</p><ul className="mt-7 space-y-4">{security.points.map((point) => <li className="flex items-start gap-3 text-sm font-medium" key={point}><Check className="mt-0.5 shrink-0 text-[#2f7a68]" size={18} />{point}</li>)}</ul></div>
          <div className="rounded-2xl bg-[#293b3d] p-6 text-[#f5f0e8] sm:p-8"><img className="mb-6 aspect-[16/7] w-full rounded-xl object-cover" src={security.image.src} alt={security.image.alt} /><div className="flex items-center justify-between border-b border-[#40504d] pb-5"><span className="text-sm font-bold">{security.controlPanel.label}</span><ShieldCheck className="text-[#a6c7b5]" size={21} /></div><div className="mt-6 space-y-3">{security.controlPanel.items.map((item) => <div className="flex items-center justify-between rounded-md border border-[#52625d] px-4 py-3" key={item.label}><span className="text-sm text-[#d3d5ca]">{item.label}</span><span className={`text-xs font-bold ${item.status === "Terjaga" ? "text-[#f1ad88]" : "text-[#a6c7b5]"}`}>{item.status}</span></div>)}</div></div>
        </section>

        <section className="px-5 pb-20 lg:px-8 lg:pb-28"><div className="mx-auto max-w-[1200px] rounded-2xl bg-[#17252a] px-6 py-12 text-[#f5f0e8] sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-10"><div><p className="text-xs font-bold tracking-[0.14em] text-[#f1ad88] uppercase">{cta.eyebrow}</p><h2 className="mt-4 max-w-2xl text-3xl leading-[1.2] font-bold tracking-[-0.02em] sm:text-4xl">{cta.title}</h2><p className="mt-4 max-w-xl leading-7 text-[#d3d5ca]">{cta.description}</p></div><Link to={cta.button.href} className="mt-8 inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-[#d96b3b] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#e78652] lg:mt-0">{cta.button.label}<ArrowRight size={17} /></Link></div></section>
      </main>

      <footer className="border-t border-[#ddd8ce] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-8 text-sm text-[#4e5e5d] sm:flex-row sm:items-center sm:justify-between lg:px-8"><div className="flex items-center gap-4"><img className="h-10 w-auto max-w-[180px] rounded object-cover object-left" src={footer.image.src} alt={footer.image.alt} /><div><p className="font-bold text-[#17252a]">{footer.productName}</p><p className="mt-1">{footer.description}</p></div></div><div className="flex items-center gap-5"><Link className="font-medium text-[#2f7a68] hover:text-[#17252a]" to="/login">Masuk</Link><p>© {new Date().getFullYear()} {footer.copyright}</p></div></div>
      </footer>
    </div>
  );
}

import type { ReactNode } from 'react'

interface Section {
  id: string
  title: string
}

interface LegalPageProps {
  title: string
  subtitle: string
  updated: string
  sections: Section[]
  children: ReactNode
}

export default function LegalPage({ title, subtitle, updated, sections, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-cream pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 pb-8 border-b-2 border-cream-deep">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange text-xs font-bold mb-4">
            ⚖️ Legal
          </span>
          <h1 className="font-display font-black text-text-primary mb-2" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
            {title}
          </h1>
          <p className="text-text-muted text-sm">{subtitle}</p>
          <p className="text-text-muted text-xs mt-2">Última actualización: {updated}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Table of contents */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="sticky top-28 bg-white border-2 border-cream-deep rounded-3xl p-5 shadow-card">
              <p className="text-xs font-black text-text-primary uppercase tracking-widest mb-3">Contenido</p>
              <ul className="space-y-1.5">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-xs text-text-muted hover:text-orange transition-colors block py-0.5 leading-snug"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Content */}
          <article className="flex-1 min-w-0 prose-legal">
            {children}
          </article>
        </div>
      </div>
    </div>
  )
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-28">
      <h2 className="font-display font-black text-xl text-text-primary mb-4 pb-2 border-b border-cream-deep">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
        {children}
      </div>
    </section>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-sm text-text-secondary leading-relaxed">{children}</p>
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="space-y-1.5 pl-4 list-disc marker:text-orange">{children}</ul>
}

export function LI({ children }: { children: ReactNode }) {
  return <li className="text-sm text-text-secondary leading-relaxed">{children}</li>
}

export function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-cream-deep my-4">
      <table className="w-full text-sm">
        <thead className="bg-cream-warm">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left text-xs font-bold text-text-primary uppercase tracking-wide px-4 py-3 border-b border-cream-deep">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-deep bg-white">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-cream-warm/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-text-secondary text-xs leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="bg-orange-50 border border-orange/15 rounded-2xl px-5 py-4 text-sm text-text-secondary">
      {children}
    </div>
  )
}

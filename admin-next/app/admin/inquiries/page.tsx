import { Mail, Inbox, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata = { title: 'Inquiries — Gitay Gold Admin' };

/**
 * Placeholder for the future inbox of contact-form submissions.
 *
 * The static site has a "Start a project" CTA. Phase 3 will add a public
 * Server Action that accepts {name, email, project_type, brief}, writes to
 * a new `inquiries` table (with rate-limit + spam check), and surfaces
 * here as a triage queue.
 *
 * Server Component: no interactivity needed yet.
 */
export default function InquiriesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Inbox
          </p>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Contact form inquiries
            <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/30">
              Coming soon
            </Badge>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            This is where contact-form submissions from the public site will
            land — name, email, project type, brief, and a triage status.
            Lands in Phase&nbsp;3.
          </p>
        </div>
      </div>

      {/* ── Mock list (visual mock only — no data) ───────────────── */}
      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card/60">
        <div className="border-b border-border px-4 py-3 text-xs text-muted-foreground">
          Preview · 0 of {0} inquiries
        </div>
        <ul className="divide-y divide-border/60">
          {MOCK_INQUIRIES.map((m, i) => (
            <li
              key={i}
              className="flex items-center gap-4 px-4 py-3 opacity-50"
            >
              <div className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">
                <Mail className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {m.when}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {m.preview}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {m.status}
              </Badge>
            </li>
          ))}
        </ul>
        <div className="grid place-items-center px-6 py-12 text-center">
          <Inbox className="mb-3 size-8 text-muted-foreground/60" aria-hidden />
          <p className="text-sm font-medium">No real inquiries yet</p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            The list above is a layout preview. Once the public form ships,
            messages will appear here, sortable by status and triaged inline.
          </p>
        </div>
      </div>

      {/* ── What's planned ───────────────────────────────────────── */}
      <Card className="mt-6 border-dashed bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-orange-500" aria-hidden />
            What ships in Phase&nbsp;3
          </CardTitle>
          <CardDescription>
            The public &ldquo;Start a project&rdquo; CTA wires up to a
            Server Action that writes to an `inquiries` table.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <ul className="space-y-1.5">
            <li>· Triage status (new · reviewing · replied · archived)</li>
            <li>· Rate-limit + spam check at the action boundary</li>
            <li>· Email notifications on new submission</li>
          </ul>
          <ul className="space-y-1.5">
            <li>· Filter by project type / status / date range</li>
            <li>· One-click archive · reply via mailto: deeplink</li>
            <li>· CSV export for offline triage</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

const MOCK_INQUIRIES = [
  {
    name: 'Acme Studio',
    preview: 'Looking for a brand refresh and Shopify rebuild before Q3…',
    when: '—',
    status: 'New',
  },
  {
    name: 'Lumen Co.',
    preview: 'Hi! We saw the Luminary case study — would love to discuss…',
    when: '—',
    status: 'New',
  },
  {
    name: 'Field & Mark',
    preview: 'Need help with motion direction for a launch film, six-week…',
    when: '—',
    status: 'Reviewing',
  },
];

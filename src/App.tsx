import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  ArrowDown, ArrowRight, ArrowUp, BookOpen, Check, CheckCircle2,
  ChevronDown, ChevronRight, CircleHelp, Compass, Lightbulb, ListChecks,
  Menu, Moon, RotateCcw, Search, ShieldCheck, Sparkles, Sun, Target,
  X, Zap, type LucideIcon,
} from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
type Definition = { term: string; kind: string; description: string; example: string };
const definitions: Definition[] = [
  { term: 'Mathematical proof', kind: 'Foundation', description: 'A finite, logically connected argument that shows a statement follows necessarily from accepted facts, definitions, and earlier results.', example: 'Each step should be clear enough that another reader can see why it follows.' },
  { term: 'Proposition', kind: 'Statement', description: 'A mathematical statement that is either true or false, and is usually established with a proof.', example: 'If n is even, then n² is even.' },
  { term: 'Theorem', kind: 'Result', description: 'An important mathematical statement that has been proved to be true.', example: 'There are infinitely many prime numbers.' },
  { term: 'Lemma', kind: 'Helper result', description: 'A proved statement used as a stepping-stone toward proving a larger result.', example: 'A useful fact about parity can be a lemma in a number theory proof.' },
  { term: 'Corollary', kind: 'Consequence', description: 'A result that follows directly and often quickly from a theorem already proved.', example: 'A theorem about divisibility may immediately imply a corollary about multiples.' },
  { term: 'Conjecture', kind: 'Open question', description: 'A statement believed to be true based on evidence, but for which no proof is yet known.', example: 'Testing many examples can suggest a conjecture, but cannot prove it.' },
  { term: 'Hypothesis', kind: 'Starting point', description: 'An assumption or condition in a statement—the “if” part from which the argument begins.', example: 'In “if n is even, then n² is even,” n is even is the hypothesis.' },
  { term: 'Conclusion', kind: 'Goal', description: 'The claim to be established—the “then” part of a conditional statement.', example: 'In “if n is even, then n² is even,” n² is even is the conclusion.' },
  { term: 'Direct proof', kind: 'Method', description: 'Start from the hypothesis and use definitions and valid deductions to reach the conclusion.', example: 'Write an even integer as 2k, then simplify its square.' },
  { term: 'Proof by contradiction', kind: 'Method', description: 'Assume the statement is false, derive an impossibility, and conclude that the original statement must be true.', example: 'Assume √2 is rational; reduced numerator and denominator would both have to be even.' },
  { term: 'Proof by contrapositive', kind: 'Method', description: 'To prove “if P then Q,” prove the logically equivalent statement “if not Q then not P.”', example: 'To prove even n² implies even n, suppose n is odd and show n² is odd.' },
  { term: 'Proof by induction', kind: 'Method', description: 'Prove a base case, then show that if a claim holds for k, it also holds for k + 1.', example: 'This establishes the claim for every natural number in sequence.' },
  { term: 'Proof by cases', kind: 'Method', description: 'Split all possibilities into exhaustive cases, prove the claim in each case, then combine them.', example: 'For an integer n, consider whether n is even or odd.' },
];

type Example = { title: string; statement: string; method: string; steps: string[]; level: string };
const examples: Example[] = [
  { title: 'The square of an even number', statement: 'If n is even, then n² is even.', method: 'Direct proof', level: 'Parity · 3 steps', steps: ['Since n is even, by definition n = 2k for some integer k.', 'Square both sides: n² = (2k)² = 4k² = 2(2k²).', 'Because 2k² is an integer, n² is twice an integer. Therefore n² is even.'] },
  { title: 'The irrationality of √2', statement: '√2 is irrational.', method: 'Proof by contradiction', level: 'Number theory · 5 steps', steps: ['Assume, for contradiction, that √2 is rational. Then √2 = a/b for coprime integers a and b, with b ≠ 0.', 'Squaring gives 2 = a²/b², so a² = 2b². Thus a² is even, and therefore a is even.', 'Write a = 2k. Substitution gives 4k² = 2b², so b² = 2k². Thus b is even too.', 'Now both a and b are even, contradicting that they were coprime.', 'The assumption was impossible, so √2 is irrational.'] },
  { title: 'An even square has an even root', statement: 'If n² is even, then n is even.', method: 'Proof by contrapositive', level: 'Parity · 3 steps', steps: ['We prove the contrapositive: if n is odd, then n² is odd.', 'Write n = 2k + 1 for some integer k. Then n² = (2k + 1)² = 2(2k² + 2k) + 1.', 'This is odd. Therefore the contrapositive—and thus the original statement—is true.'] },
  { title: 'The sum of the first n integers', statement: 'For every integer n ≥ 1, 1 + 2 + ··· + n = n(n + 1)/2.', method: 'Proof by induction', level: 'Sequences · 4 steps', steps: ['Base case n = 1: the left side is 1 and 1(1 + 1)/2 = 1.', 'Inductive hypothesis: assume 1 + 2 + ··· + k = k(k + 1)/2 for some k ≥ 1.', 'For k + 1, add k + 1 to both sides: 1 + ··· + k + (k + 1) = k(k + 1)/2 + (k + 1) = (k + 1)(k + 2)/2.', 'This is the formula with n = k + 1. By induction it holds for every n ≥ 1.'] },
];
const navItems = [
  { path: '/', label: 'Home', icon: Compass },
  { path: '/definitions', label: 'Definitions', icon: BookOpen },
  { path: '/examples', label: 'Examples', icon: ListChecks },
  { path: '/activities', label: 'Activities', icon: Zap },
  { path: '/checker', label: 'Proof checker', icon: ShieldCheck },
  { path: '/exercises', label: 'Exercises', icon: Target },
];
function readStore<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function useSaved<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStore(key, initial));
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}
function Button({ children, onClick, variant = 'solid', className = '', testId, type = 'button', disabled }: { children: ReactNode; onClick?: () => void; variant?: 'solid' | 'outline' | 'quiet'; className?: string; testId: string; type?: 'button' | 'submit'; disabled?: boolean }) {
  return <button type={type} data-testid={testId} onClick={onClick} disabled={disabled} className={`btn btn-${variant} ${className}`}>{children}</button>;
}
function Eyebrow({ children }: { children: ReactNode }) { return <div className="eyebrow">{children}</div>; }
function Heading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="page-heading page-in"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{description}</p></header>;
}
function AppShell() {
  const [location] = useLocation();
  const [dark, setDark] = useSaved('prooflab-theme', false);
  const [progress, setProgress] = useSaved('prooflab-progress', { activityScore: 0, completed: [] as string[], streak: 0 });
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  const markComplete = (id: string, points = 1) => setProgress(p => p.completed.includes(id) ? p : ({ ...p, completed: [...p.completed, id], activityScore: p.activityScore + points }));
  const routeTitle = navItems.find(n => n.path === location)?.label || 'ProofLab';
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <Link href="/" className="brand" data-testid="link-brand" onClick={() => setMobileOpen(false)}><span className="brand-mark">∴</span><span>proof<span className="brand-lab">lab</span><small>THE PROOF WORKSHOP</small></span></Link>
      <div className="nav-caption">WORKSHOP</div>
      <nav aria-label="Main navigation" className="side-nav">
        {navItems.map(({ path, label, icon: Icon }) => <Link href={path} onClick={() => setMobileOpen(false)} className={`nav-link ${location === path ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} key={path}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{location === path && <span className="nav-dot" />}</Link>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="progress-mini"><span className="mini-label">YOUR PRACTICE</span><div><strong>{progress.completed.length}</strong><span> milestones reached</span></div><div className="mini-track"><i style={{ width: `${Math.min(progress.completed.length / 8 * 100, 100)}%` }} /></div></div>
        <button className="theme-toggle" onClick={() => setDark(!dark)} data-testid="button-theme"><span>{dark ? <Moon size={16} /> : <Sun size={16} />}{dark ? 'Dark mode' : 'Light mode'}</span><span className={`switch ${dark ? 'on' : ''}`} /></button>
        <div className="sidebar-foot">Proof is a practice.<br /><span>Take it one step at a time.</span></div>
      </div>
    </aside>
    {mobileOpen && <button aria-label="Close menu" className="mobile-scrim" onClick={() => setMobileOpen(false)} data-testid="button-close-menu" />}
    <main className="main-column">
      <div className="mobile-top"><button className="icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-menu"><Menu /></button><Link href="/" className="mobile-brand" data-testid="link-mobile-brand">∴ prooflab</Link><button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle color theme" data-testid="button-mobile-theme">{dark ? <Moon size={18} /> : <Sun size={18} />}</button></div>
      <div className="topline"><div><span className="top-kicker">MATHEMATICAL REASONING</span><span className="top-slash"> / </span>{routeTitle}</div><div className="top-meta"><span className="status-dot" /> YOUR WORKSPACE <span className="top-score">{progress.activityScore} pts</span></div></div>
      <div className="content-wrap">
        <Switch>
          <Route path="/"><HomePage progress={progress} /></Route>
          <Route path="/definitions"><DefinitionsPage /></Route>
          <Route path="/examples"><ExamplesPage markComplete={markComplete} progress={progress} /></Route>
          <Route path="/activities"><ActivitiesPage markComplete={markComplete} /></Route>
          <Route path="/checker"><CheckerPage markComplete={markComplete} /></Route>
          <Route path="/exercises"><ExercisesPage markComplete={markComplete} progress={progress} /></Route>
          <Route component={NotFound} />
        </Switch>
      </div>
      <footer className="site-footer"><span>PROOFLAB <span className="footer-dot">·</span> A PLACE TO THINK CLEARLY</span><span>Every proof begins with a question.</span></footer>
    </main>
  </div>;
}
function HomePage({ progress }: { progress: { completed: string[]; activityScore: number } }) {
  const features: { icon: LucideIcon; label: string; title: string; copy: string; path: string; id: string }[] = [
    { icon: BookOpen, label: '01 / LEARN', title: 'Language, made clear.', copy: 'Build a working vocabulary for mathematical ideas and arguments.', path: '/definitions', id: 'definitions' },
    { icon: ListChecks, label: '02 / FOLLOW', title: 'See the reasoning.', copy: 'Walk through classic proofs, one deliberate step at a time.', path: '/examples', id: 'examples' },
    { icon: Zap, label: '03 / PRACTICE', title: 'Think it through.', copy: 'Short challenges that sharpen the habits behind a good proof.', path: '/activities', id: 'activities' },
    { icon: ShieldCheck, label: '04 / TEST', title: 'Check your logic.', copy: 'Get guided, step-by-step feedback while you build an argument.', path: '/checker', id: 'checker' },
    { icon: Target, label: '05 / GO DEEPER', title: 'Make it yours.', copy: 'Choose a challenge, use a hint, and work toward a full solution.', path: '/exercises', id: 'exercises' },
  ];
  return <div className="page-in">
    <section className="hero">
      <div className="hero-copy"><Eyebrow><span className="eyebrow-line" /> THINKING, MADE RIGOROUS</Eyebrow><h1>Learn to Prove.<br /><em>Think Logically.</em></h1><p className="hero-sub">Explore mathematical proof methods, build proofs step-by-step, and verify your reasoning with an interactive proof checker.</p><div className="hero-actions"><Link href="/exercises" className="btn btn-solid" data-testid="link-start-learning">Start Proving <ArrowRight size={16} /></Link><Link href="/checker" className="btn btn-outline" data-testid="link-try-activity">Try Proof Checker <ArrowDown size={15} /></Link></div><div className="hero-note"><span className="note-check"><Check size={13} /></span> NO SHORTCUTS. JUST CLEAR THINKING.</div></div>
      <div className="hero-art" aria-label="A visual diagram representing a mathematical proof"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-ring"><span className="art-dot dot-a" /><span className="art-dot dot-b" /><span className="art-dot dot-c" /></div><div className="art-center"><span>∴</span><small>THEREFORE</small></div><div className="art-label art-label-one">ASSUMPTION <i /></div><div className="art-label art-label-two"><i /> LOGIC</div><div className="art-label art-label-three">CONCLUSION <i /></div><div className="art-equation">P <span>⇒</span> Q</div></div>
    </section>
    <div className="hero-ribbon"><span>01 — BEGIN WITH A QUESTION</span><span>02 — FOLLOW THE REASONING</span><span>03 — MAKE THE CONNECTION</span></div>
    <section className="intro-row"><div><Eyebrow>THE WORKSHOP</Eyebrow><h2>Proof isn’t a trick.<br /><span>It’s a way of thinking.</span></h2></div><p>Learn the language. Study the moves. Then try them yourself. ProofLab is a calm place to get curious, make a case, and understand why it works.</p></section>
    <section className="feature-grid" aria-label="ProofLab learning areas">{features.map(({ icon: Icon, label, title, copy, path, id }) => <Link href={path} key={id} className={`feature-card ${id === 'checker' ? 'feature-highlight' : ''}`} data-testid={`card-feature-${id}`}><div className="feature-top"><span>{label}</span><Icon size={18} /></div><h3>{title}</h3><p>{copy}</p><span className="feature-link">Explore <ArrowRight size={14} /></span></Link>)}</section>
    <section className="checker-preview"><div className="preview-copy"><Eyebrow>YOUR REASONING, IN FOCUS</Eyebrow><h2>Try a proof.<br /><em>Check the steps.</em></h2><p>Enter a statement and build an argument. Get a nudge when a step needs more support—not a verdict from a black box.</p><Link href="/checker" className="text-link" data-testid="link-preview-checker">Open the proof checker <ArrowRight size={15} /></Link><small>Guided feedback, not a formal proof certificate.</small></div><div className="preview-window"><div className="preview-window-head"><div className="window-dots"><i /><i /><i /></div><span>PROOF CHECKER / EXAMPLE</span><span className="preview-live"><i /> READY</span></div><div className="preview-statement"><span className="mono-tag">CLAIM</span><strong>If n is even, then n² is even.</strong></div><div className="preview-step"><span className="step-number">01</span><div><span className="step-ok"><Check size={12} /> VALID STEP</span><p>Let n = 2k for some integer k.</p></div></div><div className="preview-step"><span className="step-number">02</span><div><span className="step-warn"><Lightbulb size={12} /> ADD A REASON</span><p>Now square both sides and simplify.</p></div></div><div className="preview-footer"><span>2 steps in your argument</span><span className="preview-caret">▮</span></div></div></section>
    <section className="progress-banner"><div className="progress-symbol">∴</div><div><Eyebrow>YOUR PRACTICE, YOUR PACE</Eyebrow><h2>{progress.completed.length ? `${progress.completed.length} milestones down.` : 'Start with one good question.'}</h2><p>Your progress and scores stay on this device. No account, no pressure.</p></div><div className="progress-banner-score"><strong>{progress.activityScore}</strong><span>POINTS EARNED</span></div></section>
    <div className="home-end"><span>NOT SURE WHERE TO BEGIN?</span><Link href="/definitions" data-testid="link-browse-definitions">Start with the language <ArrowRight size={14} /></Link></div>
  </div>;
}
function DefinitionsPage() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>('Mathematical proof');
  const filtered = useMemo(() => definitions.filter(d => `${d.term} ${d.kind} ${d.description}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <div><Heading eyebrow="THE LANGUAGE OF PROOF / 13 TERMS" title="Words worth knowing." description="A clear vocabulary makes good reasoning easier to follow. Open a term to see it in context." />
    <div className="filter-row"><label className="search-box"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a term…" aria-label="Search definitions" data-testid="input-search-definitions" /></label><span className="result-count">{filtered.length} TERMS</span></div>
    <div className="definition-list">{filtered.map((d, i) => <article className={`definition-item ${open === d.term ? 'definition-open' : ''}`} key={d.term} data-testid={`definition-${d.term.toLowerCase().replaceAll(' ', '-')}`}><button className="definition-trigger" onClick={() => setOpen(open === d.term ? null : d.term)} aria-expanded={open === d.term} data-testid={`button-definition-${i}`}><span className="def-index">{String(i + 1).padStart(2, '0')}</span><span className="def-term">{d.term}</span><span className="def-kind">{d.kind}</span><span className="def-learn-more">{open === d.term ? 'Show less' : 'Learn more'}</span><ChevronDown size={17} className="def-chevron" /></button>{open === d.term && <div className="definition-detail"><p>{d.description}</p><div className="def-example"><span>IN CONTEXT</span><p>{d.example}</p></div></div>}</article>)}
      {filtered.length === 0 && <div className="empty-state"><Search size={22} /><h3>No terms found.</h3><p>Try another word or clear your search.</p><Button variant="outline" testId="button-clear-search" onClick={() => setQuery('')}>Clear search</Button></div>}
    </div><div className="page-end-note"><CircleHelp size={16} /><span>Good proofs use definitions precisely. Need to see one in action?</span><Link href="/examples" data-testid="link-definitions-examples">Walk through an example <ArrowRight size={14} /></Link></div>
  </div>;
}
function ExamplesPage({ markComplete, progress }: { markComplete: (id: string, points?: number) => void; progress: { completed: string[] } }) {
  const [selected, setSelected] = useState(0);
  const [revealed, setRevealed] = useState(1);
  const [completed, setCompleted] = useState<string[]>([]);
  const example = examples[selected];
  const choose = (i: number) => { setSelected(i); setRevealed(1); };
  const exampleDone = completed.includes(example.title) || progress.completed.includes(`example-${selected}`);
  const completedCount = examples.filter((_, i) => completed.includes(examples[i].title) || progress.completed.includes(`example-${i}`)).length;
  const finish = () => { if (!exampleDone) { setCompleted([...completed, example.title]); markComplete(`example-${selected}`, 2); } };
  return <div><Heading eyebrow="WORKED EXAMPLES / REASONING, UNFOLDED" title="Follow the argument." description="Four classic claims. Each one shows how definitions and logic move a statement toward proof." />
    <div className="example-layout"><aside className="example-index"><span className="side-label">THE COLLECTION</span>{examples.map((ex, i) => <button className={`example-select ${selected === i ? 'selected' : ''}`} onClick={() => choose(i)} key={ex.title} data-testid={`button-example-${i}`}><span className="ex-num">{String(i + 1).padStart(2, '0')}</span><span><strong>{ex.title}</strong><small>{ex.method}</small></span><ChevronRight size={15} /></button>)}<div className="index-foot">{completedCount} OF 4 COMPLETED</div></aside>
       <div className="example-main"><div className="example-title"><div><Eyebrow>{example.level}</Eyebrow><h2>{example.title}</h2></div>{exampleDone && <span className="complete-pill"><CheckCircle2 size={14} /> PROOF COMPLETE</span>}</div><div className="claim-card"><span className="claim-mark">“</span><span className="claim-label">THE CLAIM</span><p>{example.statement}</p><span className="method-tag">{example.method}</span></div><div className="reasoning-head"><span>THE REASONING</span><span>{Math.min(revealed, example.steps.length)} <i>/</i> {example.steps.length} STEPS</span></div><div className="reasoning-list">{example.steps.slice(0, revealed).map((step, i) => <div className="reason-step" key={`${selected}-${i}`}><div className="reason-node">{i + 1 === example.steps.length ? <Check size={13} /> : String(i + 1).padStart(2, '0')}</div><p>{step}</p></div>)}{revealed < example.steps.length && <div className="hidden-steps"><span>•••</span><span>{example.steps.length - revealed} more {example.steps.length - revealed === 1 ? 'step' : 'steps'} to reveal</span></div>}</div><div className="example-controls">{revealed < example.steps.length ? <Button testId="button-reveal-step" onClick={() => setRevealed(revealed + 1)}>Reveal next step <ArrowDown size={15} /></Button> : <Button testId="button-complete-example" onClick={finish} disabled={exampleDone}>{exampleDone ? <><Check size={15} /> Example completed</> : <>I follow the argument <Check size={15} /></>}</Button>}<button className="text-button" onClick={() => setRevealed(example.steps.length)} data-testid="button-reveal-all">Show all steps</button></div>
        <div className="think-note"><Lightbulb size={17} /><div><strong>Pause and reflect</strong><p>What definition or earlier step makes this conclusion follow?</p></div></div>
      </div></div><div className="page-end-note"><Sparkles size={16} /><span>Proof is easier to follow when every step has a reason.</span><Link href="/activities" data-testid="link-examples-activities">Try a reasoning activity <ArrowRight size={14} /></Link></div>
  </div>;
}
type Activity = { name: string; format: string; prompt: string; options: string[]; answer: number; explanation: string };
const activities: Activity[] = [
  { name: 'Fill the gap', format: 'MISSING STEP', prompt: 'Suppose n is even, so n = 2k for some integer k. Then n² = 4k² = 2(2k²). Why does this show n² is even?', options: ['Because 2k² is an integer, so n² is twice an integer.', 'Because every square is an even number.', 'Because k must be even.'], answer: 0, explanation: 'That’s the definition of an even integer: it is 2 times an integer.' },
  { name: 'Spot the slip', format: 'FIND THE ERROR', prompt: 'A proof says: “If n² is even, then n is even. Take n = 3. Since 3² = 9 is odd, the statement is proved.” What went wrong?', options: ['Nothing; 9 is odd, so the claim is proved.', 'The example only tests one value, not every integer satisfying the hypothesis.', 'The square of 3 is actually even.'], answer: 1, explanation: 'A single example cannot prove a universal implication. Try a contrapositive argument instead.' },
  { name: 'Choose your method', format: 'METHOD MATCH', prompt: 'You want to prove that √2 is irrational. Which method gives a natural route to a contradiction?', options: ['Proof by induction', 'Proof by contradiction', 'Proof by cases'], answer: 1, explanation: 'Assume √2 is a reduced fraction. The algebra forces numerator and denominator both to be even—a contradiction.' },
  { name: 'Put it in order', format: 'ARRANGE THE PROOF', prompt: 'Arrange the logic for: if n is odd, then n² is odd.', options: ['Therefore n² is odd.', 'Write n = 2k + 1 for some integer k.', 'Then n² = (2k + 1)² = 2(2k² + 2k) + 1.'], answer: 1, explanation: 'Start with the definition of odd, expand the square, then identify it as 2 times an integer plus 1.' },
];
function ActivitiesPage({ markComplete }: { markComplete: (id: string, points?: number) => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'almost' | 'invalid' | null>(null);
  const [score, setScore] = useState(0);
  const [order, setOrder] = useState([0, 1, 2]);
  const activity = activities[index];
  const isOrder = index === 3;
  const check = () => {
    if (isOrder) {
      const correct = order.join(',') === '1,2,0';
      setFeedback(correct ? 'correct' : order[0] === 1 ? 'almost' : 'invalid');
      if (correct) { setScore(score + 1); markComplete('activity-arrange', 3); }
    } else if (selected === null) setFeedback('invalid');
    else if (selected === activity.answer) { setFeedback('correct'); setScore(score + 1); markComplete(`activity-${index}`, 3); }
    else setFeedback(index === 1 && selected === 0 ? 'almost' : 'invalid');
  };
  const next = () => { const n = (index + 1) % activities.length; setIndex(n); setSelected(null); setFeedback(null); setOrder([0, 1, 2]); };
  const move = (at: number, direction: number) => { const to = at + direction; if (to < 0 || to >= order.length) return; const a = [...order]; [a[at], a[to]] = [a[to], a[at]]; setOrder(a); setFeedback(null); };
  return <div><Heading eyebrow="PRACTICE / SMALL MOVES, STRONGER REASONING" title="Your turn to reason." description="Four short challenges. Make a choice, see what follows, and keep going." />
    <div className="activity-top"><div className="activity-tabs">{activities.map((a, i) => <button className={`activity-tab ${index === i ? 'active' : ''} ${feedback === 'correct' && index === i ? 'done' : ''}`} onClick={() => { setIndex(i); setSelected(null); setFeedback(null); setOrder([0, 1, 2]); }} key={a.name} data-testid={`button-activity-tab-${i}`}><span>{feedback === 'correct' && index === i ? <Check size={12} /> : `0${i + 1}`}</span>{a.name}</button>)}</div><div className="score-chip"><Sparkles size={14} /> {score} <span>POINTS</span></div></div>
    <section className="activity-card"><div className="activity-label"><span>{activity.format}</span><span>CHALLENGE 0{index + 1} / 04</span></div><h2>{activity.prompt}</h2>
      {!isOrder ? <div className="answer-options">{activity.options.map((opt, i) => <button className={`answer-option ${selected === i ? 'chosen' : ''} ${feedback && selected === i ? `answer-${feedback}` : ''}`} key={opt} onClick={() => { setSelected(i); setFeedback(null); }} data-testid={`button-answer-${i}`}><span className="option-letter">{String.fromCharCode(65 + i)}</span><span>{opt}</span>{selected === i && <span className="option-check">{feedback === 'correct' ? <Check size={15} /> : <CheckCircle2 size={15} />}</span>}</button>)}</div> : <div className="arrange-list">{order.map((item, i) => <div className="arrange-item" key={item}><span className="arrange-num">{String(i + 1).padStart(2, '0')}</span><p>{activity.options[item]}</p><div><button onClick={() => move(i, -1)} aria-label="Move step up" disabled={i === 0} data-testid={`button-move-up-${i}`}><ArrowUp size={15} /></button><button onClick={() => move(i, 1)} aria-label="Move step down" disabled={i === order.length - 1} data-testid={`button-move-down-${i}`}><ArrowDown size={15} /></button></div></div>)}</div>}
      {feedback && <div className={`feedback-box feedback-${feedback}`} role="status" data-testid="activity-feedback"><span className="feedback-icon">{feedback === 'correct' ? <CheckCircle2 /> : feedback === 'almost' ? <Lightbulb /> : <CircleHelp />}</span><div><strong>{feedback === 'correct' ? 'Exactly right.' : feedback === 'almost' ? 'You’re close.' : 'Not quite yet.'}</strong><p>{feedback === 'correct' ? activity.explanation : feedback === 'almost' ? 'You’ve noticed something relevant. Check whether it addresses every case in the claim.' : 'Look for the definition or logical link that makes the conclusion follow.'}</p></div></div>}
      <div className="activity-actions"><Button testId="button-check-answer" onClick={check}>{feedback === 'correct' ? 'Check again' : 'Check my reasoning'} <ArrowRight size={15} /></Button><Button variant="quiet" testId="button-next-activity" onClick={next}>Next challenge <ChevronRight size={15} /></Button></div>
    </section><div className="activity-footer"><div><span className="activity-footer-icon"><Lightbulb size={17} /></span><p><strong>Good reasoning is a habit.</strong><br />Feedback is a nudge, not a grade. Revise and try again.</p></div><div className="activity-progress">{activities.map((_, i) => <i key={i} className={`${i < index ? 'past' : ''} ${i === index ? 'current' : ''}`} />)}</div></div>
  </div>;
}
const methodNames = ['Direct proof', 'Proof by contradiction', 'Proof by contrapositive', 'Proof by induction', 'Proof by cases'];
type StepReview = { kind: 'valid' | 'needs' | 'invalid'; title: string; text: string; index?: number };
type ProofReview = StepReview & {
  status?: 'Proof Valid' | 'Proof Incomplete' | 'Proof Invalid';
  counts?: { valid: number; errors: number; missing: number; total: number };
  consistency?: string;
  suggestions?: string[];
};
function CheckerPage({ markComplete }: { markComplete: (id: string, points?: number) => void }) {
  const [statement, setStatement] = useState('');
  const [method, setMethod] = useState('');
  const [steps, setSteps] = useState(['']);
  const [result, setResult] = useState<ProofReview | null>(null);
  const [stepReviews, setStepReviews] = useState<Record<number, StepReview>>({});
  const [solution, setSolution] = useState(false);
  const [exampleNum, setExampleNum] = useState(0);
  const clearReviews = () => { setResult(null); setStepReviews({}); };
  const updateStep = (i: number, val: string) => { setSteps(s => s.map((x, j) => j === i ? val : x)); clearReviews(); };
  const addStep = () => { setSteps(s => [...s, '']); clearReviews(); };
  const removeStep = (i: number) => { setSteps(s => s.filter((_, j) => j !== i)); clearReviews(); };
  const loadExample = () => { const ex = examples[exampleNum]; setStatement(ex.statement); setMethod(ex.method); setSteps(['']); clearReviews(); setSolution(false); setExampleNum((exampleNum + 1) % examples.length); };
  const evaluateStep = (value: string, index: number, isConclusion: boolean): StepReview => {
    const text = value.trim().toLowerCase();
    if (!text) return { kind: 'invalid', title: `Step ${index + 1} is empty.`, text: 'Write a mathematical statement before checking it.', index };
    if (/(every square is even|divide(?:d)? by zero|because i said|magic)/.test(text)) {
      return { kind: 'invalid', title: `Step ${index + 1} contains invalid reasoning.`, text: 'This claim does not follow from a mathematical definition or an established result. Revisit the step and explain the connection.', index };
    }
    const hasReason = /(because|since|by definition|therefore|thus|so |hence|assume|let |write |implies|contradict|integer|induction|case|odd|even|rational|irrational|square|base case|hypothesis|substitut|suppose|coprime|divisib)/.test(text);
    if (text.length < 9 || !hasReason) {
      return { kind: 'needs', title: `Step ${index + 1} needs a justification.`, text: 'Name the definition, assumption, or earlier result that makes this move valid.', index };
    }
    const goal = statement.split(/\bthen\b|→|⇒|implies/i).pop()?.replace(/[?.!]+$/, '').trim().toLowerCase() ?? '';
    const hasGoal = goal.length > 0 && (
      text.includes(goal) ||
      (goal.includes('even') && text.includes('even') && /(n²|n\^2|n squared)/.test(text)) ||
      (goal.includes('irrational') && text.includes('irrational')) ||
      (goal.includes('rational') && text.includes('rational')) ||
      (goal.includes('sum') && text.includes('sum')) ||
      (goal.includes('divides') && text.includes('divisib'))
    );
    if (isConclusion && !hasGoal) {
      return { kind: 'needs', title: 'Connect the last step to the claim.', text: 'The reasoning has useful pieces. State how they establish the conclusion you set out to prove.', index };
    }
    return { kind: 'valid', title: `Step ${index + 1} is well-formed.`, text: 'A recognizable reason is present. Confirm that it follows from the assumptions and earlier steps.', index };
  };
  const analyze = (singleIndex?: number) => {
    if (!statement.trim()) { setResult({ kind: 'needs', title: 'Add a claim first.', text: 'The checker needs a statement to evaluate.', index: 0 }); return; }
    if (!method) { setResult({ kind: 'needs', title: 'Choose a method.', text: 'Selecting an approach helps you organize the argument.', index: 0 }); return; }
    if (!steps.some(s => s.trim())) { setResult({ kind: 'needs', title: 'Your proof needs a first step.', text: 'Start from the hypothesis or the method you chose.', index: 0 }); return; }
    if (singleIndex !== undefined) {
      const review = evaluateStep(steps[singleIndex] ?? '', singleIndex, singleIndex === steps.map((s, i) => s.trim() ? i : -1).filter(i => i >= 0).at(-1));
      setStepReviews(current => ({ ...current, [singleIndex]: review }));
      setResult(review);
      return;
    }
    const lastFilled = steps.map((s, i) => s.trim() ? i : -1).filter(i => i >= 0).at(-1);
    const reviews = steps.map((value, index) => value.trim() ? evaluateStep(value, index, index === lastFilled) : null);
    const entered = reviews.filter((review): review is StepReview => review !== null);
    const valid = entered.filter(review => review.kind === 'valid').length;
    const errors = entered.filter(review => review.kind === 'invalid').length;
    const missing = entered.filter(review => review.kind === 'needs').length + steps.filter(value => !value.trim()).length;
    const status = errors > 0 ? 'Proof Invalid' : missing > 0 ? 'Proof Incomplete' : 'Proof Valid';
    const kind = errors > 0 ? 'invalid' : missing > 0 ? 'needs' : 'valid';
    setStepReviews(Object.fromEntries(entered.map(review => [review.index, review])));
    const suggestions = [...new Set(entered.filter(review => review.kind !== 'valid').map(review => review.text))].slice(0, 3);
    if (suggestions.length === 0) suggestions.push('Re-read each implication and confirm its assumptions match the claim.');
    setResult({
      kind,
      index: lastFilled,
      status,
      title: status,
      text: status === 'Proof Valid'
        ? 'Every entered step has a recognizable reason and the final step connects to the claim. This guided check is not a formal proof certificate.'
        : status === 'Proof Invalid'
          ? 'At least one step contains reasoning that the checker recognizes as invalid. Revise that step and check again.'
          : 'Some steps still need a reason, a clearer link, or a connection to the conclusion.',
      counts: { valid, errors, missing, total: steps.length },
      consistency: errors === 0 && missing === 0 ? 'No rule-based gaps were detected; review the mathematics yourself.' : 'The outline needs revision before it reads as a complete argument.',
      suggestions,
    });
    if (status === 'Proof Valid') markComplete('checker-review', 2);
  };
  return <div><Heading eyebrow="GUIDED REVIEW / YOUR ARGUMENT, YOURS" title="Build a proof." description="State a claim, choose an approach, and add the reasoning in your own words. Check a step as you go." />
    <div className="checker-notice"><ShieldCheck size={17} /><p><strong>A guide, not a judge.</strong> Feedback is rule-based and educational. It is not a formal proof certificate, and it cannot verify every mathematical argument.</p></div>
    <div className="checker-grid"><section className="checker-form">
      <div className="form-section"><div className="form-section-head"><span className="form-number">01</span><div><h2>What are you proving?</h2><p>Write the statement as clearly as you can.</p></div></div><textarea className="statement-input" value={statement} onChange={e => { setStatement(e.target.value); clearReviews(); }} placeholder="e.g. If n is even, then n² is even." data-testid="input-proof-statement" rows={3} /></div>
      <div className="form-section"><div className="form-section-head"><span className="form-number">02</span><div><h2>Choose an approach</h2><p>Different claims call for different tools.</p></div></div><div className="method-options">{methodNames.map(m => <button className={`method-option ${method === m ? 'selected' : ''}`} key={m} onClick={() => { setMethod(m); clearReviews(); }} data-testid={`button-method-${m.toLowerCase().replaceAll(' ', '-')}`}>{method === m ? <Check size={14} /> : <span className="method-radio" />}{m}</button>)}</div></div>
      <div className="form-section proof-steps-section"><div className="form-section-head"><span className="form-number">03</span><div><h2>Make your case</h2><p>One move per step. Explain why each move follows.</p></div></div><div className="proof-step-list">{steps.map((step, i) => <div className="proof-step-item" key={i}><div className="proof-editor-row"><span className="proof-editor-num">{String(i + 1).padStart(2, '0')}</span><textarea value={step} onChange={e => updateStep(i, e.target.value)} rows={2} placeholder={i === 0 ? 'Start with a definition, hypothesis, or assumption…' : 'Continue the reasoning…'} data-testid={`input-proof-step-${i}`} /><button className="step-check" onClick={() => analyze(i)} aria-label={`Check step ${i + 1}`} title="Check this step" data-testid={`button-check-step-${i}`}><CheckCircle2 size={17} /></button>{steps.length > 1 && <button className="step-remove" onClick={() => removeStep(i)} aria-label={`Remove step ${i + 1}`} data-testid={`button-remove-step-${i}`}><X size={15} /></button>}</div>{stepReviews[i] && <div className={`step-review-note step-review-${stepReviews[i].kind}`} role="status" data-testid={`step-feedback-${i}`}><strong>{stepReviews[i].title}</strong> {stepReviews[i].text}</div>}</div>)}</div><button className="add-step" onClick={addStep} data-testid="button-add-step"><span>+</span> Add a proof step</button></div>
      <div className="checker-actions"><Button testId="button-check-proof" onClick={() => analyze()}>Check my proof <ArrowRight size={15} /></Button><button className="text-button" onClick={() => { setStatement(''); setMethod(''); setSteps(['']); clearReviews(); setSolution(false); }} data-testid="button-reset-proof"><RotateCcw size={14} /> Reset</button><Button variant="outline" testId="button-load-example" onClick={loadExample}>Load an example <ChevronDown size={14} /></Button></div>
    </section><aside className="checker-side"><div className="feedback-panel"><div className="feedback-panel-head"><span>REVIEW PANEL</span><span className={`review-state ${result ? `state-${result.kind}` : ''}`}><i />{result ? result.status ?? (result.kind === 'valid' ? 'VALID STEP' : result.kind === 'invalid' ? 'INVALID' : 'NEEDS A LOOK') : 'WAITING'}</span></div>{result ? <div className={`review-result result-${result.kind}`} role="status" data-testid="checker-feedback"><span className="review-icon">{result.kind === 'valid' ? <CheckCircle2 /> : result.kind === 'needs' ? <Lightbulb /> : <CircleHelp />}</span><h3>{result.title}</h3><p>{result.text}</p>{result.counts && <div className="review-counts" data-testid="proof-counts"><div><span>VALID STEPS</span><strong>{result.counts.valid}</strong></div><div><span>ERRORS</span><strong>{result.counts.errors}</strong></div><div><span>MISSING</span><strong>{result.counts.missing}</strong></div></div>}{result.consistency && <div className="review-consistency"><strong>LOGICAL CONSISTENCY</strong><span>{result.consistency}</span></div>}{result.suggestions && result.suggestions.length > 0 && <div className="review-suggestions"><strong>TRY NEXT</strong><ul>{result.suggestions.map((suggestion, i) => <li key={i}>{suggestion}</li>)}</ul></div>}{result.kind !== 'valid' && <div className="gentle-hint"><span>TRY THIS</span><p>{result.kind === 'needs' ? 'Ask: what definition or earlier statement lets me make this move?' : 'Begin with the hypothesis, or inspect the definition of your key term.'}</p></div>}</div> : <div className="review-empty"><div className="empty-orbit"><span>∴</span></div><h3>Your reasoning, reflected.</h3><p>Check one step for a focused nudge, or review your full outline when you’re ready.</p></div>}
      <div className="review-legend"><span><i className="legend-valid" /> Well-formed</span><span><i className="legend-needs" /> Needs justification</span><span><i className="legend-invalid" /> Incomplete</span></div></div>
      <div className="solution-card"><div className="solution-head"><Lightbulb size={17} /><span>WHEN YOU’RE STUCK</span></div><p>Try a hint before looking at a full solution. The goal is to practice the reasoning, not just read the result.</p><button className="hint-button" onClick={() => setResult({ kind: 'needs', title: 'Start from the definition.', text: 'For an even integer, write n = 2k for some integer k. Substitute that expression into the claim and simplify.' })} data-testid="button-get-hint">Give me a hint <ArrowRight size={14} /></button><button className="solution-reveal" onClick={() => setSolution(!solution)} data-testid="button-request-solution">{solution ? 'Hide solution' : 'I want to see a full solution'} <ChevronDown size={14} className={solution ? 'rotate' : ''} /></button>{solution && <div className="full-solution" data-testid="checker-solution"><strong>Direct proof</strong><p>Suppose n is even. Then n = 2k for some integer k. So n² = 4k² = 2(2k²). Since 2k² is an integer, n² is even.</p></div>}</div></aside></div>
    <div className="page-end-note"><CircleHelp size={16} /><span>This checker looks for recognizable reasoning—not mathematical certainty.</span><Link href="/examples" data-testid="link-checker-examples">Study a worked example <ArrowRight size={14} /></Link></div>
  </div>;
}
type Exercise = { id: string; level: string; time: string; title: string; statement: string; method: string; hint: string; solution: string; points: number };
const exerciseGroups: { level: string; intro: string; items: Exercise[] }[] = [
  { level: 'BEGINNER', intro: 'Start with definitions and direct reasoning.', items: [
    { id: 'ex-even-sum', level: 'Beginner', time: '5 min', title: 'Add two even integers', statement: 'Prove that the sum of two even integers is even.', method: 'Direct proof', hint: 'Write each even integer as twice an integer, then factor out 2.', solution: 'Let a = 2k and b = 2m for integers k and m. Then a + b = 2k + 2m = 2(k + m). Since k + m is an integer, the sum is even.', points: 4 },
    { id: 'ex-odd-square', level: 'Beginner', time: '6 min', title: 'Square an odd integer', statement: 'Prove that the square of an odd integer is odd.', method: 'Direct proof', hint: 'Represent an odd integer as 2k + 1, then expand its square.', solution: 'Let n = 2k + 1 for an integer k. Then n² = 4k² + 4k + 1 = 2(2k² + 2k) + 1. The quantity in parentheses is an integer, so n² is odd.', points: 4 },
    { id: 'ex-odd-sum', level: 'Beginner', time: '5 min', title: 'Add two odd integers', statement: 'Prove that the sum of two odd integers is even.', method: 'Direct proof', hint: 'Write both numbers as 2 times an integer plus 1, then combine the two extra ones.', solution: 'Let a = 2k + 1 and b = 2m + 1 for integers k and m. Then a + b = 2k + 2m + 2 = 2(k + m + 1). Since k + m + 1 is an integer, the sum is even.', points: 4 },
  ]},
  { level: 'INTERMEDIATE', intro: 'Use equivalent statements to find a cleaner route.', items: [
    { id: 'ex-odd-square-root', level: 'Intermediate', time: '7 min', title: 'An odd square has an odd root', statement: 'Prove that if n² is odd, then n is odd.', method: 'Proof by contrapositive', hint: 'Prove the equivalent statement: if n is even, then n² is even.', solution: 'We prove the contrapositive. Suppose n is even, so n = 2k for an integer k. Then n² = 4k² = 2(2k²), which is even. Therefore, if n² is odd, n cannot be even; every integer is even or odd, so n is odd.', points: 5 },
    { id: 'ex-rational-product', level: 'Intermediate', time: '7 min', title: 'Multiply two rational numbers', statement: 'Prove that the product of two rational numbers is rational.', method: 'Direct proof', hint: 'Represent each rational number as an integer divided by a nonzero integer, then multiply.', solution: 'Let x = a/b and y = c/d, where a, b, c, and d are integers and b, d are nonzero. Then xy = ac/bd. The numerator ac and denominator bd are integers, and bd ≠ 0, so xy is rational.', points: 5 },
    { id: 'ex-sum-formula', level: 'Intermediate', time: '8 min', title: 'Sum the first n integers', statement: 'Prove that 1 + 2 + 3 + ··· + n = n(n + 1)/2 for every positive integer n.', method: 'Proof by induction', hint: 'Check n = 1 first. Then assume the formula holds for k and add k + 1 to both sides.', solution: 'Base case n = 1: 1 = 1(1 + 1)/2. Assume 1 + ··· + k = k(k + 1)/2. For k + 1, add k + 1: k(k + 1)/2 + (k + 1) = (k + 1)(k + 2)/2. This is the formula at k + 1, so induction proves it for every positive integer n.', points: 6 },
  ]},
  { level: 'ADVANCED', intro: 'Connect a familiar proof to a deeper question.', items: [
    { id: 'ex-irrational-deep', level: 'Advanced', time: '12 min', title: 'Make the contradiction precise', statement: 'Prove √2 is irrational, and explain where the “lowest terms” condition is used.', method: 'Proof by contradiction', hint: 'The contradiction is not just that both numbers are even; connect it back to the chosen fraction.', solution: 'Assume √2 = a/b where a and b are coprime integers and b ≠ 0. Then a² = 2b², so a is even; let a = 2k. Substitution gives b² = 2k², so b is even. Thus 2 divides both a and b, contradicting that gcd(a,b) = 1. Therefore √2 is irrational. The lowest-terms condition makes this a genuine contradiction.', points: 7 },
    { id: 'ex-divisibility-induction', level: 'Advanced', time: '12 min', title: 'Build a divisibility result', statement: 'Prove by induction that 7 divides 8ⁿ − 1 for every integer n ≥ 1.', method: 'Proof by induction', hint: 'For the inductive step, rewrite 8^(k+1) − 1 as 8(8^k − 1) + 7.', solution: 'Base case n = 1: 8 − 1 = 7, which is divisible by 7. Assume 8^k − 1 = 7m for an integer m. Then 8^(k+1) − 1 = 8(8^k − 1) + 7 = 8(7m) + 7 = 7(8m + 1), so it is divisible by 7. By induction, the claim holds for every n ≥ 1.', points: 7 },
    { id: 'ex-largest-prime', level: 'Advanced', time: '15 min', title: 'There is no largest prime', statement: 'Prove that there are infinitely many prime numbers using proof by contradiction.', method: 'Proof by contradiction', hint: 'Assume there are only finitely many primes, multiply them together, and add 1.', solution: 'Suppose there are finitely many primes p₁, …, pₙ. Let N = p₁p₂···pₙ + 1. Some prime q divides N. But dividing N by any listed prime pᵢ leaves remainder 1, so q is not on the list. This contradicts the claim that the list contained every prime. Therefore there are infinitely many primes.', points: 8 },
  ]},
];
function ExercisesPage({ markComplete, progress }: { markComplete: (id: string, points?: number) => void; progress: { completed: string[] } }) {
  const [open, setOpen] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [solutions, setSolutions] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const exercises = exerciseGroups.flatMap(g => g.items.map(x => ({ ...x, group: g.level }))).filter(x => `${x.title} ${x.statement} ${x.method}`.toLowerCase().includes(query.toLowerCase()));
  const toggleHint = (id: string) => setHints(h => h.includes(id) ? h.filter(x => x !== id) : [...h, id]);
  const toggleSolution = (id: string) => setSolutions(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return <div><Heading eyebrow="EXERCISE SET / NINE PROBLEMS, THREE LEVELS" title="Take the next step." description="Choose a problem, start with what you know, and ask for a hint when you need one. Solutions are here when you’re ready." />
    <div className="exercise-tools"><label className="search-box"><Search size={16} /><input placeholder="Find an exercise…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search exercises" data-testid="input-search-exercises" /></label><span>{progress.completed.filter(x => x.startsWith('exercise-')).length} COMPLETED</span></div>
    {exerciseGroups.map(group => {
      const items = exercises.filter(e => e.group === group.level);
      if (!items.length) return null;
      return <section className="exercise-group" key={group.level}><div className="exercise-group-head"><span className={`level-mark level-${group.level.toLowerCase()}`}>{group.level}</span><p>{group.intro}</p><span className="group-count">{items.length} PROBLEMS</span></div>
        <div className="exercise-list">{items.map(ex => {
          const isDone = progress.completed.includes(`exercise-${ex.id}`);
          return <article className={`exercise-card ${open === ex.id ? 'exercise-expanded' : ''}`} key={ex.id} data-testid={`card-exercise-${ex.id}`}><button className="exercise-summary" onClick={() => setOpen(open === ex.id ? null : ex.id)} aria-expanded={open === ex.id} data-testid={`button-open-exercise-${ex.id}`}><span className="exercise-status">{isDone ? <CheckCircle2 size={18} /> : <span />}</span><span className="exercise-main-title"><strong>{ex.title}</strong><small>{ex.statement}</small></span><span className="exercise-meta"><i>{ex.time}</i><b>{ex.method}</b></span><span className="exercise-start-label">{open === ex.id ? 'Close problem' : 'Start problem'}</span><ChevronDown size={17} className="exercise-chevron" /></button>
            {open === ex.id && <div className="exercise-detail"><div className="exercise-prompt"><span>YOUR CHALLENGE</span><p>{ex.statement}</p></div><div className="exercise-actions"><button className="hint-button" onClick={() => toggleHint(ex.id)} data-testid={`button-hint-${ex.id}`}><Lightbulb size={15} /> {hints.includes(ex.id) ? 'Hide hint' : 'Show a hint'}</button><button className="solution-reveal" onClick={() => toggleSolution(ex.id)} data-testid={`button-solution-${ex.id}`}>{solutions.includes(ex.id) ? 'Hide solution' : 'Reveal solution'} <ChevronDown size={14} className={solutions.includes(ex.id) ? 'rotate' : ''} /></button><Button testId={`button-complete-${ex.id}`} onClick={() => markComplete(`exercise-${ex.id}`, ex.points)} disabled={isDone}>{isDone ? <><Check size={14} /> Completed · {ex.points} pts</> : <>Mark complete <Check size={14} /></>}</Button></div>{hints.includes(ex.id) && <div className="exercise-hint" data-testid={`hint-content-${ex.id}`}><Lightbulb size={15} /><p><strong>A nudge, not the answer</strong>{ex.hint}</p></div>}{solutions.includes(ex.id) && <div className="exercise-solution" data-testid={`solution-content-${ex.id}`}><CheckCircle2 size={15} /><p><strong>{ex.method}</strong>{ex.solution}</p></div>}</div>}</article>;
        })}</div></section>;
    })}
    {exercises.length === 0 && <div className="empty-state"><Search size={22} /><h3>No exercises match.</h3><p>Try a shorter search.</p><Button variant="outline" testId="button-clear-exercise-search" onClick={() => setQuery('')}>Clear search</Button></div>}
    <div className="exercise-bottom-note"><span className="note-mark">∴</span><p><strong>There’s no timer here.</strong><br />The point is not to finish fast. It’s to understand why the proof works.</p></div>
  </div>;
}
function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><AppShell /></ErrorBoundary>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GUIDE_SECTION_FRAME,
  HOMEPAGE_POPOVER_OPTION,
  HOMEPAGE_POPOVER_PANEL,
  HOMEPAGE_POPOVER_TYPE,
  HOMEPAGE_STEP_PILL,
  REPORT_H1,
  REPORT_H2,
  REPORT_H3,
  REPORT_GUIDE_TAB_TYPE,
  REPORT_GUIDE_TAB_GAP,
  REPORT_HEADER_JOB_LINE,
  HOMEPAGE_STEP_PILL_TYPE,
  HOMEPAGE_TITLE_TYPE,
  PAGE_SHELL_GUTTER,
  PAGE_SHELL_GUTTER_LEFT,
  PAGE_SHELL_GUTTER_RIGHT,
  REPORT_ACTION_TEXT,
  REPORT_FRAME_BORDER,
  REPORT_SHELL_WIDTH,
  REPORT_TYPE_CARD_ACTIVE,
  REPORT_TYPE_CARD_FILL,
  REPORT_TYPE_CARD_IDLE,
  REPORT_TYPE_LAUNCH_BOX,
  SAMPLE_RAIL_CONTENT_GAP,
  SAMPLE_RAIL_ITEM_GAP,
  SAMPLE_RAIL_ROW,
  SAMPLE_RAIL_ROW_GUTTER_LEFT,
  SAMPLE_RAIL_SHELL,
  SAMPLE_RAIL_SHELL_GUTTER,
  SAMPLE_RAIL_TEXT,
  SAMPLE_RAIL_WIDTH,
  SAMPLE_REPORT_TAB_ACTIVE,
  SAMPLE_REPORT_TAB_IDLE,
  SAMPLE_REPORT_TAB_LAYOUT,
  PAY_RANGE_LINE_WIDTH,
  PAY_RANGE_SNAPSHOT_COLUMN,
  PAY_RANGE_SNAPSHOT_WIDTH,
} from '@/constants/report-frame';

describe('report chrome type scale', () => {
  it('keeps sample-rail and action buttons at display size (not compact chips)', () => {
    expect(SAMPLE_RAIL_TEXT).toMatch(/lg:text-6xl/);
    expect(REPORT_ACTION_TEXT).toMatch(/lg:text-6xl/);
    expect(SAMPLE_RAIL_TEXT).toMatch(/\btext-xl\b/);
    expect(REPORT_ACTION_TEXT).toMatch(/\btext-xl\b/);
    expect(SAMPLE_RAIL_TEXT).not.toMatch(/(^|\s)text-6xl\b/);
    expect(REPORT_ACTION_TEXT).not.toMatch(/(^|\s)text-6xl\b/);
  });

  it('shares type-switcher card layout, rail width, and content gap across account / report / samples', () => {
    expect(SAMPLE_RAIL_WIDTH).toBe('w-[42rem]');
    expect(SAMPLE_RAIL_SHELL).toContain('lg:w-[42rem]');
    expect(SAMPLE_RAIL_ITEM_GAP).toBe('gap-6');
    expect(SAMPLE_RAIL_CONTENT_GAP).toBe('gap-6 lg:gap-24');
    expect(SAMPLE_RAIL_ROW).toContain(SAMPLE_RAIL_CONTENT_GAP);
    expect(SAMPLE_RAIL_ROW).toContain(SAMPLE_RAIL_ROW_GUTTER_LEFT);
    expect(SAMPLE_RAIL_ROW).toContain('lg:flex-row');
    expect(SAMPLE_RAIL_ROW).not.toMatch(/overflow-hidden/);
    expect(SAMPLE_RAIL_SHELL).toContain(SAMPLE_RAIL_SHELL_GUTTER);
    expect(SAMPLE_RAIL_SHELL_GUTTER).toBe('lg:ml-[4vw] xl:ml-[4.5vw]');
    expect(SAMPLE_RAIL_ROW_GUTTER_LEFT).toBe('pl-[3.5vw] sm:pl-[4vw] lg:pl-0');
    expect(SAMPLE_REPORT_TAB_LAYOUT).toContain(SAMPLE_RAIL_TEXT);
    expect(SAMPLE_REPORT_TAB_LAYOUT).toContain('px-8 py-6');
    expect(SAMPLE_REPORT_TAB_LAYOUT).toContain('gap-5');
    expect(SAMPLE_REPORT_TAB_IDLE).toMatch(/rounded-2xl/);
    expect(SAMPLE_REPORT_TAB_ACTIVE).toMatch(/rounded-2xl/);
    expect(SAMPLE_REPORT_TAB_ACTIVE).toMatch(/bg-blue-900/);
    expect(SAMPLE_REPORT_TAB_ACTIVE).toMatch(/ring-4 ring-white/);

    const samples = readFileSync(
      join(process.cwd(), 'app/samples/SampleReportClient.tsx'),
      'utf8',
    );
    const accountNav = readFileSync(
      join(process.cwd(), 'components/AccountSectionNav.tsx'),
      'utf8',
    );
    const accountPage = readFileSync(
      join(process.cwd(), 'app/account/page.tsx'),
      'utf8',
    );
    const report = readFileSync(
      join(process.cwd(), 'app/report/page.tsx'),
      'utf8',
    );
    const rail = readFileSync(
      join(process.cwd(), 'components/FunctionRail.tsx'),
      'utf8',
    );

    expect(rail).toContain('SAMPLE_RAIL_SHELL');
    expect(rail).toContain('SAMPLE_RAIL_SHELL_GUTTER');
    expect(rail).toContain('SAMPLE_RAIL_ITEM_GAP');
    expect(samples).toContain('FunctionRail');
    expect(samples).toContain('sampleReportTabClass');
    expect(samples).toContain('SAMPLE_RAIL_ROW');
    expect(samples).toContain('SAMPLE_NOTICE_SURFACE');
    expect(samples).not.toContain('border-r border-slate-800 p-10');
    expect(accountNav).toContain('FunctionRail');
    expect(accountNav).toContain('sampleReportTabClass');
    expect(accountPage).toContain('SAMPLE_RAIL_ROW');
    expect(report).toContain('FunctionRail');
    expect(report).toContain('sampleReportTabClass');
    expect(report).toContain('SAMPLE_RAIL_ROW');
    expect(report).toContain('hideInnerNav');
  });
});

describe('homepage step 3 / sample tab fill', () => {
  it('uses dark blue, not indigo or the old purple hex', () => {
    expect(REPORT_TYPE_CARD_FILL).toBe('bg-blue-900');
    const tokens = [
      HOMEPAGE_STEP_PILL,
      REPORT_TYPE_CARD_IDLE,
      REPORT_TYPE_CARD_ACTIVE,
      REPORT_TYPE_LAUNCH_BOX,
      SAMPLE_REPORT_TAB_IDLE,
      SAMPLE_REPORT_TAB_ACTIVE,
    ];
    for (const token of tokens) {
      expect(token).toMatch(/bg-blue-900/);
      expect(token).toContain(REPORT_TYPE_CARD_FILL);
      expect(token).not.toMatch(/indigo|#3d3c7c|#5a598f|#4a498e/);
    }
    expect(REPORT_TYPE_CARD_ACTIVE).toMatch(/ring-4 ring-white/);
    expect(SAMPLE_REPORT_TAB_ACTIVE).toMatch(/ring-4 ring-white/);
  });

  it('step-4 launch inner box reuses selected Snapshot fill and white 2px border', () => {
    expect(REPORT_TYPE_LAUNCH_BOX).toContain(REPORT_TYPE_CARD_FILL);
    expect(REPORT_TYPE_LAUNCH_BOX).toContain(REPORT_TYPE_CARD_ACTIVE);
    expect(REPORT_TYPE_LAUNCH_BOX).toMatch(/border-2/);
    expect(REPORT_TYPE_LAUNCH_BOX).toMatch(/border-white/);
    expect(REPORT_TYPE_LAUNCH_BOX).toMatch(/text-white/);
    expect(REPORT_TYPE_LAUNCH_BOX).toMatch(/hover:text-white/);
    expect(REPORT_TYPE_LAUNCH_BOX).toMatch(/disabled:text-white/);
    expect(REPORT_TYPE_LAUNCH_BOX).toBe(
      `border-2 ${REPORT_TYPE_CARD_ACTIVE} text-white hover:text-white disabled:text-white`,
    );
    expect(REPORT_TYPE_LAUNCH_BOX).not.toMatch(/indigo|bg-blue-800|#3d3c7c|opacity|text-zinc-100|text-zinc-300|text-zinc-400/);
  });

  it('fills the desktop sample leftover box so the four step inner boxes share one bottom', () => {
    const desktop = readFileSync(join(process.cwd(), 'components/InputForm.tsx'), 'utf8');
    expect(desktop).toContain('STEP_BODY_CARDS');
    expect(desktop).toContain('grid-rows-3');
    expect(desktop).toMatch(
      /href="\/samples"[\s\S]{0,500}flex h-full w-full min-h-0 items-center justify-center gap-3 rounded-xl border-2 border-dashed/,
    );
    expect(desktop).not.toContain('h-[60%]');
    expect(desktop).not.toMatch(
      /flex h-full min-h-0 w-full flex-col justify-start[\s\S]{0,200}href="\/samples"/,
    );
  });

  it('homepage launch buttons use the Snapshot-matched inner box, not a translucent overlay', () => {
    const desktop = readFileSync(join(process.cwd(), 'components/InputForm.tsx'), 'utf8');
    const mobile = readFileSync(join(process.cwd(), 'components/InputFormMobile.tsx'), 'utf8');
    for (const source of [desktop, mobile]) {
      expect(source).toContain('REPORT_TYPE_LAUNCH_BOX');
      expect(source).toContain('disabled:opacity-100');
      expect(source).not.toMatch(/REPORT_TYPE_LAUNCH_BOX\} cursor-not-allowed opacity-80/);
      expect(source).not.toMatch(/bg-blue-900\/3[05]/);
      expect(source).not.toMatch(/ring-2 ring-blue-300/);
      expect(source).not.toMatch(/shadow-\[0_0_\d+px_rgba\(30,/);
    }
    expect(desktop).toContain('STEP_PILL_ROW_EMPTY');
    expect(desktop).toContain('REPORT_TYPE_LAUNCH_BOX');
  });
});

describe('homepage step-header pills', () => {
  it('matches 四大優點 titles, the three pills, and step 1–4 headings', () => {
    expect(HOMEPAGE_TITLE_TYPE).toContain('homepage-title-type');
    expect(HOMEPAGE_TITLE_TYPE).toContain('text-lg sm:text-xl lg:text-2xl xl:text-3xl');
    expect(HOMEPAGE_STEP_PILL_TYPE).toContain('step-header-pill');
    expect(HOMEPAGE_STEP_PILL_TYPE).toContain(HOMEPAGE_TITLE_TYPE);
    expect(HOMEPAGE_STEP_PILL_TYPE).not.toContain('text-[1.5rem]');
    expect(HOMEPAGE_STEP_PILL).toContain(HOMEPAGE_STEP_PILL_TYPE);

    const desktop = readFileSync(join(process.cwd(), 'components/InputForm.tsx'), 'utf8');
    const mobile = readFileSync(join(process.cwd(), 'components/InputFormMobile.tsx'), 'utf8');
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');

    expect(desktop).toContain('HOMEPAGE_TITLE_TYPE');
    expect(desktop).toContain('HOMEPAGE_STEP_PILL_TYPE');
    expect(desktop).toMatch(/STEP_TITLE =\s*`step-title \$\{HOMEPAGE_TITLE_TYPE\}[^`]*text-white/);
    expect(desktop).toContain("Puzzle className=\"h-[1em] w-[1em] shrink-0\"");
    expect(desktop).toContain("History className=\"h-[1em] w-[1em] shrink-0\"");
    expect(desktop).toContain("CreditCard className=\"h-[1em] w-[1em] shrink-0\"");
    expect(desktop).toContain('min-h-[4rem]');
    expect(desktop).not.toContain('min-h-[4.125rem]');
    expect(desktop).toMatch(/STEP_PILL_ROW =\s*'[^']*overflow-visible/);
    expect(desktop).not.toMatch(/STEP_TITLE =\s*'[^']*overflow-hidden/);
    expect(desktop).not.toMatch(/STEP_TITLE =\s*`[^`]*overflow-hidden/);
    expect(desktop).not.toMatch(/STEP_PILL_ROW =\s*'[^']*overflow-hidden/);
    expect(desktop).toMatch(/feature-title \$\{HOMEPAGE_TITLE_TYPE\}/);

    expect(css).toMatch(
      /\.homepage-steps \.step-header-pill[\s\S]*?font-size:\s*var\(--type-rest\)/,
    );
    expect(css).toMatch(
      /\.homepage-steps \.step-title[\s\S]*?font-size:\s*var\(--type-rest\)/,
    );
    expect(css).toMatch(/\.feature-title \{[\s\S]*?font-size:\s*var\(--type-rest\)/);
    expect(css).not.toMatch(
      /\.homepage-steps \.step-header-pill \{[\s\S]*?font-size:\s*calc\(var\(--type-ui\) \* 1\.5\)/,
    );
    expect(css).toContain('font-size: 9.36rem !important;');

    expect(mobile).toContain('step-header-pill');
    expect(mobile).toContain('homepage-title-type text-xs');
    expect(mobile).toMatch(/MOBILE_STEP_TITLE = `step-title[\s\S]*?text-white/);
    expect(mobile).not.toContain('text-white/90');
    expect(mobile).not.toContain('text-[1.125rem]');
    expect(mobile).toContain("Puzzle className=\"h-[1em] w-[1em] shrink-0\"");
    expect(mobile).toContain("History className=\"h-[1em] w-[1em] shrink-0\"");
    expect(mobile).toContain("CreditCard className=\"h-[1em] w-[1em] shrink-0\"");
  });

  it('shares one readable popover token across language and saved resumes, not feature chips', () => {
    expect(HOMEPAGE_POPOVER_TYPE).toContain('homepage-popover');
    expect(HOMEPAGE_POPOVER_TYPE).toContain('text-sm sm:text-base lg:text-2xl xl:text-3xl');
    expect(HOMEPAGE_POPOVER_TYPE).toMatch(/\bxl:text-3xl\b/);
    expect(HOMEPAGE_POPOVER_TYPE).not.toMatch(/(^|\s)text-3xl\b/);
    expect(HOMEPAGE_POPOVER_PANEL).toContain(HOMEPAGE_POPOVER_TYPE);
    expect(HOMEPAGE_POPOVER_PANEL).toContain('overflow-y-auto');
    expect(HOMEPAGE_POPOVER_PANEL).not.toContain('overflow-hidden');
    expect(HOMEPAGE_POPOVER_OPTION).toContain('px-[0.9em]');
    expect(HOMEPAGE_POPOVER_OPTION).toContain('py-[0.7em]');

    const desktop = readFileSync(join(process.cwd(), 'components/InputForm.tsx'), 'utf8');
    const mobile = readFileSync(join(process.cwd(), 'components/InputFormMobile.tsx'), 'utf8');
    const lang = readFileSync(join(process.cwd(), 'components/LanguageSwitcher.tsx'), 'utf8');
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');

    expect(desktop).toContain('HOMEPAGE_POPOVER_PANEL');
    expect(desktop).toContain('HOMEPAGE_POPOVER_OPTION');
    expect(desktop).toMatch(/absolute left-0 top-full min-w-\[22em\] w-max/);
    expect(desktop).not.toMatch(/feature-desc[^"]*text-sm/);
    expect(desktop).not.toMatch(/HOMEPAGE_POPOVER_PANEL[\s\S]{0,240}feature-desc/);
    expect(desktop).toMatch(/grid-rows-\[1fr\]/);
    expect(desktop).toMatch(/grid-rows-\[0fr\]/);
    expect(mobile).toContain('HOMEPAGE_POPOVER_PANEL');
    expect(mobile).not.toContain('text-[10px]');
    expect(lang).toContain('HOMEPAGE_POPOVER_PANEL');
    expect(css).toMatch(
      /\.homepage-font-large \.homepage-popover[\s\S]*?font-size:\s*var\(--type-chrome\)/,
    );
  });
});

describe('Guide inner section cards', () => {
  it('reuses the interview-question blue chrome (border-blue-500, rounded, padded)', () => {
    expect(GUIDE_SECTION_FRAME).toContain(REPORT_FRAME_BORDER);
    expect(GUIDE_SECTION_FRAME).toMatch(/rounded-xl/);
    expect(GUIDE_SECTION_FRAME).toMatch(/border-2 border-blue-500/);
    expect(GUIDE_SECTION_FRAME).toMatch(/p-5/);
    expect(GUIDE_SECTION_FRAME).toMatch(/bg-slate-900\/55/);
    const pages = readFileSync(
      join(process.cwd(), 'components/report/SevenItemPages.tsx'),
      'utf8',
    );
    expect(pages).toContain('GUIDE_SECTION_FRAME');
    expect(pages).toContain('function SectionCard');
    expect(pages).toContain('function SummaryCard');
    expect(pages).toContain('className="overflow-visible"');
    expect(pages).toContain('relaxed');
  });

  it('puts pay, benefits, and script inside one negotiate GUIDE_SECTION_FRAME', () => {
    const pages = readFileSync(
      join(process.cwd(), 'components/report/SevenItemPages.tsx'),
      'utf8',
    );
    const negotiate = pages.slice(pages.indexOf("if (item === 'negotiate')"));
    expect(negotiate).toContain('<SectionCard title={copy.playbook}>');
    expect(negotiate).toContain('<InnerSection title={copy.pay}>');
    expect(negotiate).toContain('<InnerSection title={copy.benefits}>');
    expect(negotiate).toContain('title={copy.say}');
    expect(negotiate).toMatch(/md:grid-cols-2/);
    expect(negotiate.indexOf('title={copy.say}')).toBeGreaterThan(
      negotiate.indexOf('<InnerSection title={copy.benefits}>'),
    );
    expect(negotiate).not.toContain('<SectionCard title={copy.pay}>');
    expect(negotiate).not.toContain('<SectionCard title={copy.benefits}>');
    expect(negotiate).not.toContain('<SectionCard title={copy.say}');
    expect(negotiate).toContain('<SectionCard title={copy.askCompany}>');
    expect(negotiate).toContain('<NumberedList items={briefLines(negotiation.company_questions)} />');
    expect(negotiate).not.toContain('PointList items={briefLines(negotiation.company_questions)}');
    expect(pages).toContain('list-outside list-decimal');
    expect(negotiate).toContain('labeled');
    expect(negotiate).toContain('${BODY_COPY} mb-4');
    expect(negotiate).not.toContain('${BODY_MUTED} mb-4');
    expect(pages).toContain('${REPORT_H3}');
    expect(pages).toContain('<span>{title}</span>');
  });
});

describe('report item heading scale', () => {
  it('defines L1/L2/L3 as blue-family CSS classes with a size and hue order', () => {
    expect(REPORT_H1).toBe('report-h1');
    expect(REPORT_H2).toBe('report-h2');
    expect(REPORT_H3).toBe('report-h3');

    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    expect(css).toMatch(/\.report-h1 \{[\s\S]*?font-size:\s*1\.5rem/);
    expect(css).toMatch(/\.report-h1 \{[\s\S]*?color:\s*rgb\(125 211 252\)/);
    expect(css).toMatch(/\.report-h2 \{[\s\S]*?font-size:\s*1\.25rem/);
    expect(css).toMatch(/\.report-h2 \{[\s\S]*?color:\s*rgb\(96 165 250\)/);
    expect(css).toMatch(/\.report-h3 \{[\s\S]*?font-size:\s*1\.125rem/);
    expect(css).toMatch(/\.report-h3 \{[\s\S]*?color:\s*rgb\(59 130 246\)/);
    expect(css).toMatch(/\.report-body \{[\s\S]*?font-size:\s*1\.125rem/);
    expect(css).toMatch(/\.report-body \{[\s\S]*?color:\s*rgb\(241 245 249\)/);

    const pages = readFileSync(
      join(process.cwd(), 'components/report/SevenItemPages.tsx'),
      'utf8',
    );
    expect(pages).toContain('REPORT_H1');
    expect(pages).toContain('REPORT_H2');
    expect(pages).toContain('REPORT_H3');
    expect(pages).not.toMatch(/className=\{`mb-2 \$\{SUBHEAD\}`\}/);
    expect(pages).not.toContain('text-2xl font-black text-blue-400');
  });

  it('sizes Guide in-report tab labels to REPORT_H1 / 職位核心解析 (1.5rem)', () => {
    expect(REPORT_GUIDE_TAB_TYPE).toMatch(/text-2xl/);
    expect(REPORT_GUIDE_TAB_TYPE).toMatch(/font-black/);
    expect(REPORT_GUIDE_TAB_GAP).toBe('gap-3');

    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    expect(css).toMatch(/\.report-h1 \{[\s\S]*?font-size:\s*1\.5rem/);

    const dashboard = readFileSync(
      join(process.cwd(), 'components/FullReportDashboard.tsx'),
      'utf8',
    );
    expect(dashboard).toContain('REPORT_GUIDE_TAB_TYPE');
    expect(dashboard).toContain('REPORT_GUIDE_TAB_GAP');
    expect(dashboard).toContain('sm:flex-nowrap');
    expect(dashboard).not.toMatch(/flex flex-wrap gap-2"/);
    expect(dashboard).not.toMatch(/text-base sm:text-lg font-bold/);

    const pages = readFileSync(
      join(process.cwd(), 'components/report/SevenItemPages.tsx'),
      'utf8',
    );
    expect(pages).toContain('<h2 className={REPORT_H1}>{title}</h2>');
    expect(pages).toContain('<ItemBlock title={copy.core}');
    expect(pages.indexOf('<ItemBlock title={copy.fit}')).toBeLessThan(
      pages.indexOf('<ItemBlock title={copy.market}'),
    );
    expect(pages.indexOf('<ItemBlock title={copy.market}')).toBeLessThan(
      pages.indexOf('<ItemBlock title={copy.core}'),
    );
  });

  it('renders Guide header as two bright-white lines: company then role', () => {
    expect(REPORT_HEADER_JOB_LINE).toContain(REPORT_GUIDE_TAB_TYPE);
    expect(REPORT_HEADER_JOB_LINE).toMatch(/text-2xl/);
    expect(REPORT_HEADER_JOB_LINE).toMatch(/font-black/);
    expect(REPORT_HEADER_JOB_LINE).toMatch(/text-zinc-100/);
    expect(REPORT_HEADER_JOB_LINE).not.toMatch(/slate-400/);

    const dashboard = readFileSync(
      join(process.cwd(), 'components/FullReportDashboard.tsx'),
      'utf8',
    );
    expect(dashboard).toContain('REPORT_HEADER_JOB_LINE');
    expect(dashboard).not.toMatch(/text-lg text-slate-400 mt-1.5/);
    expect(dashboard).not.toMatch(/job_title[\s\S]{0,80}·[\s\S]{0,80}company_name/);
    expect(dashboard).not.toMatch(/company_name[\s\S]{0,80}·[\s\S]{0,80}job_title/);

    const headerStart = dashboard.indexOf('{copy.productTitle}');
    const headerEnd = dashboard.indexOf('{isSample ?');
    const header = dashboard.slice(headerStart, headerEnd);
    expect(header).toContain('companyLine');
    expect(header).toContain('roleLine');
    expect(header.match(/REPORT_HEADER_JOB_LINE/g)?.length).toBe(2);
    expect(header.indexOf('companyLine')).toBeLessThan(header.indexOf('roleLine'));

    const snapshot = readFileSync(
      join(process.cwd(), 'components/LiteReportDashboard.tsx'),
      'utf8',
    );
    expect(snapshot).not.toContain('REPORT_HEADER_JOB_LINE');
    expect(snapshot).not.toMatch(/text-lg text-slate-400 mt-1.5/);
  });
});

describe('pay-range widths', () => {
  it('centers Snapshot market in leftover space after the heading, Guide land full width', () => {
    expect(PAY_RANGE_SNAPSHOT_COLUMN).toBe(
      'flex min-w-0 flex-1 justify-center',
    );
    expect(PAY_RANGE_SNAPSHOT_WIDTH).toBe('w-[90%] max-w-[90%] mx-auto min-w-0');
    expect(PAY_RANGE_LINE_WIDTH).toBe('w-full mx-auto min-w-0');
    expect(PAY_RANGE_SNAPSHOT_COLUMN).toContain('flex-1');
    expect(PAY_RANGE_SNAPSHOT_COLUMN).toContain('justify-center');
    expect(PAY_RANGE_SNAPSHOT_COLUMN).not.toContain('md:w-1/2');
    expect(PAY_RANGE_SNAPSHOT_COLUMN).not.toContain('md:ml-auto');
    expect(PAY_RANGE_SNAPSHOT_WIDTH).toContain('mx-auto');
    expect(PAY_RANGE_SNAPSHOT_WIDTH).not.toContain('w-1/2');
    const pages = readFileSync(
      join(process.cwd(), 'components/report/SevenItemPages.tsx'),
      'utf8',
    );
    expect(pages).toContain('variant="hero"');
    expect(pages).toContain('PAY_RANGE_SNAPSHOT_COLUMN');
    expect(pages).toContain('PAY_RANGE_SNAPSHOT_WIDTH');
    expect(pages).toContain('md:flex-row md:items-center');
    expect(pages).toContain('flex shrink-0 flex-wrap items-baseline gap-x-2');
    expect(pages).toContain('space-y-8');
    expect(pages).toContain('bodyClassName="mt-8"');
    expect(pages).not.toContain('md:w-1/2');
    expect(pages).not.toContain('PAY_RANGE_LINE_MARKET_WIDTH');
  });
});

describe('pay-mix legend', () => {
  it('clusters label, amount, and percent instead of stretching across the report', () => {
    const pages = readFileSync(
      join(process.cwd(), 'components/report/SevenItemPages.tsx'),
      'utf8',
    );
    expect(pages).toContain('md:grid-cols-[16rem_auto]');
    expect(pages).toContain('w-max max-w-full grid-cols-[auto_auto_auto_auto]');
    expect(pages).not.toContain('min-w-0 flex-1 font-semibold text-slate-100');
    expect(pages).not.toContain('md:grid-cols-[16rem_1fr]');
  });
});

describe('page shell gutters', () => {
  it('matches homepage left/right vw padding on samples and live report shells', () => {
    expect(PAGE_SHELL_GUTTER).toBe('px-[3.5vw] sm:px-[4vw] lg:px-[4vw] xl:px-[4.5vw]');
    expect(PAGE_SHELL_GUTTER_LEFT).toBe(
      'pl-[3.5vw] sm:pl-[4vw] lg:pl-[4vw] xl:pl-[4.5vw]',
    );
    expect(PAGE_SHELL_GUTTER_RIGHT).toBe(
      'pr-[3.5vw] sm:pr-[4vw] lg:pr-[4vw] xl:pr-[4.5vw]',
    );
    expect(REPORT_SHELL_WIDTH).toBe('w-full max-w-full');
    expect(REPORT_SHELL_WIDTH).not.toMatch(/\d+rem/);

    const homepage = readFileSync(join(process.cwd(), 'app/page.tsx'), 'utf8');
    const samples = readFileSync(
      join(process.cwd(), 'app/samples/SampleReportClient.tsx'),
      'utf8',
    );
    const report = readFileSync(join(process.cwd(), 'app/report/page.tsx'), 'utf8');
    const account = readFileSync(join(process.cwd(), 'app/account/page.tsx'), 'utf8');
    const compareModal = readFileSync(
      join(process.cwd(), 'components/ReportCompareModal.tsx'),
      'utf8',
    );

    expect(homepage).toContain(PAGE_SHELL_GUTTER);
    expect(samples).toContain('PAGE_SHELL_GUTTER_LEFT');
    expect(samples).toContain('PAGE_SHELL_GUTTER_RIGHT');
    expect(samples).toContain('SAMPLE_RAIL_ROW');
    expect(report).toContain('PAGE_SHELL_GUTTER_LEFT');
    expect(report).toContain('PAGE_SHELL_GUTTER_RIGHT');
    expect(report).toContain('SAMPLE_RAIL_ROW');
    expect(account).toContain('PAGE_SHELL_GUTTER_LEFT');
    expect(account).toContain('PAGE_SHELL_GUTTER_RIGHT');
    expect(account).toContain('SAMPLE_RAIL_ROW');
    expect(compareModal).toContain('PAGE_SHELL_GUTTER');
    expect(samples).not.toMatch(/header className="[^"]*px-6 py-6 sm:px-8/);
    expect(report).not.toMatch(/header className="[^"]*px-6 py-4/);
  });

  it('lets samples and live report grow with the document instead of locking the viewport', () => {
    const samples = readFileSync(
      join(process.cwd(), 'app/samples/SampleReportClient.tsx'),
      'utf8',
    );
    const report = readFileSync(join(process.cwd(), 'app/report/page.tsx'), 'utf8');
    const fit = readFileSync(join(process.cwd(), 'components/FitStage.tsx'), 'utf8');
    const rail = readFileSync(join(process.cwd(), 'components/FunctionRail.tsx'), 'utf8');

    expect(samples).toContain('min-h-screen');
    expect(samples).not.toMatch(/(?:^|[^\w-])h-screen(?:[^\w-]|$)/);
    expect(samples).not.toMatch(/overflow-hidden \$\{SAMPLE_RAIL_ROW\}/);
    expect(samples).not.toMatch(/overflow-auto/);
    expect(report).not.toMatch(/flex-1 overflow-hidden py-6/);
    expect(report).not.toMatch(/overflow-x-clip/);
    expect(fit).not.toMatch(/overflow-x-clip self-stretch/);
    expect(rail).not.toMatch(/overflow-y-auto/);
  });
});

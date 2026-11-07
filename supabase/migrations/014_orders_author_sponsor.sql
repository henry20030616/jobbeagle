-- Allow sponsor / tip checkouts (no report credits).
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_plan_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_plan_type_check CHECK (
  plan_type IN (
    'basic_overage',
    'premium_report',
    'monthly_subscription',
    'single_lite',
    'single_full',
    'standard_subscription',
    'advanced_subscription',
    'single_job_fit_snapshot',
    'single_interview_strategy_guide',
    'author_sponsor'
  )
);

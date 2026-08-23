import { REPORT_ACTION_TEXT, SAMPLE_RAIL_TEXT } from '@/constants/report-frame';

describe('report chrome type scale', () => {
  it('keeps sample-rail and action buttons at display size (not compact chips)', () => {
    expect(SAMPLE_RAIL_TEXT).toMatch(/text-4xl/);
    expect(REPORT_ACTION_TEXT).toMatch(/text-5xl/);
  });
});

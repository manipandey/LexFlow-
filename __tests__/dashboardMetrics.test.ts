// __tests__/dashboardMetrics.test.ts
import { getDashboardMetrics } from '@/app/actions/dashboard';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

test('getDashboardMetrics returns correct shape', async () => {
  const mockSupabase = {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-id' } } }) },
    from: jest.fn(),
  } as any;

  (createClient as any).mockResolvedValue(mockSupabase);

  const responses: Record<string, any> = {
    clients: { count: 5 },
    cases: { count: 3 },
    hearings: { count: 2 },
    tasks: { count: 4 },
    invoices: { data: [{ paid_amount: '100' }, { paid_amount: '200' }] },
    profiles: { count: 6 },
  };

  mockSupabase.from.mockImplementation((table: string) => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      head: true,
      count: 'exact',
    };
    if (table === 'profiles') {
      chain.single = jest.fn().mockResolvedValue({ data: { firm_id: 'test-firm' } });
    }
    if (responses[table]) {
      chain.data = responses[table].data;
      chain.count = responses[table].count;
    }
    return chain;
  });

  const metrics = await getDashboardMetrics('test-firm');
  expect(metrics).toMatchObject({
    totalClients: expect.any(Number),
    activeCases: expect.any(Number),
    closedCases: expect.any(Number),
    upcomingHearings: expect.any(Number),
    pendingTasks: expect.any(Number),
    overdueTasks: expect.any(Number),
    teamMembers: expect.any(Number),
    monthlyRevenue: expect.any(Number),
  });
});

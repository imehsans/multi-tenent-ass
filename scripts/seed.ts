/**
 * Usage:
 *   npm run db:seed
 */

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Configuration
const CONFIG = {
  ORGANIZATIONS: 3,
  USERS_PER_ORG: 20,
  TICKETS_PER_ORG: 3500, // 3500 * 3 = 10,500 tickets total
  TIMELINE_EVENTS_PER_TICKET: 5,
  BATCH_SIZE: 1000,
  DEFAULT_PASSWORD: 'password123',
};

const TICKET_STATUSES = ['open', 'investigating', 'mitigated', 'resolved'] as const;
const TICKET_SEVERITIES = [1, 2, 3, 4, 5] as const;
const ROLES = ['owner', 'admin', 'member', 'viewer'] as const;

const EVENT_TYPES = [
  'comment',
  'status_change',
  'assignment_change',
  'severity_change',
  'created',
] as const;

// Realistic ticket titles and descriptions
const TICKET_TEMPLATES = {
  titles: [
    'Database connection timeout in production',
    'User authentication failing intermittently',
    'Memory leak in background worker',
    'API response time degradation',
    'CSS styling issue on mobile devices',
    'Payment processing error for subscription',
    'Email notification not being sent',
    'Search functionality returns incorrect results',
    'Dashboard loading extremely slow',
    'File upload fails for large files',
    'Session timeout too aggressive',
    'Missing translation for new feature',
    'Dark mode toggle not persisting',
    'Export to CSV generates malformed data',
    'Calendar widget displaying wrong timezone',
    'Password reset link expires too quickly',
    'Notification badge count incorrect',
    'Infinite scroll not loading more items',
    'Form validation allows invalid input',
    'Cached data not refreshing properly',
  ],
  descriptions: [
    'Users are experiencing consistent failures when attempting this operation. Error logs show timeout exceptions.',
    'This is affecting approximately 15% of users. Investigation shows it may be related to recent deployment.',
    'Memory usage gradually increases over time, eventually causing the service to become unresponsive.',
    'Performance monitoring indicates this issue started after the last infrastructure change.',
    'Multiple users have reported this issue across different browsers and devices.',
    'This is a critical issue affecting revenue. Priority should be elevated.',
    'Logs indicate the service is running but messages are queued and not being processed.',
    'QA team identified this during regression testing. It appears to be a recent regression.',
    'Chrome DevTools shows excessive network requests and blocking JavaScript.',
    'Issue only reproduces with files larger than 50MB. Smaller files work fine.',
  ],
};

// Helper Functions
function randomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function batchInsert<T>(
  table: string,
  records: T[],
  batchSize: number = CONFIG.BATCH_SIZE
): Promise<void> {
  const batches = Math.ceil(records.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min((i + 1) * batchSize, records.length);
    const batch = records.slice(start, end);

    const { error } = await supabase.from(table).insert(batch);

    if (error) {
      console.error(`❌ Batch ${i + 1}/${batches} failed for ${table}:`, error.message);
      throw error;
    }

    process.stdout.write(`\r   Progress: ${end}/${records.length} records inserted`);
  }
  console.log(); // New line after progress
}

async function createOrganization(index: number) {
  const slug = `org-${faker.company.buzzNoun()}-${Date.now()}-${index}`.toLowerCase();

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: faker.company.name(),
      slug,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createUsers(orgId: string, count: number) {
  console.log(`\n📝 Creating ${count} users...`);
  const users = [];

  // Create primary roles first (1 owner, 2 admins, rest distributed)
  const roleDistribution = [
    { role: 'owner', count: 1 },
    { role: 'admin', count: 2 },
    { role: 'member', count: Math.floor(count * 0.6) },
    { role: 'viewer', count: 0 }, // Fill remaining
  ];

  roleDistribution[3].count = count - roleDistribution[0].count - roleDistribution[1].count - roleDistribution[2].count;

  for (const { role, count: roleCount } of roleDistribution) {
    for (let i = 0; i < roleCount; i++) {
      const email = faker.internet.email().toLowerCase();

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: CONFIG.DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: faker.person.fullName(),
        },
      });

      if (authError && !authError.message.includes('already registered')) {
        console.error(`Failed to create user ${email}:`, authError.message);
        continue;
      }

      const userId = authData.user?.id;
      if (!userId) continue;

      users.push({ userId, email, role });

      // Assign role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        org_id: orgId,
        role,
      });

      if (roleError && !roleError.message.includes('duplicate')) {
        console.error(`Failed to assign role:`, roleError.message);
      }
    }
  }

  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function createTickets(orgId: string, userIds: string[], count: number) {
  console.log(`\n🎫 Generating ${count} tickets...`);
  const tickets = [];

  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  // Status distribution (realistic)
  const statusDistribution = {
    open: 0.30,           // 30% open
    investigating: 0.25,  // 25% investigating
    mitigated: 0.15,      // 15% mitigated
    resolved: 0.30,       // 30% resolved
  };

  // Severity distribution (realistic)
  const severityDistribution = {
    1: 0.05,  // 5% critical
    2: 0.15,  // 15% high
    3: 0.40,  // 40% medium
    4: 0.30,  // 30% low
    5: 0.10,  // 10% trivial
  };

  for (let i = 0; i < count; i++) {
    const createdBy = randomElement(userIds);
    const assigneeId = Math.random() > 0.3 ? randomElement(userIds) : null; // 70% assigned

    // Weighted random status
    const statusRand = Math.random();
    let status: typeof TICKET_STATUSES[number] = 'open';
    let cumulative = 0;
    for (const [s, prob] of Object.entries(statusDistribution)) {
      cumulative += prob;
      if (statusRand <= cumulative) {
        status = s as typeof TICKET_STATUSES[number];
        break;
      }
    }

    // Weighted random severity
    const severityRand = Math.random();
    let severity: number = 3;
    cumulative = 0;
    for (const [sev, prob] of Object.entries(severityDistribution)) {
      cumulative += prob;
      if (severityRand <= cumulative) {
        severity = parseInt(sev);
        break;
      }
    }

    const createdAt = randomDate(sixMonthsAgo, now);
    const updatedAt = new Date(createdAt.getTime() + randomInt(0, 7 * 24 * 60 * 60 * 1000));

    tickets.push({
      org_id: orgId,
      title: randomElement(TICKET_TEMPLATES.titles) + ` (#${i + 1})`,
      description: randomElement(TICKET_TEMPLATES.descriptions),
      status,
      severity,
      created_by: createdBy,
      assignee_id: assigneeId,
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString(),
    });
  }

  console.log('   Inserting tickets in batches...');
  await batchInsert('tickets', tickets);

  return tickets;
}

async function createTimelineEvents(
  orgId: string,
  ticketIds: string[],
  userIds: string[],
  eventsPerTicket: number
) {
  console.log(`\n💬 Generating timeline events...`);
  const events = [];
  const totalEvents = ticketIds.length * eventsPerTicket;

  console.log(`   Total events to create: ${totalEvents.toLocaleString()}`);

  // Sample only some tickets for timeline events to avoid excessive data
  const sampleSize = Math.min(2000, ticketIds.length);
  const sampledTicketIds = ticketIds.slice(0, sampleSize);

  for (const ticketId of sampledTicketIds) {
    const eventCount = randomInt(2, eventsPerTicket);

    for (let i = 0; i < eventCount; i++) {
      const eventType = randomElement(EVENT_TYPES);
      const actorId = randomElement(userIds);

      let content = null;
      let metadata = null;

      switch (eventType) {
        case 'comment':
          content = faker.lorem.sentences(randomInt(1, 3));
          break;
        case 'status_change':
          metadata = {
            old_status: randomElement(TICKET_STATUSES),
            new_status: randomElement(TICKET_STATUSES),
          };
          break;
        case 'assignment_change':
          metadata = {
            old_assignee: randomElement(userIds),
            new_assignee: randomElement(userIds),
          };
          break;
        case 'severity_change':
          metadata = {
            old_severity: randomElement(TICKET_SEVERITIES),
            new_severity: randomElement(TICKET_SEVERITIES),
          };
          break;
      }

      events.push({
        ticket_id: ticketId,
        org_id: orgId,
        event_type: eventType,
        actor_id: actorId,
        content,
        metadata,
        created_at: new Date(Date.now() - randomInt(0, 30 * 24 * 60 * 60 * 1000)).toISOString(),
      });
    }
  }

  console.log(`   Inserting ${events.length.toLocaleString()} timeline events in batches...`);
  await batchInsert('ticket_timeline_events', events);
}

async function main() {
  console.log('🚀 High-Performance Seed Script');
  console.log('================================\n');
  console.log(`Configuration:`);
  console.log(`  - Organizations: ${CONFIG.ORGANIZATIONS}`);
  console.log(`  - Users per org: ${CONFIG.USERS_PER_ORG}`);
  console.log(`  - Tickets per org: ${CONFIG.TICKETS_PER_ORG}`);
  console.log(`  - Total tickets: ${CONFIG.ORGANIZATIONS * CONFIG.TICKETS_PER_ORG}`);
  console.log(`  - Timeline events per ticket: ${CONFIG.TIMELINE_EVENTS_PER_TICKET}`);
  console.log(`  - Batch size: ${CONFIG.BATCH_SIZE}\n`);

  const startTime = Date.now();

  for (let i = 0; i < CONFIG.ORGANIZATIONS; i++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Organization ${i + 1}/${CONFIG.ORGANIZATIONS}`);
    console.log(`${'='.repeat(60)}`);

    // Create organization
    console.log('\n🏢 Creating organization...');
    const org = await createOrganization(i);
    console.log(`✅ Created: ${org.name} (${org.slug})`);

    // Create users
    const users = await createUsers(org.id, CONFIG.USERS_PER_ORG);
    const userIds = users.map(u => u.userId);

    // Create tickets
    const tickets = await createTickets(org.id, userIds, CONFIG.TICKETS_PER_ORG);

    // Fetch inserted ticket IDs
    const { data: insertedTickets } = await supabase
      .from('tickets')
      .select('id')
      .eq('org_id', org.id);

    if (insertedTickets) {
      const ticketIds = insertedTickets.map(t => t.id);

      // Create timeline events
      await createTimelineEvents(
        org.id,
        ticketIds,
        userIds,
        CONFIG.TIMELINE_EVENTS_PER_TICKET
      );
    }

    console.log(`\n✅ Organization ${i + 1} complete!`);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('✨ Seeding Complete!');
  console.log('='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`  - Total execution time: ${duration}s`);
  console.log(`  - Organizations created: ${CONFIG.ORGANIZATIONS}`);
  console.log(`  - Users created: ${CONFIG.ORGANIZATIONS * CONFIG.USERS_PER_ORG}`);
  console.log(`  - Tickets created: ${CONFIG.ORGANIZATIONS * CONFIG.TICKETS_PER_ORG}`);
  console.log(`\n🔑 Login Credentials:`);
  console.log(`  - Email: Check created users (any email)`);
  console.log(`  - Password: ${CONFIG.DEFAULT_PASSWORD}`);
  console.log('\n💡 Tip: Use the first organization admin user to log in and explore!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });

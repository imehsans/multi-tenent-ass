/**
 * Complete Reset and Seed Script
 *
 * 1. Resets the database (if SQL executed manually)
 * 2. Creates Org, Users (Owner, Admin, Member, Viewer)
 * 3. Populates tickets to test each role's access
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const PASSWORD = 'password';

const ROLES = [
  { role: 'owner', email: 'owner@example.com', name: 'Owner User' },
  { role: 'admin', email: 'admin@example.com', name: 'Admin User' },
  { role: 'member', email: 'member@example.com', name: 'Member User' },
  { role: 'viewer', email: 'viewer@example.com', name: 'Viewer User' },
];

async function main() {
  console.log('🚀 Starting Full Seed Process...');

  // 1. Create Organization
  console.log('Creating Organization...');
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: 'Role Capabilities Test Corp',
      slug: 'roles-test-' + uuidv4().slice(0, 8),
    })
    .select()
    .single();

  if (orgError) {
    console.error('Failed to create org:', orgError);
    return;
  }
  console.log(`✅ Organization Created: ${org.name} (${org.id})`);

  // 2. Create Users & Assign Roles
  const userMap = new Map(); // role -> userId

  for (const u of ROLES) {
    console.log(`Creating/Fetching User: ${u.email}...`);

    // Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.name },
    });

    let userId = authData.user?.id;

    if (authError) {
      // If user exists, fetch ID (cannot sign in to get ID without password flow, so we list users - slow but fine for seed)
      // Or just try to find via admin api
      if (authError.message.includes('already registered')) {
        // This is a bit tricky with just service key without listing all users,
        // but for dev env we can usually assume success or use listUsers.
        // Let's try to just continue and hope we can somehow get the ID if we really need it.
        // Actually, let's list users to find it.
        const { data: listData } = await supabase.auth.admin.listUsers();
        const found = listData.users.find((x) => x.email === u.email);
        if (found) userId = found.id;
      } else {
        console.error(`Failed to create user ${u.email}:`, authError);
        continue;
      }
    }

    if (userId) {
      userMap.set(u.role, userId);
      // Assign Role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        org_id: org.id,
        role: u.role,
      });
      if (roleError && !roleError.message.includes('duplicate')) {
        console.error(`Failed to assign role to ${u.email}:`, roleError);
      } else {
        console.log(`   - Assigned [${u.role}] to ${u.email}`);
      }
    }
  }

  // 3. Create Dependent Data (Tickets)

  // Ticket 1: Created by Owner
  const ownerId = userMap.get('owner');
  if (ownerId) {
    await supabase.from('tickets').insert({
      org_id: org.id,
      title: 'Critical System Failure (Owner Created)',
      description: 'The main database is down. Severity 1.',
      status: 'open',
      severity: 1,
      created_by: ownerId,
    });
    console.log('✅ Created Ticket by Owner');
  }

  // Ticket 2: Created by Member
  const memberId = userMap.get('member');
  if (memberId) {
    await supabase.from('tickets').insert({
      org_id: org.id,
      title: 'UI Glitch on Login (Member Created)',
      description: 'Login button is slightly off-center.',
      status: 'investigating',
      severity: 3,
      created_by: memberId,
    });
    console.log('✅ Created Ticket by Member');
  }

  // Ticket 3: Closed Ticket
  if (ownerId) {
    await supabase.from('tickets').insert({
      org_id: org.id,
      title: 'Resolved Issue (Archive)',
      description: 'Old issue that was fixed.',
      status: 'resolved',
      severity: 4,
      created_by: ownerId,
    });
  }

  console.log('\n✨ Seeding Complete!');
  console.log('------------------------------------------------');
  console.log(`Org ID: ${org.id}`);
  console.log(`Users (Password: ${PASSWORD}):`);
  ROLES.forEach((r) => console.log(` - ${r.role.toUpperCase()}: ${r.email}`));
  console.log('------------------------------------------------');
}

main().catch(console.error);


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import slugify from 'slugify';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
   console.error('Missing Supabase URL or Service Role Key');
   process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
   const name = `Test Org ${Date.now()}`;
   const slug = slugify(name, { lower: true, strict: true });

   // We need a user ID to test the trigger properly as it relies on auth.uid()
   // But service role client bypasses RLS, so auth.uid() is null unless impersonating.
   // Triggers using auth.uid() will skip the logic if auth.uid() is null (see function definition).

   // So testing with service role key WON'T trigger the user_role assignment unless we mock it?
   // Actually the trigger function checks: IF auth.uid() IS NOT NULL THEN ...

   console.log('Inserting organization:', name, slug);
   const { data, error } = await supabase
      .from('organizations')
      .insert({ name, slug })
      .select()
      .single();

   if (error) {
      console.error('Error inserting organization:', error);
   } else {
      console.log('Organization inserted successfully:', data);

      // Clean up
      await supabase.from('organizations').delete().eq('id', data.id);
   }
}

testInsert();

/**
 * Supabase Database Types
 * 
 * Generated manually as a placeholder.
 * Run `npm run db:types` to overwrite this with real types from your database.
 */

export type Json =
   | string
   | number
   | boolean
   | null
   | { [key: string]: Json | undefined }
   | Json[]

export type Database = {
   public: {
      Tables: {
         organizations: {
            Row: {
               id: string
               created_at: string
               name: string
               slug: string
            }
            Insert: {
               id?: string
               created_at?: string
               name: string
               slug: string
            }
            Update: {
               id?: string
               created_at?: string
               name?: string
               slug?: string
            }
            Relationships: []
         }
         user_roles: {
            Row: {
               id: string
               created_at: string
               user_id: string
               org_id: string
               role: 'owner' | 'admin' | 'member' | 'viewer'
            }
            Insert: {
               id?: string
               created_at?: string
               user_id: string
               org_id: string
               role?: 'owner' | 'admin' | 'member' | 'viewer'
            }
            Update: {
               id?: string
               created_at?: string
               user_id?: string
               org_id?: string
               role?: 'owner' | 'admin' | 'member' | 'viewer'
            }
            Relationships: []
         }
         tickets: {
            Row: {
               id: string
               created_at: string
               updated_at: string
               org_id: string
               title: string
               description: string | null
               status: 'open' | 'investigating' | 'mitigated' | 'resolved'
               severity: number
               created_by: string | null
               assignee_id: string | null
               search_vector: unknown | null
            }
            Insert: {
               id?: string
               created_at?: string
               updated_at?: string
               org_id: string
               title: string
               description?: string | null
               status?: 'open' | 'investigating' | 'mitigated' | 'resolved'
               severity: number
               created_by?: string | null
               assignee_id?: string | null
               search_vector?: unknown | null
            }
            Update: {
               id?: string
               created_at?: string
               updated_at?: string
               org_id?: string
               title?: string
               description?: string | null
               status?: 'open' | 'investigating' | 'mitigated' | 'resolved'
               severity?: number
               created_by?: string | null
               assignee_id?: string | null
               search_vector?: unknown | null
            }
            Relationships: []
         }
         ticket_timeline_events: {
            Row: {
               id: string
               created_at: string
               ticket_id: string
               org_id: string
               event_type: string
               actor_id: string
               content: string | null
               metadata: Json | null
            }
            Insert: {
               id?: string
               created_at?: string
               ticket_id: string
               org_id: string
               event_type: string
               actor_id: string
               content?: string | null
               metadata?: Json | null
            }
            Update: {
               id?: string
               created_at?: string
               ticket_id?: string
               org_id?: string
               event_type?: string
               actor_id?: string
               content?: string | null
               metadata?: Json | null
            }
            Relationships: []
         }
         attachments: {
            Row: {
               id: string
               created_at: string
               ticket_id: string
               org_id: string
               file_name: string
               file_path: string
               file_size: number
               mime_type: string
               uploaded_by: string
            }
            Insert: {
               id?: string
               created_at?: string
               ticket_id: string
               org_id: string
               file_name: string
               file_path: string
               file_size: number
               mime_type: string
               uploaded_by: string
            }
            Update: {
               id?: string
               created_at?: string
               ticket_id?: string
               org_id?: string
               file_name?: string
               file_path?: string
               file_size?: number
               mime_type?: string
               uploaded_by?: string
            }
            Relationships: []
         }
         audit_logs: {
            Row: {
               id: string
               created_at: string
               org_id: string
               action: string
               entity_type: string
               entity_id: string
               actor_id: string
               old_data: Json | null
               new_data: Json | null
            }
            Insert: {
               id?: string
               created_at?: string
               org_id: string
               action: string
               entity_type: string
               entity_id: string
               actor_id: string
               old_data?: Json | null
               new_data?: Json | null
            }
            Update: {
               id?: string
               created_at?: string
               org_id?: string
               action?: string
               entity_type?: string
               entity_id?: string
               actor_id?: string
               old_data?: Json | null
               new_data?: Json | null
            }
            Relationships: []
         }
      }
      Views: {
      }
      Functions: {
         is_org_member: {
            Args: { organization_id: string }
            Returns: boolean
         }
      }
      Enums: {
         app_role: 'owner' | 'admin' | 'member' | 'viewer'
         ticket_status: 'open' | 'investigating' | 'mitigated' | 'resolved'
      }
   }
}

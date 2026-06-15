/**
 * Supabase Database types.
 *
 * PLACEHOLDER — hand-authored to match supabase/migrations so the app type-checks
 * before a live database exists. Once Supabase is running locally, regenerate the
 * authoritative version with:  `npm run db:types`
 *
 * Only the columns the app reads/writes today are fully typed; the generated file
 * will be exhaustive. Kept intentionally lightweight to avoid drift churn.
 */

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_user_id: string | null;
          username: string;
          email: string | null;
          display_name: string;
          avatar_url: string | null;
          status: "active" | "deactivated" | "suspended";
          is_admin: boolean;
          profile_visibility: "public" | "connections" | "private";
          email_verified: boolean;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          username: string;
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          headline: string | null;
          headline_template: string | null;
          identity_snapshot: string | null;
          identity_snapshot_edited: boolean;
          values: string[];
          work_style: string[];
          skills: string[];
          current_focus: string | null;
          current_struggle: string | null;
          ambitions: string | null;
          links: Json;
          hidden_sections: string[];
          completeness: number;
          career_identity_score: number | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { user_id: string } & Partial<
          Database["public"]["Tables"]["profiles"]["Row"]
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      ai_profiles: {
        Row: {
          user_id: string;
          onboarding_transcript: Json;
          extracted: Json;
          traits_vector: Json | null;
          suggestion_history: Json;
          dismissed_suggestions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: { user_id: string } & Partial<
          Database["public"]["Tables"]["ai_profiles"]["Row"]
        >;
        Update: Partial<Database["public"]["Tables"]["ai_profiles"]["Row"]>;
        Relationships: [];
      };
      missions: {
        Row: {
          id: string;
          slug: string;
          name: string;
          brief: string;
          description: string | null;
          accent_color: string;
          icon: string;
          is_active: boolean;
          is_archived: boolean;
          display_order: number;
          member_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["missions"]["Row"]> & {
          slug: string;
          name: string;
          brief: string;
        };
        Update: Partial<Database["public"]["Tables"]["missions"]["Row"]>;
        Relationships: [];
      };
      mission_members: {
        Row: {
          mission_id: string;
          user_id: string;
          joined_at: string;
          last_active_in_mission_at: string | null;
        };
        Insert: { mission_id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["mission_members"]["Row"]>;
        Relationships: [];
      };
      weekly_prompts: {
        Row: {
          id: string;
          mission_id: string;
          prompt: string;
          source: "ai" | "admin";
          is_active: boolean;
          starts_at: string;
          ends_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: { mission_id: string; prompt: string } & Partial<
          Database["public"]["Tables"]["weekly_prompts"]["Row"]
        >;
        Update: Partial<Database["public"]["Tables"]["weekly_prompts"]["Row"]>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          type: "question" | "discussion" | "prompt_response" | "update";
          body_html: string;
          body_text: string;
          mission_id: string | null;
          weekly_prompt_id: string | null;
          topics: string[];
          image_url: string | null;
          ai_flagged: boolean;
          ai_score: number | null;
          ai_flag_source: "heuristic" | "user" | "both" | null;
          reply_count: number;
          reaction_count: number;
          save_count: number;
          is_removed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: { author_id: string; body_html: string; body_text: string } & Partial<
          Database["public"]["Tables"]["posts"]["Row"]
        >;
        Update: Partial<Database["public"]["Tables"]["posts"]["Row"]>;
        Relationships: [];
      };
      replies: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body_html: string;
          body_text: string;
          parent_reply_id: string | null;
          ai_flagged: boolean;
          is_removed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          post_id: string;
          author_id: string;
          body_html: string;
          body_text: string;
        } & Partial<Database["public"]["Tables"]["replies"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["replies"]["Row"]>;
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          kind: "resonates" | "needed_this" | "lets_connect" | "helpful";
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          kind: Database["public"]["Tables"]["reactions"]["Row"]["kind"];
        };
        Update: Partial<Database["public"]["Tables"]["reactions"]["Row"]>;
        Relationships: [];
      };
      saved_posts: {
        Row: { user_id: string; post_id: string; created_at: string };
        Insert: { user_id: string; post_id: string };
        Update: Partial<Database["public"]["Tables"]["saved_posts"]["Row"]>;
        Relationships: [];
      };
      follows: {
        Row: { follower_id: string; following_id: string; created_at: string };
        Insert: { follower_id: string; following_id: string };
        Update: Partial<Database["public"]["Tables"]["follows"]["Row"]>;
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          requester_id: string;
          recipient_id: string;
          status: "pending" | "accepted" | "declined";
          note: string;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          requester_id: string;
          recipient_id: string;
          note: string;
        } & Partial<Database["public"]["Tables"]["connections"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["connections"]["Row"]>;
        Relationships: [];
      };
      // help_signals table parked — see docs/PARKED.md
      threads: {
        Row: {
          id: string;
          user_a: string;
          user_b: string;
          state: "request" | "accepted" | "blocked";
          initiated_by: string;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          user_a: string;
          user_b: string;
          initiated_by: string;
        } & Partial<Database["public"]["Tables"]["threads"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["threads"]["Row"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: { thread_id: string; sender_id: string; body: string } & Partial<
          Database["public"]["Tables"]["messages"]["Row"]
        >;
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
        Relationships: [];
      };
      message_reactions: {
        Row: { message_id: string; user_id: string; emoji: string; created_at: string };
        Insert: { message_id: string; user_id: string; emoji: string };
        Update: Partial<Database["public"]["Tables"]["message_reactions"]["Row"]>;
        Relationships: [];
      };
      message_request_log: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          created_at: string;
        };
        Insert: { sender_id: string; recipient_id: string };
        Update: Partial<Database["public"]["Tables"]["message_request_log"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          type: string;
          actor_id: string | null;
          entity_type: string | null;
          entity_id: string | null;
          summary: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: { recipient_id: string; type: string } & Partial<
          Database["public"]["Tables"]["notifications"]["Row"]
        >;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          email_digest: "off" | "daily" | "weekly";
          push_enabled: boolean;
          in_app_types: Json;
          updated_at: string;
        };
        Insert: { user_id: string } & Partial<
          Database["public"]["Tables"]["notification_preferences"]["Row"]
        >;
        Update: Partial<Database["public"]["Tables"]["notification_preferences"]["Row"]>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          platform: "web" | "ios" | "android";
          endpoint: string;
          keys: Json | null;
          created_at: string;
        };
        Insert: { user_id: string; endpoint: string } & Partial<
          Database["public"]["Tables"]["push_subscriptions"]["Row"]
        >;
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      are_connected: { Args: { a: string; b: string }; Returns: boolean };
      current_user_id: { Args: Record<string, never>; Returns: string };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

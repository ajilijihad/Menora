export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type MemberRole = "owner" | "manager" | "editor";
type BusinessStatus = "draft" | "active" | "archived";
type BusinessType = "restaurant" | "cafe" | "bakery" | "other";
type SubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";
type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "canceled";
type EmailStatus = "queued" | "sent" | "failed";
type DomainStatus = "pending" | "verified" | "active" | "disabled";
type AnalyticsEventName = "menu_view" | "product_view";
type DeviceCategory = "mobile" | "tablet" | "desktop" | "unknown";
type ReferrerSource = "direct" | "search" | "social" | "other";

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/**
 * Matches supabase/migrations. Regenerate from a linked project with:
 * npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string;
          is_platform_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string;
          is_platform_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string;
          is_platform_admin?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          currency: string;
          status: BusinessStatus;
          is_published: boolean;
          suspended_at: string | null;
          business_type: BusinessType;
          logo_path: string | null;
          cover_path: string | null;
          poster_background_path: string | null;
          poster_size: string;
          phone: string | null;
          address: string | null;
          map_url: string | null;
          opening_hours: Json;
          social_links: Json;
          default_language: string;
          time_zone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          currency?: string;
          status?: BusinessStatus;
          is_published?: boolean;
          suspended_at?: string | null;
          business_type?: BusinessType;
          logo_path?: string | null;
          cover_path?: string | null;
          poster_background_path?: string | null;
          poster_size?: string;
          phone?: string | null;
          address?: string | null;
          map_url?: string | null;
          opening_hours?: Json;
          social_links?: Json;
          default_language?: string;
          time_zone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          currency?: string;
          status?: BusinessStatus;
          is_published?: boolean;
          suspended_at?: string | null;
          business_type?: BusinessType;
          logo_path?: string | null;
          cover_path?: string | null;
          poster_background_path?: string | null;
          poster_size?: string;
          phone?: string | null;
          address?: string | null;
          map_url?: string | null;
          opening_hours?: Json;
          social_links?: Json;
          default_language?: string;
          time_zone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role: MemberRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: MemberRole;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_categories: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          name_ar: string | null;
          description: string | null;
          description_ar: string | null;
          sort_order: number;
          is_active: boolean;
          is_published: boolean;
          icon: string | null;
          image_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          name_ar?: string | null;
          description?: string | null;
          description_ar?: string | null;
          sort_order?: number;
          is_active?: boolean;
          is_published?: boolean;
          icon?: string | null;
          image_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          name_ar?: string | null;
          description?: string | null;
          description_ar?: string | null;
          sort_order?: number;
          is_active?: boolean;
          is_published?: boolean;
          icon?: string | null;
          image_path?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_categories_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_products: {
        Row: {
          id: string;
          business_id: string;
          category_id: string;
          name: string;
          name_ar: string | null;
          description: string | null;
          description_ar: string | null;
          price_cents: number;
          compare_at_cents: number | null;
          image_path: string | null;
          sort_order: number;
          is_active: boolean;
          is_published: boolean;
          stock_status: "in_stock" | "out_of_stock";
          is_featured: boolean;
          dietary_labels: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          category_id: string;
          name: string;
          name_ar?: string | null;
          description?: string | null;
          description_ar?: string | null;
          price_cents: number;
          compare_at_cents?: number | null;
          image_path?: string | null;
          sort_order?: number;
          is_active?: boolean;
          is_published?: boolean;
          stock_status?: "in_stock" | "out_of_stock";
          is_featured?: boolean;
          dietary_labels?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          name_ar?: string | null;
          description?: string | null;
          description_ar?: string | null;
          price_cents?: number;
          compare_at_cents?: number | null;
          image_path?: string | null;
          sort_order?: number;
          is_active?: boolean;
          is_published?: boolean;
          stock_status?: "in_stock" | "out_of_stock";
          is_featured?: boolean;
          dietary_labels?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_products_category_business_fkey";
            columns: ["category_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "menu_categories";
            referencedColumns: ["id", "business_id"];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          business_id: string;
          product_id: string;
          name: string;
          name_ar: string | null;
          price_cents: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          product_id: string;
          name: string;
          name_ar?: string | null;
          price_cents: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          name_ar?: string | null;
          price_cents?: number;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_business_fkey";
            columns: ["product_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "menu_products";
            referencedColumns: ["id", "business_id"];
          },
        ];
      };
      product_addons: {
        Row: {
          id: string;
          business_id: string;
          product_id: string;
          name: string;
          name_ar: string | null;
          price_cents: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          product_id: string;
          name: string;
          name_ar?: string | null;
          price_cents: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          name_ar?: string | null;
          price_cents?: number;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_addons_product_business_fkey";
            columns: ["product_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "menu_products";
            referencedColumns: ["id", "business_id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          business_id: string;
          product_id: string;
          image_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          product_id: string;
          image_path: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          image_path?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_business_fkey";
            columns: ["product_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "menu_products";
            referencedColumns: ["id", "business_id"];
          },
        ];
      };
      business_theme_settings: {
        Row: {
          business_id: string;
          primary_color: string;
          accent_color: string;
          background_color: string;
          text_color: string;
          font_family: string;
          font_choice: string;
          type_scale: string;
          card_layout: string;
          image_ratio: string;
          radius_px: number;
          spacing_step: string;
          nav_style: string;
          featured_style: string;
          menu_theme: string;
          logo_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          primary_color?: string;
          accent_color?: string;
          background_color?: string;
          text_color?: string;
          font_family?: string;
          font_choice?: string;
          type_scale?: string;
          card_layout?: string;
          image_ratio?: string;
          radius_px?: number;
          spacing_step?: string;
          nav_style?: string;
          featured_style?: string;
          menu_theme?: string;
          logo_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          primary_color?: string;
          accent_color?: string;
          background_color?: string;
          text_color?: string;
          font_family?: string;
          font_choice?: string;
          type_scale?: string;
          card_layout?: string;
          image_ratio?: string;
          radius_px?: number;
          spacing_step?: string;
          nav_style?: string;
          featured_style?: string;
          menu_theme?: string;
          logo_path?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_theme_settings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_plans: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          amount_cents: number;
          currency: string;
          billing_interval: "month";
          is_active: boolean;
          max_businesses: number;
          max_products: number;
          max_themes: number;
          analytics_retention_days: number;
          custom_domains: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          amount_cents: number;
          currency: string;
          billing_interval?: "month";
          is_active?: boolean;
          max_businesses?: number;
          max_products?: number;
          max_themes?: number;
          analytics_retention_days?: number;
          custom_domains?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          amount_cents?: number;
          currency?: string;
          is_active?: boolean;
          max_businesses?: number;
          max_products?: number;
          max_themes?: number;
          analytics_retention_days?: number;
          custom_domains?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          business_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          requested_plan_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          requested_plan_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_id?: string;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          requested_plan_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          business_id: string;
          subscription_id: string;
          amount_cents: number;
          currency: string;
          status: PaymentStatus;
          provider: "paypal";
          provider_order_id: string | null;
          provider_capture_id: string | null;
          paid_at: string | null;
          plan_id: string | null;
          granted_period_start: string | null;
          granted_period_end: string | null;
          provider_refund_id: string | null;
          refunded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          subscription_id: string;
          amount_cents: number;
          currency: string;
          status: PaymentStatus;
          provider?: "paypal";
          provider_order_id?: string | null;
          provider_capture_id?: string | null;
          paid_at?: string | null;
          plan_id?: string | null;
          granted_period_start?: string | null;
          granted_period_end?: string | null;
          provider_refund_id?: string | null;
          refunded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: PaymentStatus;
          provider_order_id?: string | null;
          provider_capture_id?: string | null;
          paid_at?: string | null;
          plan_id?: string | null;
          granted_period_start?: string | null;
          granted_period_end?: string | null;
          provider_refund_id?: string | null;
          refunded_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      email_logs: {
        Row: {
          id: string;
          business_id: string | null;
          to_email: string;
          template: string;
          status: EmailStatus;
          provider_message_id: string | null;
          error_message: string | null;
          idempotency_key: string | null;
          subscription_id: string | null;
          payment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id?: string | null;
          to_email: string;
          template: string;
          status: EmailStatus;
          provider_message_id?: string | null;
          error_message?: string | null;
          idempotency_key?: string | null;
          subscription_id?: string | null;
          payment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: EmailStatus;
          provider_message_id?: string | null;
          error_message?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_logs_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_reminders: {
        Row: {
          id: string;
          subscription_id: string;
          period_end: string;
          reminder_type: "reminder_7" | "reminder_3" | "reminder_1" | "expired";
          status: EmailStatus;
          email_log_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          period_end: string;
          reminder_type: "reminder_7" | "reminder_3" | "reminder_1" | "expired";
          status: EmailStatus;
          email_log_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: EmailStatus;
          email_log_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      custom_domains: {
        Row: {
          id: string;
          business_id: string;
          hostname: string;
          status: DomainStatus;
          verification_token: string;
          verified_at: string | null;
          last_checked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          hostname: string;
          status?: DomainStatus;
          verification_token?: string;
          verified_at?: string | null;
          last_checked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          hostname?: string;
          status?: DomainStatus;
          verification_token?: string;
          verified_at?: string | null;
          last_checked_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custom_domains_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_events: {
        Row: {
          id: string;
          business_id: string;
          menu_product_id: string | null;
          event_name: AnalyticsEventName;
          occurred_at: string;
          visitor_hash: string | null;
          device_category: DeviceCategory;
          referrer_source: ReferrerSource;
          menu_category_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          menu_product_id?: string | null;
          event_name: AnalyticsEventName;
          occurred_at?: string;
          visitor_hash?: string | null;
          device_category?: DeviceCategory;
          referrer_source?: ReferrerSource;
          menu_category_id?: string | null;
          created_at?: string;
        };
        Update: {
          menu_product_id?: string | null;
          occurred_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_product_fkey";
            columns: ["menu_product_id"];
            isOneToOne: false;
            referencedRelation: "menu_products";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_admins: {
        Row: {
          user_id: string;
          appointed_at: string;
          note: string | null;
        };
        Insert: {
          user_id: string;
          appointed_at?: string;
          note?: string | null;
        };
        Update: {
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_admins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          target_table: string;
          target_id: string | null;
          reason: string;
          before_data: Json | null;
          after_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          action: string;
          target_table: string;
          target_id?: string | null;
          reason: string;
          before_data?: Json | null;
          after_data?: Json | null;
          created_at?: string;
        };
        Update: {
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_homepage: {
        Row: {
          singleton: boolean;
          content: Json;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          singleton?: boolean;
          content: Json;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          content?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_homepage_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_businesses: {
        Row: {
          id: string | null;
          name: string | null;
          slug: string | null;
          description: string | null;
          currency: string | null;
          business_type: string | null;
          logo_path: string | null;
          cover_path: string | null;
          phone: string | null;
          address: string | null;
          map_url: string | null;
          opening_hours: Json | null;
          social_links: Json | null;
          default_language: string | null;
          time_zone: string | null;
        };
        Relationships: Relationship[];
      };
    };
    Functions: {
      is_platform_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      admin_save_plan: {
        Args: {
          target_id: string | null;
          target_code: string;
          target_name: string;
          target_description: string;
          target_amount: number;
          target_currency: string;
          target_active: boolean;
          target_businesses: number;
          target_products: number;
          target_themes: number;
          target_retention: number;
          target_domains: boolean;
          target_reason: string;
        };
        Returns: string;
      };
      admin_adjust_subscription: {
        Args: {
          target_id: string;
          target_operation: string;
          target_reason: string;
        };
        Returns: undefined;
      };
      admin_grant_plan: {
        Args: {
          target_business: string;
          target_plan: string;
          target_reason: string;
        };
        Returns: undefined;
      };
      admin_set_business_suspension: {
        Args: {
          target_id: string;
          target_suspended: boolean;
          target_reason: string;
        };
        Returns: undefined;
      };
      admin_note_refund: {
        Args: {
          target_payment: string;
          target_reason: string;
        };
        Returns: undefined;
      };
      business_role: {
        Args: { target_business_id: string };
        Returns: string;
      };
      is_business_member: {
        Args: { target_business_id: string };
        Returns: boolean;
      };
      has_business_role: {
        Args: { target_business_id: string; allowed_roles: string[] };
        Returns: boolean;
      };
      business_is_public: {
        Args: { target_business_id: string };
        Returns: boolean;
      };
      category_is_public: {
        Args: { target_category_id: string };
        Returns: boolean;
      };
      product_is_public: {
        Args: { target_product_id: string };
        Returns: boolean;
      };
      published_menu_slug: {
        Args: { target_slug: string };
        Returns: string;
      };
      entitled_menu_theme: {
        Args: { target_business_id: string; stored_theme: string };
        Returns: string;
      };
      business_product_limit: {
        Args: { target_business_id: string };
        Returns: number;
      };
      owner_business_capacity: {
        Args: { target_owner: string };
        Returns: number;
      };
      account_subscription: {
        Args: { target_business_id: string };
        Returns: {
          subscription_id: string;
          business_id: string;
          plan_id: string;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          requested_plan_id: string | null;
        }[];
      };
      theme_is_allowed: {
        Args: { target_business_id: string; theme: string };
        Returns: boolean;
      };
      custom_domains_allowed: {
        Args: { target_business_id: string };
        Returns: boolean;
      };
      analytics_visible_from: {
        Args: { target_business_id: string };
        Returns: string;
      };
      record_public_analytics: {
        Args: {
          target_slug: string;
          target_event: string;
          target_product_id: string | null;
          target_device: string;
          target_referrer: string;
          target_visitor_hash: string;
        };
        Returns: boolean;
      };
      business_analytics_summary: {
        Args: {
          target_business_id: string;
          range_start: string;
          range_end: string;
        };
        Returns: Json;
      };
      register_platform_host: {
        Args: { target_hostname: string };
        Returns: undefined;
      };
      submit_custom_domain: {
        Args: { target_business_id: string; target_hostname: string };
        Returns: string;
      };
      begin_domain_check: {
        Args: { target_id: string };
        Returns: Json;
      };
      confirm_custom_domain: {
        Args: { target_id: string; observed_token: string };
        Returns: string;
      };
      activate_custom_domain: {
        Args: { target_id: string };
        Returns: undefined;
      };
      active_menu_host: {
        Args: { target_host: string };
        Returns: string;
      };
      sync_business_domains: {
        Args: { target_business_id: string };
        Returns: undefined;
      };
      maintain_public_analytics: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      complete_paypal_payment: {
        Args: {
          target_payment_id: string;
          order_id: string;
          capture_id: string;
          captured_amount_cents: number;
          captured_currency: string;
        };
        Returns: string;
      };
      refund_paypal_payment: {
        Args: { target_payment_id: string; refund_id: string };
        Returns: string;
      };
      record_paypal_event: {
        Args: { event_id: string; event_type: string; target_payment: string };
        Returns: boolean;
      };
      claim_email_delivery: {
        Args: {
          target_key: string;
          target_email: string;
          target_template: string;
          target_business: string | null;
          target_subscription: string | null;
          target_payment: string | null;
        };
        Returns: string;
      };
      finish_email_delivery: {
        Args: {
          target_id: string;
          target_status: string;
          target_provider_id: string;
          target_error: string;
        };
        Returns: undefined;
      };
      claim_subscription_reminder: {
        Args: {
          target_subscription: string;
          target_period_end: string;
          target_type: string;
        };
        Returns: string;
      };
      finish_subscription_reminder: {
        Args: {
          target_id: string;
          target_status: string;
          target_log: string | null;
        };
        Returns: undefined;
      };
      expire_due_subscriptions: {
        Args: Record<string, never>;
        Returns: number;
      };
      published_business: {
        Args: { target_slug: string };
        Returns: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          currency: string;
          business_type: string;
          logo_path: string | null;
          cover_path: string | null;
          phone: string | null;
          address: string | null;
          map_url: string | null;
          opening_hours: Json;
          social_links: Json;
          default_language: string;
          time_zone: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
